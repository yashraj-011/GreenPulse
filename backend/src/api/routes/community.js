// backend/src/api/routes/community.js
import express from "express";
import prisma from "../../config/prisma.js";

const router = express.Router();

// ---------------------------------------
// Helper: build trending / AI-ish updates
// ---------------------------------------
async function buildAutoUpdates() {
  const since = new Date();
  since.setDate(since.getDate() - 2); // last 48h reports

  const grouped = await prisma.report.groupBy({
    by: ["city"],
    where: {
      createdAt: { gte: since },
      city: { not: null },
    },
    _count: { _all: true },
  });

  const auto = [];

  for (const g of grouped) {
    if (!g.city) continue;
    const count = g._count._all;

    if (count >= 3) {
      auto.push({
        id: `auto-${g.city}`,
        title: `Multiple air quality incidents reported in ${g.city}`,
        meta: `${count} community reports in last 48 hours · Auto-generated`,
        category: "trending",
        createdAt: new Date().toISOString(),
        isAuto: true,
      });
    }
  }

  // If no trending, add one generic helpful tip:
  if (auto.length === 0) {
    auto.push({
      id: "auto-tip-1",
      title: "Tip: Prefer walking/cycling on low AQI days to earn extra points!",
      meta: "Gamification · Auto-generated",
      category: "tip",
      createdAt: new Date().toISOString(),
      isAuto: true,
    });
  }

  return auto;
}

// ---------------------------------------
// GET /community/local-updates
// ---------------------------------------
router.get("/local-updates", async (req, res, next) => {
  try {
    const dbUpdates = await prisma.localUpdate.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const auto = await buildAutoUpdates();

    const updates = [
      ...auto,
      ...dbUpdates.map((u) => ({
        id: u.id,
        title: u.title,
        meta: u.meta ?? "",
        category: u.category ?? "info",
        createdAt: u.createdAt,
        isAuto: false,
      })),
    ];

    res.json({ updates });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------
// GET /community/heroes  (leaderboard)
// ---------------------------------------
router.get("/heroes", async (req, res, next) => {
  try {
    const heroesRaw = await prisma.user.findMany({
      select: {
        id: true,
        displayName: true,
        points: true,
        reports: { select: { id: true } },
      },
      orderBy: {
        points: "desc",
      },
      take: 20,
    });

    const heroes = heroesRaw.map((u) => ({
      id: u.id,
      displayName: u.displayName || "User",
      points: u.points,
      reportsCount: u.reports.length,
    }));

    res.json({ heroes });
  } catch (err) {
    next(err);
  }
});

export default router;
