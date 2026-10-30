import jwt from "jsonwebtoken";
import { JWT_SECRET, REFRESH_SECRET } from "../config.js";

/**
 * Generates accessToken (15m) and refreshToken (7d) for a user.
 * @param {{ id: number, name: string, email: string }} user
 * @returns {{ accessToken: string, refreshToken: string }}
 */
export function generateTokens(user) {
  const payload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "15m" });
  const refreshToken = jwt.sign(payload, REFRESH_SECRET, { expiresIn: "7d" });
  return { accessToken, refreshToken };
}
