import "dotenv/config";

if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not set in .env");
if (!process.env.REFRESH_SECRET) throw new Error("REFRESH_SECRET is not set in .env");

export const PORT = 3001;
export const JWT_SECRET = process.env.JWT_SECRET;
export const REFRESH_SECRET = process.env.REFRESH_SECRET;
export const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";
export const CLIENT_URL = "http://localhost:5173";
