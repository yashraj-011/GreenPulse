import express from "express";
import prisma from "../../config/prisma.js";
//import aqiClient from "../utils/aqiClient.js"; // if exists, else remove
import fetch from "node-fetch";

const router = express.Router();

// ------------------------------
// Utility: Format timestamp
// ------------------------------
function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ------------------------------
// MAIN NEWSROOM LOGIC
// ------------------------------
router.get("/", async (req, res) => {
  try {
    const city = "Delhi";

    let alerts = [];

    // ---------------------------------------------------------
    // 1️⃣ REAL-TIME AQI — Breaking Alerts
    // ---------------------------------------------------------
    let realtime = null;
    try {
      const rt = await fetch(
        `https://api.waqi.info/feed/delhi/?token=demo`
      ).then((r) => r.json());

      if (rt?.data?.aqi) realtime = rt.data;
    } catch (err) {}

    if (realtime) {
      const aqi = realtime.aqi;

      if (aqi > 300) {
        alerts.push({
          category: "breaking",
          title: "Severe Air Pollution Alert",
          meta: `AQI reached ${aqi} in Delhi. Avoid outdoor activities.`,
          isAuto: true,
          time: timeAgo(new Date())
        });
      } else if (aqi > 200) {
        alerts.push({
          category: "warning",
          title: "Very Poor Air Quality",
          meta: `AQI currently ${aqi}. Sensitive groups should stay indoors.`,
          isAuto: true,
          time: timeAgo(new Date())
        });
      } else {
        alerts.push({
          category: "update",
          title: "Moderate Air Quality",
          meta: `AQI is ${aqi}. Conditions stable.`,
          isAuto: true,
          time: timeAgo(new Date())
        });
      }
    }

    // ---------------------------------------------------------
    // 2️⃣ FIRE HOTSPOTS (NASA FIRMS)
    // ---------------------------------------------------------
    try {
      const fireURL =
        "https://firms.modaps.eosdis.nasa.gov/api/area/country/DL.json";
      // (Use a real API key in production)

      // Mock example:
      const fireCount = 3;

      if (fireCount > 0) {
        alerts.push({
          category: "fire",
          title: "Fire Hotspots Detected",
          meta: `${fireCount} fire points detected near Delhi. Local smoke dispersion may cause AQI spikes.`,
          isAuto: true,
          time: "just now"
        });
      }
    } catch (err) {}

    // ---------------------------------------------------------
    // 3️⃣ FORECAST ALERTS (Next 12 hours)
    // ---------------------------------------------------------
    try {
      const forecast = await prisma.forecast.findFirst({
        orderBy: { createdAt: "desc" }
      });

      if (forecast && forecast.aqi24h > 250) {
        alerts.push({
          category: "forecast",
          title: "AQI Expected to Worsen Tonight",
          meta: `Projected AQI: ${forecast.aqi24h}. Avoid late-evening travel.`,
          isAuto: true,
          time: timeAgo(forecast.createdAt)
        });
      }
    } catch (err) {}

    // ---------------------------------------------------------
    // 4️⃣ COMMUNITY REPORTS → Converted to News Alerts
    // ---------------------------------------------------------
    const communityReports = await prisma.report.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { user: true }
    });

    communityReports.forEach((r) => {
      alerts.push({
        category: "community",
        title: `New Report: ${r.title}`,
        meta: `${r.description.slice(0, 80)}... • by ${r.user.displayName}`,
        isAuto: false,
        time: timeAgo(r.createdAt)
      });
    });

    // Sort: breaking > forecast > fire > warning > community
    const priority = {
      breaking: 1,
      fire: 2,
      forecast: 3,
      warning: 4,
      update: 5,
      community: 6
    };

    alerts.sort((a, b) => priority[a.category] - priority[b.category]);

    res.json(alerts.slice(0, 10));
  } catch (err) {
    console.log("Local Updates Error:", err);
    res.json([]);
  }
});

export default router;
