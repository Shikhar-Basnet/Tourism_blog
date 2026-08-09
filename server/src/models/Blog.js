import mongoose from "mongoose";
import slugify from "slugify";

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, index: true },
    excerpt: { type: String, trim: true, maxlength: 300 },
    content: { type: String, required: true },
    featuredImage: { type: String },

    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    tags: [{ type: String, lowercase: true, trim: true }],
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    relatedDestinations: [{ type: mongoose.Schema.Types.ObjectId, ref: "Destination" }],

    status: { type: String, enum: ["draft", "published"], default: "draft" },
    publishedAt: { type: Date },

    readingTimeMinutes: { type: Number, default: 1 },
    views: { type: Number, default: 0 },

    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    embedding: { type: [Number], select: false },

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

// getBlogs filters on status and sorts by publishedAt on nearly every
// request — this compound index covers both in one pass.
blogSchema.index({ status: 1, publishedAt: -1 });

export default mongoose.model("Blog", blogSchema);