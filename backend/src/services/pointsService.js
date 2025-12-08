// backend/src/services/pointsService.js
import prisma from "../config/prisma.js";

/**
 * Award points & log Action row for gamification.
 * type: "report" | "like" | "comment" | "streak" | etc.
 */
export async function awardPoints(userId, amount, type, metadata = {}) {
  if (!userId || !amount) return;

  try {
    // 1) Increment points
    await prisma.user.update({
      where: { id: userId },
      data: {
        points: { increment: amount },
        greenCredits: { increment: amount }, // optional, nice synergy
      },
    });

    // 2) Log action (for future streaks, analytics)
    await prisma.action.create({
      data: {
        userId,
        type,
        metadata,
        creditsEarned: amount,
        footprintReduced: 0, // you can adjust if needed
      },
    });
  } catch (err) {
    console.error("awardPoints error:", err.message);
  }
}
