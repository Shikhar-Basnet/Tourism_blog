import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import slugify from "slugify";
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

const blogSeeds = [
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
    categoryName: "Trekking",
    tags: ["everest", "trekking", "himalaya"],
    relatedDestinationTitle: "Everest Base Camp",
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
    categoryName: "Travel Tips",
    tags: ["planning", "weather", "season"],
    status: "published",
    seo: {
      metaTitle: "Best Time to Visit Nepal | Nepal Tourism",
      metaDescription: "A season-by-season breakdown of when to visit Nepal.",
    },
  },
];

// Upsert-based — safe to re-run any time:
//  - Only touches these known seed categories/blogs by name/title, never
//    wipes the whole collection (so admin-created categories/blogs, and
//    any images/likes/views on the seed blogs themselves, are preserved).
//  - featuredImage/gallery-style fields (if you add them later) should
//    follow the same $setOnInsert pattern used in destinationSeeder.js.
const seed = async () => {
  await connectDB();

  const admin = await User.findOne({ provider: "local" });
  if (!admin) {
    console.error("No local admin found — run `npm run seed:admin` first");
    process.exit(1);
  }

  // Self-heal: clear any stray docs left with a null slug from earlier
  // buggy runs — these collide with the unique slug index on every upsert.
  const catCleanup = await Category.deleteMany({ slug: null });
  const blogCleanup = await Blog.deleteMany({ slug: null });
  if (catCleanup.deletedCount > 0) console.log(`Removed ${catCleanup.deletedCount} stray category(ies) with a null slug`);
  if (blogCleanup.deletedCount > 0) console.log(`Removed ${blogCleanup.deletedCount} stray blog(s) with a null slug`);

  const categoryByName = {};
  for (const cat of categories) {
    const slug = slugify(cat.name, { lower: true, strict: true });
    const doc = await Category.findOneAndUpdate(
      { name: cat.name },
      { $set: { ...cat, slug } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    categoryByName[cat.name] = doc;
  }

  for (const blog of blogSeeds) {
    const { categoryName, relatedDestinationTitle, ...rest } = blog;
    const slug = slugify(blog.title, { lower: true, strict: true });

    const category = categoryByName[categoryName];
    const relatedDestination = relatedDestinationTitle
      ? await Destination.findOne({ title: relatedDestinationTitle })
      : null;

    await Blog.findOneAndUpdate(
      { title: blog.title },
      {
        $set: {
          ...rest,
          slug,
          category: category?._id,
          relatedDestinations: relatedDestination ? [relatedDestination._id] : [],
        },
        $setOnInsert: { author: admin._id },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  console.log("Categories and sample blogs upserted (existing data preserved)");
  await mongoose.disconnect();
  process.exit();
};

seed();