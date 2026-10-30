import { Router } from "express";
import { db } from "../db.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = Router();

/**
 * GET /api/products
 * Returns all products.
 */
router.get("/", (req, res) => {
  res.json(db.products);
});

/**
 * GET /api/products/:id
 * Returns a single product by ID.
 */
router.get("/:id", (req, res) => {
  const product = db.products.find((p) => p.id === Number(req.params.id));
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json(product);
});

/**
 * GET /api/products/:id/reviews
 * Returns reviews for a product with averageRating.
 */
router.get("/:id/reviews", (req, res) => {
  const productId = Number(req.params.id);
  const product = db.products.find((p) => p.id === productId);
  if (!product) return res.status(404).json({ error: "Product not found" });

  const reviews = db.reviews.filter((r) => r.productId === productId);
  const averageRating =
    reviews.length > 0
      ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
      : null;

  res.json({ reviews, averageRating, total: reviews.length });
});

/**
 * POST /api/products
 * Creates a new product.
 */
router.post("/", requireAdmin, (req, res) => {
  const { name, code, medias, price, amount } = req.body;

  if (!name || !code || price == null || amount == null) {
    return res
      .status(400)
      .json({ error: "name, code, price and amount are required" });
  }

  const product = {
    id: db.nextProductId++,
    name,
    code,
    medias: medias || [],
    price,
    amount,
  };

  db.products.push(product);
  res.status(201).json(product);
});

/**
 * PUT /api/products/:id
 * Updates a product by ID.
 */
router.put("/:id", requireAdmin, (req, res) => {
  const product = db.products.find((p) => p.id === Number(req.params.id));
  if (!product) return res.status(404).json({ error: "Product not found" });

  const { name, code, medias, price, amount } = req.body;
  if (name != null) product.name = name;
  if (code != null) product.code = code;
  if (medias != null) product.medias = medias;
  if (price != null) product.price = price;
  if (amount != null) product.amount = amount;

  res.json(product);
});

/**
 * DELETE /api/products/:id
 * Deletes a product by ID.
 */
router.delete("/:id", requireAdmin, (req, res) => {
  const index = db.products.findIndex((p) => p.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ error: "Product not found" });

  db.products.splice(index, 1);
  db.carts.forEach((cart) => {
    cart.items = cart.items.filter(
      (item) => item.productId !== Number(req.params.id)
    );
  });

  res.json({ message: "Product deleted" });
});

export default router;
