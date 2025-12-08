// src/db/saveAqiData.js
import pool from "../config/db.js";

export async function saveAqiData(city, stationName, value, category) {
  try {
    console.log("📥 saveAqiData ->", { city, stationName, value, category });

    await pool.query(
      `INSERT INTO aqi_data (city, station_name, aqi_value, category)
       VALUES ($1, $2, $3, $4)`,
      [city, stationName, value, category]
    );

    console.log("✅ aqi_data row saved!");
  } catch (err) {
    console.error("❌ saveAqiData Error:", err.message);
  }
}
