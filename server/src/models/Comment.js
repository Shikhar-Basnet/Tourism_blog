import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    content: { type: String, required: true, trim: true, maxlength: 1000 },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // Polymorphic target — one Comment model serves both Blogs and Destinations
    // instead of duplicating near-identical schemas/controllers for each.
    targetType: { type: String, enum: ["Blog", "Destination"], required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: "targetType" },

    isEdited: { type: Boolean, default: false },
  },
  { timestamps: true }
);

commentSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });

export default mongoose.model("Comment", commentSchema);