import { Router } from "express";
import { body, validationResult } from "express-validator";
import { db } from "../db.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

function validate(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ error: errors.array()[0].msg });
    return false;
  }
  return true;
}

const router = Router();

/**
 * GET /api/reviews
 * Returns all reviews (admin only).
 */
router.get("/", requireAdmin, (req, res) => {
  res.json(db.reviews);
});

/**
 * GET /api/reviews/ratings
 * Returns average rating and total for all products in one batch.
 */
router.get("/ratings", (req, res) => {
  const ratingsMap = {};
  db.reviews.forEach((r) => {
    if (!ratingsMap[r.productId]) ratingsMap[r.productId] = { sum: 0, total: 0 };
    ratingsMap[r.productId].sum += r.rating;
    ratingsMap[r.productId].total += 1;
  });
  const result = {};
  Object.entries(ratingsMap).forEach(([productId, { sum, total }]) => {
    result[productId] = { avg: Math.round((sum / total) * 10) / 10, total };
  });
  res.json(result);
});

/**
 * GET /api/reviews/my
 * Returns all reviews written by the current user.
 */
router.get("/my", requireAuth, (req, res) => {
  const myReviews = db.reviews.filter((r) => r.userId === req.user.id);
  res.json(myReviews);
});

/**
 * POST /api/reviews
 * Create a review. Auth required. Order must be paid. No duplicate per product.
 */
router.post(
  "/",
  requireAuth,
  body("productId").isInt({ min: 1 }).withMessage("productId is required"),
  body("orderId").isInt({ min: 1 }).withMessage("orderId is required"),
  body("rating").isInt({ min: 1, max: 5 }).withMessage("rating must be 1–5"),
  body("comment").optional().isString().trim().isLength({ max: 1000 }),
  (req, res) => {
    if (!validate(req, res)) return;

    const { productId, orderId, rating, comment } = req.body;

    const order = db.orders.find((o) => o.id === Number(orderId));
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.userId !== req.user.id)
      return res.status(403).json({ error: "Access denied" });
    if (order.paymentStatus !== "paid")
      return res.status(400).json({ error: "Can only review paid orders" });

    const hasProduct = order.items.some((i) => i.productId === Number(productId));
    if (!hasProduct)
      return res.status(400).json({ error: "Product not in this order" });

    const duplicate = db.reviews.find(
      (r) => r.userId === req.user.id && r.productId === Number(productId)
    );
    if (duplicate)
      return res.status(409).json({ error: "You already reviewed this product" });

    const review = {
      id: db.nextReviewId++,
      userId: req.user.id,
      userName: req.user.name,
      productId,
      orderId,
      rating,
      comment: comment || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.reviews.push(review);
    res.status(201).json(review);
  }
);

/**
 * PUT /api/reviews/:id
 * Edit own review.
 */
router.put(
  "/:id",
  requireAuth,
  body("rating").optional().isInt({ min: 1, max: 5 }).withMessage("rating must be 1–5"),
  body("comment").optional().isString().trim().isLength({ max: 1000 }),
  (req, res) => {
    if (!validate(req, res)) return;

    const review = db.reviews.find((r) => r.id === Number(req.params.id));
    if (!review) return res.status(404).json({ error: "Review not found" });
    if (review.userId !== req.user.id)
      return res.status(403).json({ error: "Access denied" });

    const { rating, comment } = req.body;
    if (rating !== null && rating !== undefined) review.rating = rating;
    if (comment !== null && comment !== undefined) review.comment = comment;
    review.updatedAt = new Date().toISOString();

    res.json(review);
  }
);

/**
 * DELETE /api/reviews/:id
 * Delete own review or any review (admin).
 */
router.delete("/:id", requireAuth, (req, res) => {
  const index = db.reviews.findIndex((r) => r.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ error: "Review not found" });

  const review = db.reviews[index];
  if (review.userId !== req.user.id && req.user.role !== "admin")
    return res.status(403).json({ error: "Access denied" });

  db.reviews.splice(index, 1);
  res.json({ message: "Review deleted" });
});

export default router;
