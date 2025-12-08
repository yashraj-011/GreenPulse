// backend/src/api/routes/comment.js
import express from "express";
import prisma from "../../config/prisma.js";
import { authenticateJWT } from "../../middleware/auth.js";
import { awardPoints } from "../../services/pointsService.js";

const router = express.Router();

/**
 * Create a comment on a report
 * body: { reportId, text }
 */
router.post("/", authenticateJWT, async (req, res, next) => {
  try {
    const { reportId, text } = req.body;
    if (!reportId || !text?.trim()) {
      return res
        .status(400)
        .json({ message: "reportId and text are required" });
    }

    const report = await prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    const comment = await prisma.comment.create({
      data: {
        reportId,
        userId: req.userId,
        text: text.trim(),
      },
    });

    // award points
    await awardPoints(req.userId, 3, "comment_given", {
      reportId,
      commentId: comment.id,
    });

    if (report.userId) {
      await awardPoints(report.userId, 2, "comment_received", {
        fromUserId: req.userId,
        reportId,
        commentId: comment.id,
      });
    }

    res.json(comment);
  } catch (err) {
    next(err);
  }
});

/**
 * Get comments for a report
 */
router.get("/report/:reportId", authenticateJWT, async (req, res, next) => {
  try {
    const { reportId } = req.params;

    const comments = await prisma.comment.findMany({
      where: { reportId },
      include: {
        user: { select: { displayName: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    res.json(comments);
  } catch (err) {
    next(err);
  }
});

/**
 * Optional: delete comment (only owner or later admin)
 */
router.delete("/:id", authenticateJWT, async (req, res, next) => {
  try {
    const comment = await prisma.comment.findUnique({
      where: { id: req.params.id },
    });

    if (!comment) return res.status(404).json({ message: "Not found" });
    if (comment.userId !== req.userId)
      return res.status(403).json({ message: "Forbidden" });

    await prisma.comment.delete({
      where: { id: req.params.id },
    });

    res.json({ message: "Deleted" });
  } catch (err) {
    next(err);
  }
});

export default router;
