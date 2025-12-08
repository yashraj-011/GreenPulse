// ----------------------------------------------
// FORECAST ROUTE (FINAL WORKING VERSION)
// ----------------------------------------------

import express from "express";
import axios from "axios";

import { buildFeatureVector } from "../../services/featureBuilder.js";
import { stations39 } from "../../db/stations39.js";

import { saveAqiData } from "../../db/saveAqiData.js";
import { saveRealtime } from "../../db/saveRealtime.js";
import { saveForecast } from "../../db/saveForecast.js";

// ⭐ Correct paths — your utils folder = src/utils/
import { buildHealthAdvice } from "../../utils/healthEngine.js";
import { buildSourceBreakdown } from "../../utils/sourceEngine.js";

// For ES-module debugging (optional)
import { fileURLToPath } from "url";
import { dirname } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log("🔥🔥🔥 FORECAST ROUTE LOADED FROM:", __filename);

// Router
const router = express.Router();

/* --------------------------------------------------------
   REALTIME AQI
---------------------------------------------------------- */
router.get("/realtime", async (req, res) => {
  try {
    const { modelInput, rt, finalStation } = await buildFeatureVector();

    await saveRealtime(rt);
    await saveAqiData("Delhi", finalStation, rt.aqi, rt.category);

    return res.json({
      success: true,
      timestamp: new Date().toISOString(),
      realtime: {
        ...rt,
        station_name: finalStation,
        datetime: new Date().toISOString(),
      }
    });

  } catch (err) {
    console.error("Realtime AQI ERROR:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

/* --------------------------------------------------------
   FORECAST FOR A SPECIFIC STATION
---------------------------------------------------------- */
router.post("/station", async (req, res) => {
  try {
    const { station_name } = req.body;

    if (!station_name) {
      return res.status(400).json({
        success: false,
        error: "station_name is required"
      });
    }

    // Normalize input
    const cleanStation = station_name.split(",")[0].trim();
    const exists = stations39.find(
      (s) => s.name.toLowerCase() === cleanStation.toLowerCase()
    );

    if (!exists) {
      return res.status(400).json({
        success: false,
        error: `Unknown station: ${station_name}`
      });
    }

    const finalStation = exists.name;

    // Build realtime features
    const { modelInput, rt } = await buildFeatureVector(finalStation);

    await saveRealtime(rt);
    await saveAqiData("Delhi", finalStation, rt.aqi, rt.category);

    // ----- ML MODEL CALL (unchanged) -----
    const fastRes = await axios.post(
      "http://127.0.0.1:8000/predict_station",
      {
        station_name: finalStation,
        data: modelInput,
      }
    );

    await saveForecast(finalStation, fastRes.data.forecast);

    // ----- HEALTH & SOURCE BREAKDOWN -----
    const health = buildHealthAdvice(rt.aqi);

    // ❗ FINAL ARGUMENT FIX — ONLY realtime required
    const sources = await buildSourceBreakdown(rt);

    console.log("🟢 SOURCE BREAKDOWN:", sources);
    console.log("🟢 HEALTH ADVICE:", health);

    // Response
    return res.json({
      success: true,
      station: finalStation,
      timestamp: new Date().toISOString(),

      realtime: {
        ...rt,
        station_name: finalStation,
        datetime: new Date().toISOString(),
      },

      forecast: fastRes.data.forecast,
      health,
      sources,
    });

  } catch (err) {
    console.error("Station Forecast ERROR:", err.response?.data || err.message);
    res.status(500).json({
      success: false,
      error: err.response?.data || err.message,
    });
  }
});

export default router;
