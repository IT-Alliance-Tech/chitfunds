const path = require("path");
const fs = require("fs");
const Admin = require("../models/Admin");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const envPath = path.resolve(__dirname, "..", ".env");
if (fs.existsSync(envPath)) {
  require("dotenv").config({ path: envPath });
  console.log("[INFO] Loaded .env from", envPath);
} else {
  require("dotenv").config();
  console.warn(
    "[WARN] .env not found at",
    envPath,
    " - dotenv used default lookup (cwd)."
  );
}

const SALT_ROUNDS = Number(process.env.SALT_ROUNDS || 10);

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI || typeof MONGO_URI !== "string") {
  console.error(
    "[FATAL] MONGO_URI is not set or is not a string. Check your .env."
  );
  console.error(
    "Current process.env.MONGO_URI:",
    JSON.stringify(process.env.MONGO_URI)
  );
  process.exit(1);
}

if (
  !(
    MONGO_URI.trim().startsWith("mongodb://") ||
    MONGO_URI.trim().startsWith("mongodb+srv://")
  )
) {
  console.error(
    '[FATAL] MONGO_URI must start with "mongodb://" or "mongodb+srv://".'
  );
  console.error("MONGO_URI (first 120 chars):", MONGO_URI.trim().slice(0, 120));
  process.exit(1);
}

async function run() {
  try {
    console.log("[INFO] Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI.trim(), {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("[INFO] Connected to MongoDB");

    // === EDIT THESE VALUES ===
    const email = "admin@test.com";
    const plainPassword = "Admin@123";
    const accessKey = "ADMIN-ACCESS-001";
    // =========================

    if (!email || !plainPassword || !accessKey) {
      console.error(
        "[FATAL] email, password and accessKey must be provided in the script."
      );
      process.exit(1);
    }

    const existing = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      console.log("[OK] Admin already exists:", existing.email);
      console.log("    _id:", existing._id.toString());
      await mongoose.disconnect();
      process.exit(0);
    }

    const hashed = await bcrypt.hash(plainPassword, SALT_ROUNDS);

    const created = await Admin.create({
      email: email.toLowerCase().trim(),
      password: hashed,
      accessKey,
    });

    console.log("[SUCCESS] Admin created:");
    console.log({
      _id: created._id.toString(),
      email: created.email,
      accessKey: created.accessKey,
      createdAt: created.createdAt,
    });

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error(
      "[ERROR] createAdmin failed:",
      err && err.message ? err.message : err
    );
    if (err && err.stack) console.error(err.stack);
    try {
      await mongoose.disconnect();
    } catch (e) { }
    process.exit(1);
  }
}

run();
