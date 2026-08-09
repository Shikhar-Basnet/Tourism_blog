import express from "express";
import rateLimit from "express-rate-limit";
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

// The global /api limiter (300 req/15min) is far too loose for a
// credential-guessing target. This scopes a much tighter limit to just
// the staff login route, keyed by IP — 5 attempts per 15 minutes.
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many login attempts. Try again later." },
});

// --- Google OAuth ---
router.get("/google", (req, res, next) => {
  const redirectTo = req.query.redirect || "/";
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
    state: redirectTo,
  })(req, res, next);
});
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: `${process.env.CLIENT_URL}/login?error=google` }),
  googleCallback
);

// --- Facebook OAuth ---
router.get("/facebook", (req, res, next) => {
  const redirectTo = req.query.redirect || "/";
  passport.authenticate("facebook", {
    scope: ["public_profile", "email"],
    session: false,
    state: redirectTo,
  })(req, res, next);
});
router.get(
  "/facebook/callback",
  passport.authenticate("facebook", { session: false, failureRedirect: `${process.env.CLIENT_URL}/login?error=facebook` }),
  facebookCallback
);

// --- Staff (Admin/Editor) email+password login ---
router.post("/admin/login", adminLoginLimiter, adminLogin);

// --- Session management ---
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", protect, getMe);

export default router;