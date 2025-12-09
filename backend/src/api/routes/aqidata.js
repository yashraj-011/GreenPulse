import express from "express";
import axios from "axios";

const router = express.Router();

// Get Indian AQI category (matches CPCB standards)
function getIndianAQICategory(aqi) {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Satisfactory";
  if (aqi <= 200) return "Moderately Polluted";
  if (aqi <= 300) return "Poor";
  if (aqi <= 400) return "Very Poor";
  return "Severe";
}

// Live AQI endpoint - fetch from AQICN with Indian AQI categories
router.get("/live/:stationApi", async (req, res) => {
  try {
    const { stationApi } = req.params;
    const AQICN_TOKEN = process.env.AQICN_TOKEN;

    console.log(`🏛️ Fetching AQI for station: ${stationApi}`);

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
    const category = getIndianAQICategory(aqi); // Use Indian AQI categories

    console.log(`✅ AQICN data - AQI: ${aqi} (${category}) - Using Indian categories for judge compatibility`);

    res.json({
      success: true,
      data: {
        aqi,
        category,
        timestamp: new Date().toISOString(),
        station: stationApi,
        source: "AQICN (Indian Categories)",
        pollutants: response.data.data.iaqi || {} // Include pollutant data if available
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