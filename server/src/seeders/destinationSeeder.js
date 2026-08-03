import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import slugify from "slugify";
import { connectDB } from "../config/db.js";
import Destination from "../models/Destination.js";

const Destinations = [
  {
    title: "Everest Base Camp",
    description:
      "The world-famous trek to the base of Mount Everest through Sherpa villages and the breathtaking Khumbu region.",
    province: "Koshi",
    district: "Solukhumbu",
    category: ["Trekking", "Mountain", "Adventure"],
    bestTimeToVisit: "March to May, September to November",
    altitude: 5364,
    entryFee: { npr: 0, foreigner: 3000 },
    budgetEstimate: {
      budget: "$30-40/day",
      midRange: "$60-100/day",
      luxury: "$150+/day",
    },
    coordinates: { lat: 28.0026, lng: 86.8528 },
    tags: ["everest", "trekking", "khumbu"],
    featured: true,
  },

  {
    title: "Janaki Temple",
    description:
      "A magnificent Hindu temple dedicated to Goddess Sita, attracting thousands of pilgrims every year.",
    province: "Madhesh",
    district: "Dhanusha",
    category: ["Religious", "Cultural", "Heritage"],
    bestTimeToVisit: "October to March",
    altitude: 74,
    entryFee: { npr: 0, foreigner: 0 },
    budgetEstimate: {
      budget: "$10-20/day",
      midRange: "$30-50/day",
      luxury: "$80+/day",
    },
    coordinates: { lat: 26.7288, lng: 85.9250 },
    tags: ["janakpur", "sita", "temple"],
    featured: true,
  },

  {
    title: "Kathmandu Durbar Square",
    description:
      "A UNESCO World Heritage Site featuring ancient palaces, temples, and traditional Newari architecture.",
    province: "Bagmati",
    district: "Kathmandu",
    category: ["Heritage", "UNESCO", "Culture"],
    bestTimeToVisit: "September to November, March to May",
    altitude: 1400,
    entryFee: { npr: 0, foreigner: 1000 },
    budgetEstimate: {
      budget: "$20-30/day",
      midRange: "$50-80/day",
      luxury: "$120+/day",
    },
    coordinates: { lat: 27.7049, lng: 85.3075 },
    tags: ["durbar", "unesco", "history"],
    featured: true,
  },

  {
    title: "Pokhara",
    description:
      "Nepal's tourism capital, famous for Phewa Lake, Annapurna views, caves, and adventure sports.",
    province: "Gandaki",
    district: "Kaski",
    category: ["Lakes", "Adventure", "Mountain"],
    bestTimeToVisit: "September to November, March to May",
    altitude: 822,
    entryFee: { npr: 0, foreigner: 0 },
    budgetEstimate: {
      budget: "$15-25/day",
      midRange: "$40-70/day",
      luxury: "$100+/day",
    },
    coordinates: { lat: 28.2096, lng: 83.9856 },
    tags: ["pokhara", "phewa", "paragliding"],
    featured: true,
  },

  {
    title: "Lumbini",
    description:
      "The birthplace of Lord Buddha and one of the world's most important pilgrimage destinations.",
    province: "Lumbini",
    district: "Rupandehi",
    category: ["Religious", "UNESCO", "Heritage"],
    bestTimeToVisit: "October to March",
    altitude: 150,
    entryFee: { npr: 0, foreigner: 700 },
    budgetEstimate: {
      budget: "$15-25/day",
      midRange: "$40-70/day",
      luxury: "$100+/day",
    },
    coordinates: { lat: 27.4833, lng: 83.2767 },
    tags: ["buddha", "lumbini", "monastery"],
    featured: true,
  },

  {
    title: "Rara Lake",
    description:
      "Nepal's largest lake, renowned for its crystal-clear blue waters and pristine mountain scenery.",
    province: "Karnali",
    district: "Mugu",
    category: ["Lake", "Nature", "National Park"],
    bestTimeToVisit: "April to June, September to November",
    altitude: 2990,
    entryFee: { npr: 100, foreigner: 3000 },
    budgetEstimate: {
      budget: "$25-35/day",
      midRange: "$60-90/day",
      luxury: "$150+/day",
    },
    coordinates: { lat: 29.5286, lng: 82.0789 },
    tags: ["rara", "lake", "nature"],
    featured: true,
  },

  {
    title: "Khaptad National Park",
    description:
      "A peaceful national park known for rolling grasslands, forests, and the Khaptad Baba Ashram.",
    province: "Sudurpashchim",
    district: "Bajhang",
    category: ["National Park", "Nature", "Hiking"],
    bestTimeToVisit: "March to May, October to November",
    altitude: 3000,
    entryFee: { npr: 100, foreigner: 3000 },
    budgetEstimate: {
      budget: "$20-30/day",
      midRange: "$50-80/day",
      luxury: "$120+/day",
    },
    coordinates: { lat: 29.3777, lng: 81.0914 },
    tags: ["khaptad", "grassland", "hiking"],
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