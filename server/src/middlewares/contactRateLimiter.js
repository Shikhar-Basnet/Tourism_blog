import rateLimit from "express-rate-limit";

// Scoped IP limiter for the public contact form — separate from the global
// /api limiter (300/15min) because 5 submissions/hour is the right ceiling
// for a legitimate visitor, not for general API traffic.
export const contactFormLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many enquiries submitted. Please try again later." },
});