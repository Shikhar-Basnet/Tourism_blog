import express from "express";
import {
  getDestinations,
  getDestinationBySlug,
  createDestination,
  updateDestination,
  deleteDestination,
} from "../controllers/destinationController.js";
import { protect, authorize } from "../middlewares/authMiddleware.js";

const router = express.Router();

const staffOnly = [protect, authorize("editor", "admin", "superadmin")];

// Public reads
router.route("/").get(getDestinations).post(...staffOnly, createDestination);
router.route("/:slug").get(getDestinationBySlug);
router.route("/id/:id").put(...staffOnly, updateDestination).delete(...staffOnly, deleteDestination);

export default router;