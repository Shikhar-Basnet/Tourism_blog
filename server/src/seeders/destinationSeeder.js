import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import slugify from "slugify";
import { connectDB } from "../config/db.js";
import Destination from "../models/Destination.js";

const Destinations = [
  {
    title: "Pokhara",
    description:
      "Pokhara is Nepal's premier tourism hub, known for the Phewa Lake, Annapurna views, and paragliding.",
    province: "Gandaki",
    district: "Kaski",
    category: ["Lakes", "Adventure", "Mountain"],
    bestTimeToVisit: "September to November, March to May",
    altitude: 822,
    entryFee: { npr: 0, foreigner: 0 },
    budgetEstimate: { budget: "$15-25/day", midRange: "$40-70/day", luxury: "$100+/day" },
    coordinates: { lat: 28.2096, lng: 83.9856 },
    tags: ["paragliding", "lake", "annapurna"],
    featured: true,
  },
  {
    title: "Chitwan National Park",
    description:
      "A UNESCO World Heritage Site known for one-horned rhinos, Bengal tigers, and jungle safaris.",
    province: "Bagmati",
    district: "Chitwan",
    category: ["Wildlife", "National Parks"],
    bestTimeToVisit: "October to March",
    altitude: 415,
    entryFee: { npr: 100, foreigner: 2000 },
    budgetEstimate: { budget: "$20-30/day", midRange: "$50-90/day", luxury: "$150+/day" },
    coordinates: { lat: 27.5291, lng: 84.3542 },
    tags: ["rhino", "safari", "unesco"],
    featured: true,
  },
  {
    title: "Everest Base Camp",
    description:
      "The world-famous trek to the base of Mount Everest through Sherpa villages and the Khumbu region.",
    province: "Koshi",
    district: "Solukhumbu",
    category: ["Trekking", "Mountain", "Adventure"],
    bestTimeToVisit: "March to May, September to November",
    altitude: 5364,
    entryFee: { npr: 0, foreigner: 3000 },
    budgetEstimate: { budget: "$30-40/day", midRange: "$60-100/day", luxury: "$150+/day" },
    coordinates: { lat: 28.0026, lng: 86.8528 },
    tags: ["everest", "trekking", "khumbu"],
    featured: true,
  },
];

// Upsert by title — safe to re-run any time:
//  - Only touches these 3 seed destinations, never anything else in the
//    collection (e.g. destinations added later through the admin panel).
//  - Never overwrites an existing "gallery" (images uploaded via admin stay
//    intact); gallery only gets initialized to [] the first time a seed
//    destination is created.
//  - Slug is computed here explicitly: findOneAndUpdate does NOT run the
//    model's pre("validate") hook that normally generates it on .save(),
//    so without this every upserted doc would get slug: null and collide
//    on the unique slug index after the first one.
const seed = async () => {
  await connectDB();

  // Self-heal: earlier buggy runs (or any other bug) may have left behind
  // docs with slug: null, which collide with the unique slug index on every
  // subsequent upsert. Clear those out first so this never needs a manual
  // cleanup step again.
  const { deletedCount } = await Destination.deleteMany({ slug: null });
  if (deletedCount > 0) {
    console.log(`Removed ${deletedCount} stray destination(s) with a null slug`);
  }

  for (const dest of Destinations) {
    const slug = slugify(dest.title, { lower: true, strict: true });
    await Destination.findOneAndUpdate(
      { title: dest.title },
      {
        $set: { ...dest, slug },
        $setOnInsert: { gallery: [] },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  console.log(`Upserted ${Destinations.length} sample destinations (existing galleries preserved)`);
  await mongoose.disconnect();
  process.exit();
};

seed();