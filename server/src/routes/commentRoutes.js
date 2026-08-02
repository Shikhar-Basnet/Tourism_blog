import express from "express";
import {
  getComments,
  createComment,
  updateComment,
  deleteComment,
} from "../controllers/commentController.js";
import { protect, onlyPublicUsers } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", getComments);
router.post("/", protect, onlyPublicUsers, createComment);
router.put("/:id", protect, onlyPublicUsers, updateComment);
router.delete("/:id", protect, deleteComment); // staff can also moderate-delete, checked in controller

export default router;