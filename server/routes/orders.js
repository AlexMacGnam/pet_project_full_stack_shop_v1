import { Router } from "express";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import { db } from "../db.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { JWT_SECRET } from "../config.js";

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
 * GET /api/orders
 * Returns orders for the authenticated user, or an empty array for guests.
 */
router.get("/", (req, res) => {
  const header = req.headers.authorization;
  if (!header) return res.json([]);

  try {
    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const userOrders = db.orders.filter((o) => o.userId === decoded.id);
    res.json(userOrders);
  } catch {
    res.json([]);
  }
});

/**
 * POST /api/orders
 * Creates a new order. Works for both authenticated users and guests.
 */
router.post("/",
  body("address").trim().notEmpty().withMessage("Address is required"),
  body("items").isArray({ min: 1 }).withMessage("Items must be a non-empty array"),
  (req, res) => {
  const { name, email, address, items, totalPrice, cartId } = req.body;

  const header = req.headers.authorization;
  let userId = null;
  let userName = name;
  let userEmail = email;

  if (header) {
    try {
      const token = header.split(" ")[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      userId = decoded.id;
      userName = decoded.name;
      userEmail = decoded.email;
    } catch {}
  }

  if (!validate(req, res)) return;

  if (!userName || !userEmail) {
    return res.status(400).json({ error: "Please fill in all fields" });
  }

  for (const item of items) {
    const product = db.products.find((p) => p.id === item.productId);
    if (!product || product.amount < item.quantity) {
      return res
        .status(400)
        .json({ error: `Not enough stock for ${item.name}` });
    }
  }

  const order = {
    id: db.nextOrderId++,
    userId,
    cartId: cartId || null,
    name: userName,
    email: userEmail,
    address,
    items,
    totalPrice: items.reduce((sum, item) => {
      const product = db.products.find((p) => p.id === item.productId);
      return (
        sum + (product ? product.price : item.priceSnapshot) * item.quantity
      );
    }, 0),

    status: "Pending",
    paymentStatus: "unpaid",
    paidAt: null,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  };

  items.forEach((item) => {
    const product = db.products.find((p) => p.id === item.productId);
    if (product) product.amount = Math.max(0, product.amount - item.quantity);
  });

  db.orders.push(order);
  res.status(201).json(order);
});

/**
 * GET /api/orders/:id
 * Returns a single order by ID. Only accessible by the order owner.
 */
router.get("/:id", requireAuth, (req, res) => {
  const order = db.orders.find((o) => o.id === Number(req.params.id));
  if (!order) return res.status(404).json({ error: "Order not found" });
  if (order.userId !== req.user.id)
    return res.status(403).json({ error: "Access denied" });
  res.json(order);
});

export default router;
