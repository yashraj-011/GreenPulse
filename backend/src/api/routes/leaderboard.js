import express from "express";
import prisma from "../../config/prisma.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const heroes = await prisma.user.findMany({
      select: {
        id: true,
        displayName: true,
        createdAt: true,
        reports: true
      }
    });

    const ranked = heroes
      .map((u) => ({
        id: u.id,
        name: u.displayName ?? "User",
        reports: u.reports.length
      }))
      .sort((a, b) => b.reports - a.reports);

    res.json({ success: true, heroes: ranked });
  } catch (err) {
    console.log("🔴 Leaderboard error:", err.message);
    res.status(500).json({ success: false });
  }
});

export default router;
