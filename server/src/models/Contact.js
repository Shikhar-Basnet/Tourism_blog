import mongoose from "mongoose";

const contactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    phone: { type: String, trim: true, maxlength: 20 },
    subject: { type: String, required: true, trim: true, maxlength: 150 },
    message: { type: String, required: true, trim: true, maxlength: 2000 },

    status: { type: String, enum: ["new", "in_progress", "resolved"], default: "new" },
    adminNote: { type: String, trim: true, maxlength: 1000 },

    // Ties the enquiry to a real account if the visitor happened to be
    // logged in — purely informational, login is never required to submit.
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    ipAddress: { type: String },
    userAgent: { type: String, maxlength: 300 },
  },
  { timestamps: true }
);

// Used by the per-email throttle check and the admin inbox sort/filter.
contactSchema.index({ email: 1, createdAt: -1 });
contactSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model("Contact", contactSchema);