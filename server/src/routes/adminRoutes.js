import express from "express";
import { getDashboardStats } from "../controllers/adminController.js";
import { protect, authorize } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/stats", protect, authorize("editor", "admin", "superadmin"), getDashboardStats);

export default router;