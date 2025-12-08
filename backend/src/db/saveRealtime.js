// src/db/saveRealtime.js
import pool from "../config/db.js";

export async function saveRealtime(rt) {
  try {
    console.log("📥 saveRealtime ->", rt);

    const q = `
      INSERT INTO realtime_aqi
      (pm25, pm10, no2, co, o3, so2, nh3, no, temp, humidity, wind, fire_count, aqi)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
    `;

    const values = [
      rt.pm25, rt.pm10, rt.no2, rt.co, rt.o3, rt.so2, rt.nh3,
      rt.no, rt.temp, rt.humidity, rt.wind, rt.fire_count, rt.aqi
    ];

    await pool.query(q, values);

    console.log("✅ realtime_aqi row saved!");

  } catch (err) {
    console.error("❌ saveRealtime Error:", err.message);
  }
}
