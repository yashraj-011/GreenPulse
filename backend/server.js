import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import debugAqi from "./src/api/routes/debugAqi.js";

// Load env
dotenv.config();

// resolve dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// initialize app FIRST
const app = express();
app.use(cors());
app.use(express.json({ limit: "15mb" }));

// static uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ------------------------------
// ROUTE IMPORTS
// ------------------------------
import aqidataRoutes from "./src/api/routes/aqidata.js";
import aqiLatestRoutes from "./src/api/routes/aqiLatest.js";
import forecastRoutes from "./src/api/routes/forecast.js";

import authRoutes from "./src/api/routes/auth.js";
import authFirebaseRoutes from "./src/api/routes/authFirebase.js";

import reportsRoutes from "./src/api/routes/reports.js";
import stationsRoutes from "./src/api/routes/stations.js";

import safeRoute from "./src/api/routes/safeRoutes.js";
import aqiNearest from "./src/api/routes/aqiNearest.js";

import likeRoutes from "./src/api/routes/like.js";
import commentRoutes from "./src/api/routes/comment.js";

import communityRoutes from "./src/api/routes/community.js";
import localUpdatesRoutes from "./src/api/routes/localUpdates.js";
import heroesRoutes from "./src/api/routes/heroes.js";
import leaderboardRoutes from "./src/api/routes/leaderboard.js";
import mediaRoutes from "./src/api/routes/media.js";

// ------------------------------
// MOUNT ROUTES
// ------------------------------
app.use("/api/aqi", aqidataRoutes);
app.use("/api/aqi", aqiLatestRoutes);

app.use("/api/forecast", forecastRoutes);

app.use("/api/auth", authRoutes);
app.use("/api/auth", authFirebaseRoutes);     // FIXED ✔

app.use("/api/reports", reportsRoutes);
app.use("/api/stations", stationsRoutes);

app.use("/api", safeRoute);
app.use("/api", aqiNearest);

app.use("/api/likes", likeRoutes);
app.use("/api/comments", commentRoutes);

app.use("/api/community", communityRoutes);
app.use("/api/local-updates", localUpdatesRoutes);
app.use("/api/heroes", heroesRoutes);
app.use("/api/leaderboard", leaderboardRoutes);

app.use("/api/debug", debugAqi);
app.use("/api/media", mediaRoutes);

// ------------------------------
// HEALTH
// ------------------------------
app.get("/health", (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// ------------------------------
// START SERVER
// ------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});
