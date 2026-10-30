import { Router } from "express";
import { db } from "../db.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = Router();

/**
 * GET /api/users
 * Returns all users without passwords (admin only).
 */
router.get("/", requireAdmin, (req, res) => {
  const safeUsers = db.users.map(({ password, ...rest }) => rest);
  res.json(safeUsers);
});

export default router;
