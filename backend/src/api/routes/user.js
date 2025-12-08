import express from "express";
import prisma from "../../config/prisma.js";
import { authenticateJWT } from "../../middleware/auth.js";

const router = express.Router();

// GET USER PROFILE
router.get("/profile", authenticateJWT, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        greenCredits: true,
        totalFootprint: true,
        createdAt: true
      }
    });

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
