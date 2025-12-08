import express from "express";
import prisma from "../../config/prisma.js";
import { authenticateJWT } from "../../middleware/auth.js";

const router = express.Router();

/**
 * POST /api/reports
 * Create a pollution report
 */
router.post("/", authenticateJWT, async (req, res) => {
  try {
    const { title, description, city, stationName } = req.body;

    const report = await prisma.report.create({
      data: {
        title,
        description,
        city,
        stationName,
        user: {
          connect: { id: req.userId }   // ⭐ Correct Prisma relation
        }
      },
    });

    return res.json({ success: true, id: report.id });
  } catch (err) {
    console.error("Report create error:", err);
    res.status(500).json({ message: "Failed to create report" });
  }
});

/**
 * GET /api/reports
 */
router.get("/", async (_, res) => {
  const reports = await prisma.report.findMany({
    orderBy: { createdAt: "desc" },
  });
  res.json(reports);
});

export default router;
