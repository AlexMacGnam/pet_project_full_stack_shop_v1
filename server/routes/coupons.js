import { Router } from "express";
import Stripe from "stripe";
import { db } from "../db.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { STRIPE_SECRET_KEY } from "../config.js";
import { CURRENCY_VND } from "../constants.js";

const stripe = new Stripe(STRIPE_SECRET_KEY);
const router = Router();

/**
 * POST /api/coupons
 * Creates a coupon in Stripe and saves it locally.
 */
router.post("/", requireAdmin, async (req, res) => {
  const { code, discountType, discountValue } = req.body;

  if (!code || !discountType || !discountValue)
    return res.status(400).json({ error: "code, discountType and discountValue are required" });
  if (!["percent", "fixed"].includes(discountType))
    return res.status(400).json({ error: "discountType must be 'percent' or 'fixed'" });
  if (discountType === "percent" && (discountValue < 1 || discountValue > 100))
    return res.status(400).json({ error: "percent discountValue must be between 1 and 100" });
  if (discountType === "fixed" && discountValue <= 0)
    return res.status(400).json({ error: "fixed discountValue must be greater than 0" });
  if (db.coupons.find((c) => c.code === code))
    return res.status(400).json({ error: "Coupon code already exists" });

  try {
    const stripeCoupon = await stripe.coupons.create(
      discountType === "percent"
        ? { percent_off: discountValue, duration: "once" }
        : { amount_off: discountValue, currency: CURRENCY_VND, duration: "once" }
    );

    const coupon = {
      code,
      discountType,
      discountValue,
      stripeCouponId: stripeCoupon.id,
      createdAt: new Date().toISOString(),
    };

    db.coupons.push(coupon);
    res.status(201).json(coupon);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/coupons
 * Returns all coupons.
 */
router.get("/", requireAdmin, (req, res) => {
  res.json(db.coupons);
});

/**
 * PUT /api/coupons/:code
 * Updates a coupon by recreating it in Stripe with new values.
 */
router.put("/:code", requireAdmin, async (req, res) => {
  const coupon = db.coupons.find((c) => c.code === req.params.code);
  if (!coupon) return res.status(404).json({ error: "Coupon not found" });

  const { discountType, discountValue } = req.body;
  if (!discountType || !discountValue)
    return res.status(400).json({ error: "discountType and discountValue are required" });
  if (!["percent", "fixed"].includes(discountType))
    return res.status(400).json({ error: "discountType must be 'percent' or 'fixed'" });
  if (discountType === "percent" && (discountValue < 1 || discountValue > 100))
    return res.status(400).json({ error: "percent discountValue must be between 1 and 100" });
  if (discountType === "fixed" && discountValue <= 0)
    return res.status(400).json({ error: "fixed discountValue must be greater than 0" });

  let newStripeCoupon;
  try {
    newStripeCoupon = await stripe.coupons.create(
      discountType === "percent"
        ? { percent_off: discountValue, duration: "once" }
        : { amount_off: discountValue, currency: CURRENCY_VND, duration: "once" }
    );

    await stripe.coupons.del(coupon.stripeCouponId);

    coupon.discountType = discountType;
    coupon.discountValue = discountValue;
    coupon.stripeCouponId = newStripeCoupon.id;

    res.json(coupon);
  } catch (err) {
    if (newStripeCoupon) await stripe.coupons.del(newStripeCoupon.id).catch(() => {});
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/coupons/:code
 * Deletes a coupon from Stripe and locally.
 */
router.delete("/:code", requireAdmin, async (req, res) => {
  const index = db.coupons.findIndex((c) => c.code === req.params.code);
  if (index === -1) return res.status(404).json({ error: "Coupon not found" });

  const coupon = db.coupons[index];

  try {
    await stripe.coupons.del(coupon.stripeCouponId);
    db.coupons.splice(index, 1);
    res.json({ message: "Coupon deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
