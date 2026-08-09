import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    avatar: { type: String },

    provider: {
      type: String,
      enum: ["google", "facebook", "local"],
      required: true,
    },
    providerId: { type: String },
    password: { type: String, select: false },

    role: {
      type: String,
      enum: ["user", "editor", "admin", "superadmin"],
      default: "user",
    },

    refreshTokenHash: { type: String, select: false },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.index({ provider: 1, email: 1 }, { unique: true });
userSchema.index({ provider: 1, providerId: 1 }, { unique: true, sparse: true });

// getUsers filters by role, and the admin dashboard aggregates by role —
// both were doing a full collection scan without this.
userSchema.index({ role: 1 });

userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model("User", userSchema);