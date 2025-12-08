import express from "express";
import { stations39 } from "../../db/stations39.js";

const router = express.Router();

router.get("/list39", (req, res) => {
  res.json({
    success: true,
    stations: stations39
  });
});

export default router;
