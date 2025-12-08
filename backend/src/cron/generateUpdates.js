import prisma from "../config/prisma.js";
import { fetchCityAQIStats } from "../services/aqiStats.js";

export async function generateLocalUpdates() {
  const stats = await fetchCityAQIStats();

  const updates = [];

  if (stats.maxAqi > 300) {
    updates.push({
      title: `High Pollution at ${stats.worstStation}`,
      meta: `AQI peaked at ${stats.maxAqi}. Avoid outdoor activities.`,
      category: "alert",
    });
  }

  if (stats.risingTrend) {
    updates.push({
      title: "AQI is Rising",
      meta: "PM2.5 increasing over the last 3 hours. Expect worsening air.",
      category: "forecast",
    });
  }

  const burningReports = await prisma.report.count({
    where: {
      title: { contains: "burning", mode: "insensitive" },
      createdAt: { gte: new Date(Date.now() - 3 * 3600_000) },
    },
  });

  if (burningReports >= 2) {
    updates.push({
      title: "Garbage Burning Reported",
      meta: "Multiple burning incidents nearby. Expect local AQI to drop.",
      category: "community",
    });
  }

  for (const u of updates) {
    await prisma.localUpdate.create({
      data: u,
    });
  }
}
