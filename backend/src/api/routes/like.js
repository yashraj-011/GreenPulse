// backend/src/api/routes/like.js
import express from "express";
import prisma from "../../config/prisma.js";
import { authenticateJWT } from "../../middleware/auth.js";
import { awardPoints } from "../../services/pointsService.js";

const router = express.Router();

/**
 * Toggle like for a report
 * body: { reportId: string }
 */
router.post("/", authenticateJWT, async (req, res, next) => {
  try {
    const { reportId } = req.body;
    if (!reportId) {
      return res.status(400).json({ message: "reportId required" });
    }

    const existing = await prisma.like.findUnique({
      where: {
        userId_reportId: {
          userId: req.userId,
          reportId,
        },
      },
      include: {
        report: true,
      },
    });

    if (existing) {
      // UNLIKE
      await prisma.like.delete({
        where: { id: existing.id },
      });

      return res.json({ liked: false });
    }

    // NEW LIKE
    const like = await prisma.like.create({
      data: {
        userId: req.userId,
        reportId,
      },
      include: {
        report: true,
      },
    });

    // award points:
    //  - report owner gets +2
    //  - liker gets +1
    if (like.report?.userId) {
      await awardPoints(like.report.userId, 2, "like_received", {
        fromUserId: req.userId,
        reportId,
      });
    }

    await awardPoints(req.userId, 1, "like_given", { reportId });

    res.json({ liked: true });
  } catch (err) {
    next(err);
  }
});

export default router;
