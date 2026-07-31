import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
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

const seed = async () => {
  await connectDB();
  await Destination.deleteMany();
  await Destination.insertMany(Destinations);
  console.log("Sample destinations seeded successfully");
  await mongoose.disconnect();
  process.exit();
};

seed();
