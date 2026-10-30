import { PRODUCTS } from "../src/data/products.js";
import bcrypt from "bcrypt";

const adminPassword = await bcrypt.hash("admin123", 10);

/** In-memory storage — resets on server restart */
export const db = {
  users: [
    {
      id: 1,
      name: "Admin",
      email: "admin@shop.com",
      password: adminPassword,
      role: "admin",
      verified: true,
    },
  ],
  nextUserId: 2,
  orders: [],
  nextOrderId: 1,
  refreshTokens: new Map(), // token -> userId
  otps: new Map(),
  // products: [],  - will be main data source for products
  products: PRODUCTS.map((p) => ({
    id: p.id,
    name: p.name,
    code: p.name.toLowerCase().replace(/\s+/g, "-"),
    medias: [p.image],
    price: p.price,
    amount: p.amount,
  })),
  nextProductId: PRODUCTS.length + 1,
  carts: [],
  reports: [],
  nextReportId: 1,
  coupons: [],
  reviews: [],
  nextReviewId: 1,
};
