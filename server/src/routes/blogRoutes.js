import express from "express";
import {
  getBlogs,
  getBlogBySlug,
  createBlog,
  updateBlog,
  deleteBlog,
  toggleBlogLike,
} from "../controllers/blogController.js";
import { protect, authorize, optionalAuth, onlyPublicUsers } from "../middlewares/authMiddleware.js";

const router = express.Router();
const staffOnly = [protect, authorize("editor", "admin", "superadmin")];

// optionalAuth lets logged-in staff see draft/status-filtered results while
// guests transparently only ever get published posts (enforced in the controller)
router.route("/").get(optionalAuth, getBlogs).post(...staffOnly, createBlog);
router.route("/:slug").get(optionalAuth, getBlogBySlug);
router.route("/id/:id").put(...staffOnly, updateBlog).delete(...staffOnly, deleteBlog);
router.post("/id/:id/like", protect, onlyPublicUsers, toggleBlogLike);

export default router;