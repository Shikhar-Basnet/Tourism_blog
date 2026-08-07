import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import Destination from "../models/Destination.js";

const run = async () => {
  await connectDB();
  const destinations = await Destination.find();
  for (const dest of destinations) {
    dest.location = { type: "Point", coordinates: [dest.coordinates.lng, dest.coordinates.lat] };
    await dest.save({ validateBeforeSave: false });
  }
  console.log(`Backfilled location for ${destinations.length} destination(s)`);
  await mongoose.disconnect();
  process.exit();
};
run();