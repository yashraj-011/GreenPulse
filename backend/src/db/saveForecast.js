// src/db/saveForecast.js
import pool from "../config/db.js";

export async function saveForecast(city, forecast) {
  try {
    console.log("📥 saveForecast ->", city, forecast);

    const q = `
      INSERT INTO forecasts (city, forecast_24h, forecast_48h, forecast_72h)
      VALUES ($1, $2, $3, $4)
    `;

    const values = [
      city,
      forecast["24h"],
      forecast["48h"],
      forecast["72h"]
    ];

    await pool.query(q, values);

    console.log("✅ forecasts row saved!");

  } catch (err) {
    console.error("❌ saveForecast Error:", err.message);
  }
}
