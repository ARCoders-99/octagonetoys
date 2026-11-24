// scripts/check-db.js
// Standalone script to verify MongoDB connectivity via lib/mongoose.js

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import { connect } from "../lib/mongoose.js";

// Load .env.local if MONGODB_URI is not already in process.env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envCandidates = [
  path.resolve(__dirname, "../.env.local"),
  path.resolve(__dirname, "../../.env.local"),
  path.resolve(process.cwd(), ".env.local"),
];

for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...val] = trimmed.split("=");
        if (key && val.length && !process.env[key.trim()]) {
          process.env[key.trim()] = val.join("=").trim();
        }
      }
    }
    break;
  }
}

(async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ MONGODB_URI is not defined in environment or .env.local");
    process.exit(1);
  }

  const safeUri = uri.replace(/\/\/[^:]+:[^@]+@/, "//***:***@");
  console.log(`Connecting to MongoDB at: ${safeUri}...`);

  try {
    const conn = await connect();
    const db = conn.connection.db;

    // Ping the database
    const pingResult = await db.admin().ping();
    const dbName = conn.connection.name || db.databaseName;

    console.log(`✅ Connected successfully to MongoDB database: "${dbName}"`);
    console.log(`✅ Database ping response:`, pingResult);

    await mongoose.disconnect();
    console.log("✅ Disconnected cleanly");
    process.exit(0);
  } catch (err) {
    console.error(`❌ MongoDB connection failed: ${err.message}`);
    process.exit(1);
  }
})();
