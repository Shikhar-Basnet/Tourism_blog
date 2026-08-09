import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import compression from "compression";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import passport from "./config/passport.js";
import destinationRoutes from "./routes/destinationRoutes.js";
import blogRoutes from "./routes/blogRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { notFound, errorHandler } from "./middlewares/errorHandler.js";

const app = express();

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

app.use(passport.initialize());

app.get("/api/v1/health", (req, res) => {
  res.json({ success: true, message: "Nepal Tourism API is running" });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/destinations", destinationRoutes);
app.use("/api/v1/blogs", blogRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/comments", commentRoutes);
app.use("/api/v1/admin/users", userRoutes);

// Images now live on Cloudinary and are served from res.cloudinary.com
// directly — the local /uploads static route and the uploads/ directory
// on disk are no longer needed.

app.use(notFound);
app.use(errorHandler);

export default app;