import express from "express";
import prisma from "../../config/prisma.js";
import { getForecastFromML } from "../../services/mlService.js";
import { buildFeatureVector } from "../../services/featureBuilder.js";

const router = express.Router();

function computeRiskScore({ aqi, heartRate, respiratoryRate, hasAsthma }) {
  let score = 0;

  score += Math.min(aqi / 5, 60);
  if (heartRate) score += Math.min((heartRate - 70) * 0.5, 20);
  if (respiratoryRate) score += Math.min((respiratoryRate - 16) * 1.2, 15);
  if (hasAsthma) score += 15;

  return Math.min(score, 100);
}

router.post("/score", async (req, res) => {
  try {
    const { wearable } = req.body;

    // 1️⃣ Generate feature vector (realtime)
    const result = await buildFeatureVector();
    const { modelInput } = result;

    // 2️⃣ Get forecast from ML
    const ml = await getForecastFromML(modelInput);
    console.log("ML RESPONSE →", ml);

    if (!ml || !ml.forecast) {
      return res.status(500).json({
        success: false,
        error: "Forecast not available"
      });
    }

    // 3️⃣ Take worst-case AQI
    const aqiMax = Math.max(
      ml.forecast["24h"],
      ml.forecast["48h"],
      ml.forecast["72h"]
    );

    // 4️⃣ Compute risk
    const score = computeRiskScore({
      aqi: aqiMax,
      heartRate: wearable?.heartRate,
      respiratoryRate: wearable?.respiratoryRate,
      hasAsthma: wearable?.hasAsthma
    });

    const level =
      score >= 70 ? "high" :
      score >= 40 ? "medium" :
      "low";

    res.json({
      success: true,
      score,
      level,
      aqiMax,
      forecast: ml.forecast
    });

  } catch (err) {
    console.error("Risk score error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
