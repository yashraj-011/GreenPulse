import express from "express";
import prisma from "../../config/prisma.js";

const router = express.Router();

router.get("/aqi/latest", async (req, res) => {
  const data = await prisma.aqiData.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  res.json(data);
});

export default router;
