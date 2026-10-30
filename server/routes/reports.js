import { Router } from "express";
import Stripe from "stripe";
import { body, validationResult } from "express-validator";
import { db } from "../db.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { STRIPE_SECRET_KEY } from "../config.js";

const stripe = new Stripe(STRIPE_SECRET_KEY);

const router = Router();

function validate(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ error: errors.array()[0].msg });
    return false;
  }
  return true;
}

/**
 * POST /api/reports/:id/refund
 * Issues a Stripe refund for the order linked to the report.
 */
router.post("/:id/refund", requireAdmin, async (req, res) => {
  const report = db.reports.find((r) => r.id === Number(req.params.id));
  if (!report) return res.status(404).json({ error: "Report not found" });
  if (report.status === "resolved" || report.status === "rejected")
    return res.status(400).json({ error: "Report already closed" });

  const order = db.orders.find((o) => o.id === report.orderId);
  if (!order) return res.status(404).json({ error: "Order not found" });
  if (order.paymentStatus === "refunded")
    return res.status(400).json({ error: "Order already refunded" });
  if (!order.stripePaymentIntentId)
    return res.status(400).json({ error: "No payment intent found for this order" });

  report.status = "in_progress";
  report.updatedAt = new Date().toISOString();
  order.paymentStatus = "refunding";

  try {
    const refund = await stripe.refunds.create({
      payment_intent: order.stripePaymentIntentId,
    });
    order.paymentStatus = "refunded";
    order.status = "cancelled";
    order.refundId = refund.id;
    order.refundedAt = new Date().toISOString();
    report.status = "resolved";
    report.updatedAt = new Date().toISOString();
    order.items.forEach((item) => {
      const product = db.products.find((p) => p.id === item.productId);
      if (product) product.amount += item.quantity;
    });
    res.json({ refundId: refund.id, status: refund.status });
  } catch (err) {
    order.paymentStatus = "paid";
    report.status = "open";
    report.updatedAt = new Date().toISOString();
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/reports
 * Creates a report for a paid order.
 */
router.post("/", requireAuth, async (req, res) => {
  const { orderId, reason, description } = req.body;

  if (!orderId || !reason)
    return res.status(400).json({ error: "orderId and reason are required" });

  const order = db.orders.find((o) => o.id === Number(orderId));
  if (!order) return res.status(404).json({ error: "Order not found" });
  if (order.userId !== req.user.id)
    return res.status(403).json({ error: "Access denied" });
  if (order.paymentStatus === "refunding")
    return res.status(400).json({ error: "Refund already in progress for this order" });
  if (order.paymentStatus === "refunded")
    return res.status(400).json({ error: "Order already refunded" });
  if (order.paymentStatus !== "paid")
    return res.status(400).json({ error: "Can only report paid orders" });

  const existing = db.reports.find(
    (r) => r.orderId === Number(orderId) && r.userId === req.user.id
  );
  if (existing) return res.status(400).json({ error: "You already reported this order" });

  const report = {
    id: db.nextReportId++,
    orderId: Number(orderId),
    userId: req.user.id,
    reason,
    description: description || "",
    status: "open",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.reports.push(report);

  res.status(201).json(report);
});

/**
 * GET /api/reports
 * Returns all reports enriched with user and order data (admin) or own reports (user).
 */
router.get("/", requireAuth, (req, res) => {
  if (req.user.role === "admin") {
    const enriched = db.reports.map((r) => {
      const order = db.orders.find((o) => o.id === r.orderId);
      const user = db.users.find((u) => u.id === r.userId);
      return {
        ...r,
        userName: user?.name || "Unknown",
        userEmail: user?.email || "Unknown",
        orderTotal: order?.finalPrice ?? order?.totalPrice ?? 0,
      };
    });
    return res.json(enriched);
  }
  res.json(db.reports.filter((r) => r.userId === req.user.id));
});

/**
 * PATCH /api/reports/:id
 * Updates report status (admin only).
 */
router.patch(
  "/:id",
  requireAdmin,
  body("status")
    .isIn(["open", "in_progress", "resolved", "rejected"])
    .withMessage("Status must be one of: open, in_progress, resolved, rejected"),
  (req, res) => {
    if (!validate(req, res)) return;

    const { status } = req.body;
    const report = db.reports.find((r) => r.id === Number(req.params.id));
    if (!report) return res.status(404).json({ error: "Report not found" });

    const transitions = {
      open: ["in_progress", "rejected"],
      in_progress: ["resolved", "rejected"],
    };
    if (!transitions[report.status]?.includes(status))
      return res.status(400).json({ error: `Cannot transition from ${report.status} to ${status}` });

    report.status = status;
    report.updatedAt = new Date().toISOString();
    res.json(report);
  }
);

export default router;
