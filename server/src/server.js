import "dotenv/config";
import passport from "passport";

import app from "./app.js";
import { connectDB } from "./config/db.js";
import { connectRedis } from "./config/cache.js";
import { assertCloudinaryConfigured } from "./middlewares/uploadMiddleware.js";

const PORT = process.env.PORT || 5000;

assertCloudinaryConfigured();

Promise.all([connectDB(), connectRedis()]).then(() => {
  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`);
  });
});