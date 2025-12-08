import express from "express";
import prisma from "../../config/prisma.js";
import { authenticateJWT } from "../../middleware/auth.js";
import fs from "fs";

const router = express.Router();

// -------------------------------------------------------------
// CREATE REPORT
// -------------------------------------------------------------
router.post("/", authenticateJWT, async (req, res) => {
  try {
    const { title, description, city, stationName } = req.body;

    const report = await prisma.report.create({
      data: {
        title,
        description,
        city,
        stationName,
        status: "pending",
        user: { connect: { id: req.userId } }
      },
    });

    return res.json({ success: true, report });
  } catch (err) {
    console.error("Report create error:", err);
    res.status(500).json({ success: false, message: "Failed to create report" });
  }
});

// -------------------------------------------------------------
// GET ALL REPORTS
// -------------------------------------------------------------
router.get("/", async (_, res) => {
  try {
    const reports = await prisma.report.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, displayName: true } }
      }
    });

    return res.json(reports); // return array only
  } catch (err) {
    console.error("Reports fetch error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch reports" });
  }
});

// -------------------------------------------------------------
// GET REPORT BY ID (🔥 REQUIRED FOR REPORT DETAILS SCREEN)
// -------------------------------------------------------------
router.get("/:id", async (req, res) => {
  try {
    const report = await prisma.report.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, displayName: true } },
        comments: true,
        likes: true
      }
    });

    if (!report) {
      return res.status(404).json({ success: false, message: "Report not found" });
    }

    return res.json({ success: true, report });
  } catch (err) {
    console.error("Get single report error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch report" });
  }
});

// -------------------------------------------------------------
// DELETE REPORT
// -------------------------------------------------------------
router.delete("/:id", authenticateJWT, async (req, res) => {
  try {
    const id = req.params.id;

    const report = await prisma.report.findUnique({ where: { id } });
    if (!report) {
      return res.status(404).json({ success: false, message: "Report not found" });
    }

    if (report.imageUrl) {
      const imgPath = "." + report.imageUrl;
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }

    await prisma.report.delete({ where: { id } });

    return res.json({ success: true, message: "Report deleted" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ success: false, message: "Failed to delete report" });
  }
});

export default router;
