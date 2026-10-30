import { Router } from "express";
import Stripe from "stripe";
import { db } from "../db.js";
import { requireAuth } from "../middleware/requireAuth.js";
import {
  STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET,
  CLIENT_URL,
} from "../config.js";
import { getIo } from "../socket.js";
import { CURRENCY_VND } from "../constants.js";

const router = Router();
const stripe = new Stripe(STRIPE_SECRET_KEY);

/**
 * POST /api/payments/create-session
 * Creates a Stripe Checkout Session for an existing order.
 */
router.post("/create-session", requireAuth, async (req, res) => {
  const { orderId, couponCode } = req.body;

  const order = db.orders.find((o) => o.id === Number(orderId));
  if (!order) return res.status(404).json({ error: "Order not found" });
  if (order.userId !== req.user.id)
    return res.status(403).json({ error: "Access denied" });
  if (order.paymentStatus === "paid")
    return res.status(400).json({ error: "Order already paid" });
  if (new Date() > new Date(order.expiresAt))
    return res.status(400).json({ error: "Payment window expired" });

  const coupon = couponCode
    ? db.coupons.find((c) => c.code === couponCode)
    : null;
  if (couponCode && !coupon)
    return res.status(400).json({ error: "Invalid coupon code" });

  if (coupon) {
    const stripeCoupon = await stripe.coupons.retrieve(coupon.stripeCouponId);
    if (!stripeCoupon.valid)
      return res.status(400).json({ error: "Coupon is no longer active" });
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: order.items.map((item) => ({
      price_data: {
        currency: CURRENCY_VND,
        product_data: { name: item.name },
        unit_amount: item.priceSnapshot,
      },
      quantity: item.quantity,
    })),
    mode: "payment",
    success_url: `${CLIENT_URL}/orders?payment=success`,
    cancel_url: `${CLIENT_URL}/orders?payment=cancelled`,
    metadata: { orderId: String(order.id) },
    invoice_creation: { enabled: true },
    ...(coupon && { discounts: [{ coupon: coupon.stripeCouponId }] }),
  });

  // UI display only for OrdersPage — real discount is applied by Stripe via session.discounts above
  if (coupon) {
    order.couponCode = coupon.code;
    order.discountAmount =
      coupon.discountType === "percent"
        ? Math.round(order.totalPrice * (coupon.discountValue / 100))
        : coupon.discountValue;
  } else {
    order.couponCode = null;
    order.discountAmount = 0;
  }

  res.json({ url: session.url });
});

/**
 * GET /api/payments/invoice/:orderId
 * Returns the Stripe invoice PDF URL for a paid order.
 */
router.get("/invoice/:orderId", requireAuth, async (req, res) => {
  const order = db.orders.find((o) => o.id === Number(req.params.orderId));
  if (!order) return res.status(404).json({ error: "Order not found" });
  if (order.userId !== req.user.id)
    return res.status(403).json({ error: "Access denied" });
  if (!order.stripeInvoiceId)
    return res.status(404).json({ error: "Invoice not available" });

  try {
    const invoice = await stripe.invoices.retrieve(order.stripeInvoiceId);
    res.json({ url: invoice.invoice_pdf });
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve invoice" });
  }
});

/**
 * POST /api/payments/webhook
 * Receives Stripe webhook events and updates order payment status.
 */
router.post("/webhook", (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;

  // Verify the webhook signature, is that event is from Stripe or not
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orderId = Number(session.metadata.orderId);
    const order = db.orders.find((o) => o.id === orderId);
    if (order) {
      order.paymentStatus = "paid";
      order.paidAt = new Date().toISOString();
      order.stripeInvoiceId = session.invoice;
      order.stripePaymentIntentId = session.payment_intent;
      order.finalPrice = session.amount_total;

      getIo().to(`user:${order.userId}`).emit("order:paid", { orderId });
    }
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object;
    const orderId = Number(session.metadata.orderId);
    const order = db.orders.find((o) => o.id === orderId);
    if (order && order.paymentStatus === "unpaid") {
      order.paymentStatus = "expired";
      order.items.forEach((item) => {
        const product = db.products.find((p) => p.id === item.productId);
        if (product) product.amount += item.quantity;
      });
      if (order.userId) {
        getIo().to(`user:${order.userId}`).emit("order:expired", { orderId });
      }
    }
  }

  if (event.type === "charge.refund.updated") {
    const refund = event.data.object;
    if (refund.status === "failed") {
      const order = db.orders.find((o) => o.refundId === refund.id);
      if (order) {
        order.paymentStatus = "paid";
        order.status = "Pending";
        order.refundId = null;
        order.refundedAt = null;
        const report = db.reports.find(
          (r) => r.orderId === order.id && r.status === "resolved"
        );
        if (report) {
          report.status = "open";
          report.updatedAt = new Date().toISOString();
        }
      }
    }
  }

  res.json({ received: true });
});

export default router;
