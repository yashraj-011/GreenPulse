// ----------------------------------------------
// FORECAST ROUTE (FINAL WORKING VERSION)
// ----------------------------------------------

import express from "express";
import axios from "axios";

import { buildFeatureVector } from "../../services/featureBuilder.js";
import { stations39 } from "../../db/stations39.js";

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

    // Removed database calls - not using DB
    // await saveRealtime(rt);
    // await saveAqiData("Delhi", finalStation, rt.aqi, rt.category);

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
    console.log("🚀 FORECAST ROUTE START - Station request received");
    const { station_name } = req.body;
    console.log("📍 Station name:", station_name);

    if (!station_name) {
      console.log("❌ No station_name provided");
      return res.status(400).json({
        success: false,
        error: "station_name is required"
      });
    }

    // Normalize input
    const cleanStation = station_name.split(",")[0].trim();
    console.log("🧹 Clean station name:", cleanStation);

    const exists = stations39.find(
      (s) => s.name.toLowerCase() === cleanStation.toLowerCase()
    );

    if (!exists) {
      console.log("❌ Station not found in stations39:", cleanStation);
      return res.status(400).json({
        success: false,
        error: `Unknown station: ${station_name}`
      });
    }

    const finalStation = exists.name;
    console.log("✅ Final station matched:", finalStation);

    // Build realtime features
    console.log("🔧 Building feature vector...");
    let modelInput, rt;
    try {
      const result = await buildFeatureVector(finalStation);
      modelInput = result.modelInput;
      rt = result.rt;
      console.log("✅ Feature vector built successfully");
      console.log("📊 Model input keys:", Object.keys(modelInput || {}).length);
      console.log("📊 Realtime data:", { aqi: rt?.aqi, pm25: rt?.pm25, temp: rt?.temp });
    } catch (featureError) {
      console.error("❌ Feature vector building failed:", featureError.message);
      throw new Error(`Feature building failed: ${featureError.message}`);
    }

    // Removed database calls - not using DB
    // await saveRealtime(rt);
    // await saveAqiData("Delhi", finalStation, rt.aqi, rt.category);

    // ----- ML MODEL CALL (unchanged) -----
    console.log("🤖 Making FastAPI call to predict_station...");
    console.log("📡 FastAPI URL: http://127.0.0.1:8000/predict_station");
    console.log("📤 Payload:", { station_name: finalStation, data_keys: Object.keys(modelInput || {}).length });

    let fastRes;
    try {
      fastRes = await axios.post(
        "http://127.0.0.1:8000/predict_station",
        {
          station_name: finalStation,
          data: modelInput,
        },
        {
          timeout: 30000, // 30 second timeout
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      console.log("✅ FastAPI call successful");
      console.log("📊 FastAPI response keys:", Object.keys(fastRes.data || {}));

      if (fastRes.data?.forecast) {
        console.log("📈 Forecast data received:", Object.keys(fastRes.data.forecast));
      } else {
        console.log("⚠️ No forecast data in FastAPI response");
      }

    } catch (fastApiError) {
      console.error("❌ FastAPI call failed:");
      console.error("- Error code:", fastApiError.code);
      console.error("- Error message:", fastApiError.message);
      if (fastApiError.response) {
        console.error("- Response status:", fastApiError.response.status);
        console.error("- Response data:", fastApiError.response.data);
      }
      throw new Error(`FastAPI call failed: ${fastApiError.message}`);
    }

    // Removed database call - not using DB
    // await saveForecast(finalStation, fastRes.data.forecast);

    // ----- HEALTH & SOURCE BREAKDOWN -----
    console.log("🏥 Building health advice and sources...");
    const health = buildHealthAdvice(rt.aqi);
    const sources = await buildSourceBreakdown(rt);

    console.log("🟢 SOURCE BREAKDOWN:", sources);
    console.log("🟢 HEALTH ADVICE:", health);

    // Response
    console.log("📤 Sending successful response");
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
    console.error("💥 FORECAST ROUTE ERROR:", err.message);
    console.error("📊 Error stack:", err.stack);

    res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
      debug: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

export default router;
