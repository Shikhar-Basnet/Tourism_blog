import express from "express";
import {
  getCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController.js";
import { protect, authorize } from "../middlewares/authMiddleware.js";

const router = express.Router();
const staffOnly = [protect, authorize("editor", "admin", "superadmin")];

router.route("/").get(getCategories).post(...staffOnly, createCategory);
router.route("/:slug").get(getCategoryBySlug);
router.route("/id/:id").put(...staffOnly, updateCategory).delete(...staffOnly, deleteCategory);

export default router;