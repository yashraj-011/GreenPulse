import express from "express";
import prisma from "../../config/prisma.js";
import { authenticateJWT } from "../../middleware/auth.js";

const router = express.Router();

/* -----------------------------------------------------
   1️⃣ LOG AN ACTION (WALKING, CYCLING, ECO-FRIENDLY TASKS)
------------------------------------------------------ */
router.post("/log-action", authenticateJWT, async (req, res) => {
  try {
    const userId = req.userId;
    const { type, metadata, creditsEarned, footprintReduced } = req.body;

    const action = await prisma.action.create({
      data: {
        userId,
        type,
        metadata,
        creditsEarned: creditsEarned ?? 0,
        footprintReduced: footprintReduced ?? 0
      }
    });

    // Update user totals
    await prisma.user.update({
      where: { id: userId },
      data: {
        greenCredits: { increment: creditsEarned ?? 0 },
        totalFootprint: { increment: footprintReduced ?? 0 }
      }
    });

    res.json({ success: true, action });
  } catch (err) {
    console.error("log-action error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/* -----------------------------------------------------
   2️⃣ ADD GREEN CREDITS DIRECTLY
------------------------------------------------------ */
router.post("/earn", authenticateJWT, async (req, res) => {
  try {
    const userId = req.userId;
    const { amount } = req.body;

    if (!amount || amount <= 0)
      return res.status(400).json({ error: "Invalid credit amount" });

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { greenCredits: { increment: amount } }
    });

    res.json({ success: true, updated });
  } catch (err) {
    console.error("earn credits error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/* -----------------------------------------------------
   3️⃣ SPEND GREEN CREDITS
------------------------------------------------------ */
router.post("/spend", authenticateJWT, async (req, res) => {
  try {
    const userId = req.userId;
    const { amount } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (user.greenCredits < amount)
      return res.status(400).json({ error: "Not enough credits" });

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { greenCredits: { decrement: amount } }
    });

    res.json({ success: true, updated });
  } catch (err) {
    console.error("spend credits error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/* -----------------------------------------------------
   4️⃣ FOOTPRINT UPDATE
------------------------------------------------------ */
router.post("/footprint/update", authenticateJWT, async (req, res) => {
  try {
    const userId = req.userId;
    const { amount } = req.body;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { totalFootprint: { increment: amount } }
    });

    res.json({ success: true, updated });
  } catch (err) {
    console.error("footprint update error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/* -----------------------------------------------------
   5️⃣ LEADERBOARD (Top 20 users)
------------------------------------------------------ */
router.get("/leaderboard", async (req, res) => {
  try {
    const board = await prisma.user.findMany({
      orderBy: { greenCredits: "desc" },
      take: 20,
      select: {
        id: true,
        displayName: true,
        greenCredits: true,
        totalFootprint: true
      }
    });

    res.json({ success: true, leaderboard: board });
  } catch (err) {
    console.error("leaderboard error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/ping", (req, res) => {
  res.json({ msg: "Gamification route loaded!" });
});


export default router;
