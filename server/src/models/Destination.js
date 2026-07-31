import mongoose from "mongoose";
import slugify from "slugify";

const destinationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, index: true },
    description: { type: String, required: true },
    province: { type: String, required: true },
    district: { type: String },
    category: [{ type: String }],
    bestTimeToVisit: { type: String },
    altitude: { type: Number },
    entryFee: {
      npr: { type: Number, default: 0 },
      foreigner: { type: Number, default: 0 },
    },
    budgetEstimate: {
      budget: { type: String },
      midRange: { type: String },
      luxury: { type: String },
    },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    gallery: [{ type: String }],
    tags: [{ type: String }],
    featured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

destinationSchema.pre("validate", function (next) {
  if (this.title && !this.slug) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  next();
});

destinationSchema.index({ title: "text", description: "text", tags: "text" });

export default mongoose.model("Destination", destinationSchema);
