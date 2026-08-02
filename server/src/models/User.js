import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
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

// Email is intentionally NOT globally unique. A staff member's local admin
// account and their personal Google/Facebook login are treated as fully
// separate accounts even if they share an email — this is what stops OAuth
// login from ever being able to reach (or inherit the role of) a staff
// account. Uniqueness is instead scoped per provider:
userSchema.index({ provider: 1, email: 1 }, { unique: true });
// providerId is only meaningful for OAuth providers, hence sparse.
userSchema.index({ provider: 1, providerId: 1 }, { unique: true, sparse: true });

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