import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import compression from "compression";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";

import passport from "./config/Passport.js";
import destinationRoutes from "./routes/destinationRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import { notFound, errorHandler } from "./middlewares/errorHandler.js";

const app = express();

// --- Security & core middleware ---
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());
app.use(compression());
app.use(mongoSanitize());

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", apiLimiter);

// Stateless — we never call passport.session(), auth state lives entirely in our JWT cookies
app.use(passport.initialize());

// --- Health check ---
app.get("/api/v1/health", (req, res) => {
  res.json({ success: true, message: "Nepal Tourism API is running" });
});

// --- Routes (add more as modules grow: /blogs, /reviews, /weather...) ---
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/destinations", destinationRoutes);

// --- Error handling (must be last) ---
app.use(notFound);
app.use(errorHandler);

export default app;