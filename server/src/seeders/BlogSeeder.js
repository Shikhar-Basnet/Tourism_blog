import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import Category from "../models/Category.js";
import Blog from "../models/Blog.js";
import User from "../models/User.js";
import Destination from "../models/Destination.js";

const categories = [
  { name: "Trekking", description: "Trails, routes, and multi-day hikes across Nepal." },
  { name: "Wildlife", description: "National parks, safaris, and rare species." },
  { name: "Cultural", description: "Temples, festivals, and heritage sites." },
  { name: "Travel Tips", description: "Practical guides for planning your trip." },
];

const seed = async () => {
  await connectDB();

  const admin = await User.findOne({ provider: "local" });
  if (!admin) {
    console.error("No local admin found — run `npm run seed:admin` first");
    process.exit(1);
  }

  await Category.deleteMany();
  const createdCategories = await Category.insertMany(categories);
  const trekking = createdCategories.find((c) => c.name === "Trekking");
  const tips = createdCategories.find((c) => c.name === "Travel Tips");

  const everest = await Destination.findOne({ title: "Everest Base Camp" });

  await Blog.deleteMany();
  await Blog.insertMany([
    {
      title: "A First-Timer's Guide to the Everest Base Camp Trek",
      excerpt:
        "Everything to know before your first EBC trek — permits, altitude, packing, and daily distances.",
      content:
        "Trekking to Everest Base Camp is one of the most rewarding multi-day hikes in the world. " +
        "This guide covers permits (TIMS card and Sagarmatha National Park entry), realistic daily " +
        "distances, altitude acclimatization days in Namche Bazaar and Dingboche, what to pack for " +
        "cold nights above 4000m, and how to budget for teahouse stays along the route. " +
        "Most trekkers complete the full round trip in 12-14 days, allowing for proper acclimatization.",
      category: trekking._id,
      tags: ["everest", "trekking", "himalaya"],
      author: admin._id,
      relatedDestinations: everest ? [everest._id] : [],
      status: "published",
      seo: {
        metaTitle: "Everest Base Camp Trek Guide | Nepal Tourism",
        metaDescription: "A practical first-timer's guide to trekking to Everest Base Camp.",
      },
    },
    {
      title: "Best Time to Visit Nepal: A Season-by-Season Breakdown",
      excerpt: "When to go depends on what you're after — clear mountain views, festivals, or fewer crowds.",
      content:
        "Nepal's climate varies dramatically by season and altitude. October to November offers the " +
        "clearest mountain views and stable weather, making it peak trekking season. March to May " +
        "brings blooming rhododendrons and warmer temperatures. The monsoon (June-August) is best " +
        "avoided for trekking but is a quieter, greener time to explore cultural sites in the Kathmandu " +
        "Valley. Winter (December-February) offers clear skies but cold temperatures at altitude.",
      category: tips._id,
      tags: ["planning", "weather", "season"],
      author: admin._id,
      status: "published",
      seo: {
        metaTitle: "Best Time to Visit Nepal | Nepal Tourism",
        metaDescription: "A season-by-season breakdown of when to visit Nepal.",
      },
    },
  ]);

  console.log("Categories and sample blogs seeded successfully");
  await mongoose.disconnect();
  process.exit();
};

seed();