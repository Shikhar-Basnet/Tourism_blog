import mongoose from "mongoose";
import slugify from "slugify";

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, index: true },
    excerpt: { type: String, trim: true, maxlength: 300 },
    content: { type: String, required: true }, // markdown or rich-text HTML from the editor
    featuredImage: { type: String },

    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    tags: [{ type: String, lowercase: true, trim: true }],
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // Destinations this post references — powers "related destinations" on the blog side
    relatedDestinations: [{ type: mongoose.Schema.Types.ObjectId, ref: "Destination" }],

    status: { type: String, enum: ["draft", "published"], default: "draft" },
    publishedAt: { type: Date },

    readingTimeMinutes: { type: Number, default: 1 },
    views: { type: Number, default: 0 },

    // Toggle-based likes: one entry per user who has liked this post, so a
    // single account can only ever count once and can un-like to remove it.
    // (Previously this was a raw incrementing counter with no per-user
    // tracking, which let one account click "like" unlimited times.)
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    seo: {
      metaTitle: { type: String, trim: true },
      metaDescription: { type: String, trim: true, maxlength: 160 },
      canonicalUrl: { type: String, trim: true },
      ogImage: { type: String },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

blogSchema.virtual("likesCount").get(function () {
  return this.likedBy?.length || 0;
});

blogSchema.pre("validate", function (next) {
  if (this.title && !this.slug) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  next();
});

// Recompute reading time whenever content changes — ~200 words/minute, minimum 1 min
blogSchema.pre("save", function (next) {
  if (this.isModified("content")) {
    const wordCount = this.content.trim().split(/\s+/).filter(Boolean).length;
    this.readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));
  }
  if (this.isModified("status") && this.status === "published" && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

blogSchema.index({ title: "text", excerpt: "text", tags: "text" });

export default mongoose.model("Blog", blogSchema);