import express from "express";
import prisma from "../../config/prisma.js";

const router = express.Router();

// Fix: Allow GET on both /api/aqi and /api/aqi/
router.get(["/", ""], async (req, res) => {
  try {
    const all = await prisma.aqiData.findMany({
      orderBy: { createdAt: "desc" },
      take: 200
    });
    res.json({ success: true, data: all });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// Save AQI
router.post("/save", async (req, res) => {
  try {
    const { city, stationName, value, category } = req.body;

    const row = await prisma.aqiData.create({
      data: { city, stationName, aqiValue: value, category }
    });

    res.json({ success: true, row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
