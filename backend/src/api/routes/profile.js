import express from "express";
import prisma from "../../config/prisma.js";
import { authenticateJWT } from "../../middleware/auth.js";

const router = express.Router();

/**
 * ---------------------------------------
 * 1️⃣ GET LOGGED-IN USER PROFILE
 * ---------------------------------------
 */
router.get("/me", authenticateJWT, async (req, res) => {
  try {
    const userId = req.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        greenCredits: true,
        totalFootprint: true,
        createdAt: true,
        updatedAt: true
      },
    });

    res.json({ success: true, user });

  } catch (err) {
    console.error("Profile fetch error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});


/**
 * ---------------------------------------
 * 2️⃣ UPDATE PROFILE (name, email, avatar)
 * ---------------------------------------
 */
router.put("/update", authenticateJWT, async (req, res) => {
  try {
    const userId = req.userId;
    const { displayName, email, avatarUrl } = req.body;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        displayName,
        email,
        avatarUrl  
      },
    });

    res.json({ success: true, updated });

  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});


/**
 * ---------------------------------------
 * 3️⃣ USER DASHBOARD STATS
 * ---------------------------------------
 */
router.get("/stats", authenticateJWT, async (req, res) => {
  try {
    const userId = req.userId;

    const stats = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        greenCredits: true,
        totalFootprint: true,
        reports: { select: { id: true }},
        likes: { select: { id: true }},
        comments: { select: { id: true }},
      }
    });

    res.json({
      success: true,
      stats: {
        greenCredits: stats.greenCredits,
        totalFootprint: stats.totalFootprint,
        postsCount: stats.reports.length,
        likesGiven: stats.likes.length,
        commentsMade: stats.comments.length
      }
    });

  } catch (err) {
    console.error("Stats fetch error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
