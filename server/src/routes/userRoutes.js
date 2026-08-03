import express from "express";
import { getUsers, updateUserRole, toggleUserActive } from "../controllers/userController.js";
import { protect, authorize } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", protect, authorize("admin", "superadmin"), getUsers);
router.patch("/:id/role", protect, authorize("admin", "superadmin"), updateUserRole);
router.patch("/:id/status", protect, authorize("admin", "superadmin"), toggleUserActive);

export default router;