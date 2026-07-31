import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    avatar: { type: String },

    // OAuth users have provider + providerId. Admin/local users have password instead.
    provider: {
      type: String,
      enum: ["google", "facebook", "local"],
      required: true,
    },
    providerId: { type: String }, // Google/Facebook user id — not required for local admins
    password: { type: String, select: false }, // only set for provider: "local"

    // RBAC — matches spec: Super Admin, Admin, Editor, plus normal OAuth "user"
    role: {
      type: String,
      enum: ["user", "editor", "admin", "superadmin"],
      default: "user",
    },

    // Hashed refresh token, so a leaked DB doesn't expose usable tokens.
    // Lets us revoke sessions (logout / logout-all) by clearing this field.
    refreshTokenHash: { type: String, select: false },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Hash password only for local (admin) accounts before saving
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