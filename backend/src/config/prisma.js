// src/config/prisma.js
// Ensure env vars are loaded (safe to keep here in case server entry didn't)
import "dotenv/config";

import pkg from "@prisma/client";
const { PrismaClient } = pkg;

// Avoid exhausting DB connections during dev/hot-reload by reusing the client
let prisma;

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  // Use a global to preserve the client across module reloads in dev
  if (!globalThis.__prisma) {
    globalThis.__prisma = new PrismaClient();
  }
  prisma = globalThis.__prisma;
}

export default prisma;
