// scripts/seed-admin.js
// Seeds the default admin account into MongoDB

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connect } from "../lib/mongoose.js";
import { User } from "../lib/models/User.js";

// Load .env.local
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

const DEFAULT_ADMIN_EMAIL = "admin@store.com";
const DEFAULT_ADMIN_PASSWORD = "admin123";
const isProduction = process.env.NODE_ENV === "production";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;

// Never create a production admin with the well-known development credentials.
if (isProduction) {
  const problems = [];
  if (!process.env.ADMIN_EMAIL) problems.push("ADMIN_EMAIL is not set");
  if (!process.env.ADMIN_PASSWORD) {
    problems.push("ADMIN_PASSWORD is not set");
  } else if (
    ADMIN_PASSWORD === DEFAULT_ADMIN_PASSWORD ||
    ADMIN_PASSWORD.length < 12
  ) {
    problems.push("ADMIN_PASSWORD must be at least 12 characters and not the default");
  }

  if (problems.length) {
    console.error("Refusing to seed an admin account in production:");
    for (const problem of problems) console.error(` - ${problem}`);
    console.error("Set real credentials in the environment and run again.");
    process.exit(1);
  }
}

async function seedAdmin() {
  console.log("--- Starting Admin User Seeding ---");
  try {
    await connect();
    console.log("✅ Connected to MongoDB");

    const existingAdmin = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });

    if (existingAdmin) {
      if (existingAdmin.role !== "admin") {
        existingAdmin.role = "admin";
        await existingAdmin.save();
        console.log(`ℹ️ Existing user ${ADMIN_EMAIL} updated to admin role.`);
      } else {
        console.log(`ℹ️ Admin user already exists: ${ADMIN_EMAIL}`);
      }
    } else {
      console.log(`Creating default admin user: ${ADMIN_EMAIL}...`);
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, salt);

      const adminUser = await User.create({
        email: ADMIN_EMAIL.toLowerCase(),
        passwordHash,
        firstName: "Store",
        lastName: "Admin",
        name: "Store Admin",
        role: "admin",
        isDeleted: false,
      });

      console.log(`✅ Default admin created successfully:`);
      console.log(`   - Email: ${adminUser.email}`);
      console.log(`   - Role: ${adminUser.role}`);
      if (!isProduction) {
        console.log(`   - Initial Password: ${ADMIN_PASSWORD}`);
      }
    }

    await mongoose.disconnect();
    console.log("✅ Disconnected from database cleanly");
    process.exit(0);
  } catch (err) {
    console.error(`❌ Seeding failed: ${err.message}`);
    process.exit(1);
  }
}

seedAdmin();

