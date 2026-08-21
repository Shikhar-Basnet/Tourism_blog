import express from "express";
import {
  createContact,
  getContacts,
  updateContactStatus,
  deleteContact,
} from "../controllers/contactController.js";
import { protect, authorize, optionalAuth } from "../middlewares/authMiddleware.js";
import { contactFormLimiter } from "../middlewares/contactRateLimiter.js";

const router = express.Router();
const staffOnly = [protect, authorize("editor", "admin", "superadmin")];

router.post("/", contactFormLimiter, optionalAuth, createContact);
router.get("/", ...staffOnly, getContacts);
router.patch("/:id", ...staffOnly, updateContactStatus);
router.delete("/:id", ...staffOnly, deleteContact);

export default router;