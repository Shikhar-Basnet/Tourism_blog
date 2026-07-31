import express from "express";
import passport from "../config/Passport.js";
import {
  googleCallback,
  facebookCallback,
  adminLogin,
  refresh,
  logout,
  getMe,
} from "../controllers/authController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// --- Google OAuth ---
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"], session: false }));
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: `${process.env.CLIENT_URL}/login?error=google` }),
  googleCallback
);

// --- Facebook OAuth ---
router.get("/facebook", passport.authenticate("facebook", { scope: ['public_profile', 'email'], session: false }));
router.get(
  "/facebook/callback",
  passport.authenticate("facebook", { session: false, failureRedirect: `${process.env.CLIENT_URL}/login?error=facebook` }),
  facebookCallback
);

// --- Staff (Admin/Editor) email+password login ---
router.post("/admin/login", adminLogin);

// --- Session management ---
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", protect, getMe);

export default router;
