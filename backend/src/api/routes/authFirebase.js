// backend/src/api/routes/authFirebase.js
import express from "express";
import jwt from "jsonwebtoken";
import admin from "firebase-admin";
import prisma from "../../config/prisma.js";
import fs from "fs";
import path from "path";

const router = express.Router();

// load service account
const serviceAccountPath = path.resolve(process.cwd(), "firebase-service-account.json");
let serviceAccount = null;
try {
  serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
} catch (e) {
  console.error("🔥 firebase-login ERROR: cannot read service account file:", serviceAccountPath, e.message);
  // we'll still export the router; verification will fail later with clear error
}

if (!admin.apps.length && serviceAccount) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("🔥 Firebase Admin initialized");
  } catch (e) {
    console.error("🔥 firebase-login ERROR: admin.initializeApp failed:", e.stack || e);
  }
}

router.post("/firebase-login", async (req, res) => {
  try {
    const { idToken, role } = req.body || {};

    if (!idToken) {
      return res.status(400).json({ success: false, message: "Missing idToken" });
    }

    if (!admin.apps.length) {
      console.error("🔥 firebase-login ERROR: Firebase Admin not initialized (service account missing or invalid).");
      return res.status(500).json({ success: false, message: "Server misconfiguration: Firebase Admin not initialized" });
    }

    // Verify ID token
    let decoded;
    try {
      decoded = await admin.auth().verifyIdToken(idToken);
    } catch (err) {
      console.error("🔥 firebase-login ERROR: verifyIdToken failed:", err && err.message ? err.message : err);
      return res.status(401).json({ success: false, message: "Invalid Firebase token", detail: err && err.message });
    }

    const firebaseUid = decoded.uid;
    const email = decoded.email || null;
    const displayName = decoded.name || decoded.displayName || "User";

    // Find or create Prisma user in DB
    let user;
    try {
      user = await prisma.user.findUnique({ where: { firebaseUid } });
    } catch (err) {
      console.error("🔥 firebase-login ERROR: prisma.findUnique failed:", err.stack || err);
      return res.status(500).json({ success: false, message: "DB error (findUnique)", detail: err.message || String(err) });
    }

    if (!user) {
      try {
        user = await prisma.user.create({
          data: {
            firebaseUid,
            email,
            displayName,
            role: role || "user",
          },
        });
        console.log("🆕 Created DB user:", user.id);
      } catch (err) {
        console.error("🔥 firebase-login ERROR: prisma.create failed:", err.stack || err);
        return res.status(500).json({ success: false, message: "DB error (create)", detail: err.message || String(err) });
      }
    } else {
      // update email/displayName if changed (non-blocking)
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { email, displayName },
        });
      } catch (err) {
        console.warn("⚠️ firebase-login WARN: prisma.update failed (non-fatal):", err.message || err);
      }
    }

    // Sign backend JWT containing Prisma user id
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        firebaseUid: user.firebaseUid,
      },
    });
  } catch (err) {
    // Last-resort catch — log full stack for debugging
    console.error("🔥 firebase-login ERROR (unexpected):", err && (err.stack || err));
    return res.status(500).json({ success: false, message: "Internal server error", detail: err && (err.message || String(err)) });
  }
});

export default router;
