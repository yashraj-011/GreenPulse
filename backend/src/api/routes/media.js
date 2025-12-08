import express from "express";
import multer from "multer";
import prisma from "../../config/prisma.js";
import { authenticateJWT } from "../../middleware/auth.js";

const router = express.Router();

// Multer Storage
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (_, file, cb) => {
    const ext = file.originalname.split(".").pop();
    cb(null, Date.now() + "-" + Math.random().toString(36).substring(7) + "." + ext);
  }
});

const upload = multer({ storage });

// Upload File + Save report.imageUrl
router.post("/report", authenticateJWT, upload.single("file"), async (req, res) => {
  try {
    const { reportId } = req.body;

    if (!req.file) return res.json({ success: false, message: "File missing" });

    const fileUrl = `/uploads/${req.file.filename}`;

    await prisma.report.update({
      where: { id: reportId },
      data: { imageUrl: fileUrl }
    });

    return res.json({ success: true, imageUrl: fileUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Upload failed" });
  }
});

export default router;
