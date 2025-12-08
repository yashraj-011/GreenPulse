import express from "express";
import axios from "axios";

const router = express.Router();

// Live AQI endpoint - fetch directly from AQICN API
router.get("/live/:stationApi", async (req, res) => {
  try {
    const { stationApi } = req.params;
    const AQICN_TOKEN = process.env.AQICN_TOKEN;

    if (!AQICN_TOKEN) {
      return res.status(500).json({
        success: false,
        error: "AQICN_TOKEN not configured"
      });
    }

    // Fetch from AQICN API
    const url = `https://api.waqi.info/feed/${stationApi}/?token=${AQICN_TOKEN}`;
    const response = await axios.get(url);

    if (!response.data || response.data.status !== "ok") {
      return res.status(404).json({
        success: false,
        error: "Station not found or API error"
      });
    }

    const aqi = response.data.data.aqi;
    const category = aqi <= 50 ? "Good"
      : aqi <= 100 ? "Moderate"
      : aqi <= 200 ? "Poor"
      : aqi <= 300 ? "Very Poor"
      : "Severe";

    res.json({
      success: true,
      data: {
        aqi,
        category,
        timestamp: new Date().toISOString(),
        station: stationApi
      }
    });

  } catch (error) {
    console.error("Live AQI fetch error:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to fetch live AQI data"
    });
  }
});

export default router;
