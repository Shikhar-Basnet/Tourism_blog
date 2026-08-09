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
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number] }, // [lng, lat] — GeoJSON order, NOT [lat, lng]
    },
    gallery: [{ type: String }],
    tags: [{ type: String }],
    featured: { type: Boolean, default: false },

    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    embedding: { type: [Number], select: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

destinationSchema.virtual("likesCount").get(function () {
  return this.likedBy?.length || 0;
});

destinationSchema.pre("validate", function (next) {
  if (this.title && !this.slug) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  next();
});

destinationSchema.index({ title: "text", description: "text", tags: "text" });

// getDestinations filters directly on these — without indexes every
// filtered list request was a full collection scan.
destinationSchema.index({ province: 1 });
destinationSchema.index({ category: 1 });

destinationSchema.pre("save", function (next) {
  if (this.coordinates?.lat != null && this.coordinates?.lng != null) {
    this.location = { type: "Point", coordinates: [this.coordinates.lng, this.coordinates.lat] };
  }
  next();
});

destinationSchema.index({ location: "2dsphere" });

export default mongoose.model("Destination", destinationSchema);