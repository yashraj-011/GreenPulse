import express from "express";
import pool from "../../config/db.js";

const router = express.Router();

router.get("/latest", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM aqi_data ORDER BY recorded_at DESC LIMIT 1`
    );

    res.json({
      success: true,
      data: result.rows[0] || null
    });
  } catch (err) {
    console.error("❌ AQI latest error:", err.message);
    res.status(500).json({ success: false, error: "Database error" });
  }
});

export default router;
