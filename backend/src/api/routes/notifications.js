import express from "express";
import prisma from "../../config/prisma.js";
import { authenticateJWT } from "../../middleware/auth.js";

const router = express.Router();

/**
 * -----------------------------------------
 * TEST CREATE NOTIFICATION  (POST)
 * -----------------------------------------
 */
router.post("/test-create", authenticateJWT, async (req, res) => {
  try {
    const userId = req.userId; // from JWT
    const { message, extra } = req.body;

    const notification = await prisma.notification.create({
      data: {
        message,
        extra,
        userId,
      },
    });

    res.json({ success: true, notification });

  } catch (err) {
    console.error("Notification create error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * -----------------------------------------
 * GET Notifications
 * -----------------------------------------
 */
router.get("/", authenticateJWT, async (req, res) => {
  try {
    const userId = req.userId;

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, notifications });

  } catch (err) {
    console.error("Notifications fetch error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * -----------------------------------------
 * MARK AS READ
 * -----------------------------------------
 */
router.put("/mark-read/:id", authenticateJWT, async (req, res) => {
  try {
    const id = req.params.id;

    const updated = await prisma.notification.update({
      where: { id },
      data: { seen: true },
    });

    res.json({ success: true, updated });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
