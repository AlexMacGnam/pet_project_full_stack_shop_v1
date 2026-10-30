import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import { db } from "../db.js";
import { generateTokens } from "../utils/tokens.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { REFRESH_SECRET } from "../config.js";

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
 * POST /api/auth/register
 * Creates a new user account. Returns email for OTP verification.
 */
router.post(
  "/register",
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  async (req, res) => {
    const { name, email, password } = req.body;

    if (!validate(req, res)) return;

    if (db.users.find((u) => u.email === email)) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = {
      id: db.nextUserId++,
      name,
      email,
      password: hashedPassword,
      verified: false,
      role: "user",
    };
    db.users.push(user);
    db.otps.set(email, "1234");

    res.status(201).json({
      message: "Registration successful. Please verify your account.",
      email,
    });
  }
);

/**
 * POST /api/auth/login
 * Validates credentials and returns tokens.
 * Returns 403 with email if account is not verified.
 */
router.post(
  "/login",
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
  async (req, res) => {
    const { email, password } = req.body;

    if (!validate(req, res)) return;

    const user = db.users.find((u) => u.email === email);
    if (!user)
      return res.status(400).json({ error: "Invalid email or password" });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(400).json({ error: "Invalid email or password" });

    if (!user.verified) {
      db.otps.set(user.email, "1234");
      return res
        .status(403)
        .json({ error: "Account not verified", email: user.email });
    }

    const { accessToken, refreshToken } = generateTokens(user);
    db.refreshTokens.set(refreshToken, user.id);

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  }
);

/**
 * POST /api/auth/refresh
 * Validates refresh token and returns a new access token.
 * If a token with a valid signature is presented but is missing from the
 * registry, it means it was already rotated out — a reuse attempt, most
 * likely a stolen token. In that case every refresh token belonging to the
 * user is revoked, forcing a fresh login on all devices.
 */
router.post("/refresh", (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(401).json({ error: "Invalid refresh token" });
  }

  // Verify the refresh token and check if it's in the registry
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, REFRESH_SECRET);
  } catch {
    db.refreshTokens.delete(refreshToken);
    return res
      .status(401)
      .json({ error: "Invalid or expired refresh token, please login again" });
  }

  //reuse detection: if the token is valid but not in the registry, it was already rotated out
  if (!db.refreshTokens.has(refreshToken)) {
    for (const [token, userId] of db.refreshTokens) {
      if (userId === decoded.id) db.refreshTokens.delete(token);
    }
    return res
      .status(401)
      .json({ error: "Session revoked, please login again" });
  }

  // Token is valid and in the registry, issue new tokens and rotate the refresh token
  const tokens = generateTokens(decoded);
  db.refreshTokens.delete(refreshToken);
  db.refreshTokens.set(tokens.refreshToken, decoded.id);
  res.json({
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  });
});

/**
 * POST /api/auth/logout
 * Removes refresh token from the server, invalidating the session.
 */
router.post("/logout", (req, res) => {
  const { refreshToken } = req.body;
  db.refreshTokens.delete(refreshToken);
  res.json({ message: "Logged out" });
});

/**
 * POST /api/auth/verify-otp
 * Verifies OTP code and activates the user account.
 */
router.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: "Email and OTP are required" });
  }

  const savedOtp = db.otps.get(email);
  if (!savedOtp || savedOtp !== otp) {
    return res.status(400).json({ error: "Invalid OTP" });
  }

  const user = db.users.find((u) => u.email === email);
  if (!user) return res.status(404).json({ error: "User not found" });

  user.verified = true;
  db.otps.delete(email);

  const { accessToken, refreshToken } = generateTokens(user);
  db.refreshTokens.set(refreshToken, user.id);

  res.json({
    accessToken,
    refreshToken,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

/**
 * GET /api/auth/me
 * Returns the current user decoded from the JWT token.
 */
router.get("/me", requireAuth, (req, res) => {
  res.json(req.user);
});

/**
 * POST /api/auth/forgot
 * Saves a password-reset OTP for the given email.
 */
router.post("/forgot", (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  const user = db.users.find((u) => u.email === email);
  if (!user) return res.status(404).json({ error: "User not found" });

  db.otps.set(`forgot:${email}`, "1234");
  res.json({ message: "OTP sent", email });
});

/**
 * POST /api/auth/verify-otp-forgot
 * Verifies OTP and returns a short-lived resetToken for changing password.
 */
router.post("/verify-otp-forgot", (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp)
    return res.status(400).json({ error: "Email and OTP are required" });

  const savedOtp = db.otps.get(`forgot:${email}`);
  if (!savedOtp || savedOtp !== otp)
    return res.status(400).json({ error: "Invalid OTP" });

  db.otps.delete(`forgot:${email}`);
  const resetToken = `reset:${email}:${Date.now()}`;
  db.otps.set(resetToken, email);
  res.json({ resetToken });
});

/**
 * POST /api/auth/change-password
 * Changes the user password using a valid resetToken.
 */
router.post("/change-password", async (req, res) => {
  const { resetToken, password } = req.body;
  if (!resetToken || !password)
    return res
      .status(400)
      .json({ error: "Reset token and password are required" });

  const email = db.otps.get(resetToken);
  if (!email)
    return res.status(400).json({ error: "Invalid or expired reset token" });

  const user = db.users.find((u) => u.email === email);
  if (!user) return res.status(404).json({ error: "User not found" });

  user.password = await bcrypt.hash(password, 10);
  db.otps.delete(resetToken);
  res.json({ message: "Password changed successfully" });
});

export default router;
