import express from "express";
import prisma from "../../config/prisma.js";

const router = express.Router();

// -------------------------------------------------------------
// GET TOP HEROES (Leaderboard)
// -------------------------------------------------------------
router.get("/", async (req, res) => {
  try {
    const heroes = await prisma.user.findMany({
      orderBy: { points: "desc" },
      take: 10, // top 10 leaderboard
      select: {
        id: true,
        displayName: true,
        points: true,
        _count: {
          select: { reports: true }
        }
      }
    });

    res.json({
      success: true,
      heroes: heroes.map(h => ({
        id: h.id,
        displayName: h.displayName,
        points: h.points,
        reportsCount: h._count.reports
      }))
    });

  } catch (err) {
    console.error("HEROES API ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to load heroes" });
  }
});

export default router;
