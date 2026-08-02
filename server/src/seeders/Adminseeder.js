import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import User from "../models/User.js";

const seedAdmin = async () => {
  await connectDB();

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD in .env before seeding");
    process.exit(1);
  }

  const existing = await User.findOne({ email });
  if (existing) {
    console.log("Admin already exists:", email);
  } else {
    await User.create({
      name: "Super Admin",
      email,
      password,
      provider: "local",
      role: "superadmin",
    });
    console.log("Superadmin created:", email);
  }

  await mongoose.disconnect();
  console.log("Connected DB:", mongoose.connection.name);
  console.log("Connected host:", mongoose.connection.host);
  process.exit();
};

seedAdmin();