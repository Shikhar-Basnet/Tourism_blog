import express from "express";
import {
  getDestinations,
  getDestinationBySlug,
  createDestination,
  updateDestination,
  deleteDestination,
  toggleDestinationLike,
  getDestinationFilters,
} from "../controllers/destinationController.js";
import { protect, authorize, optionalAuth, onlyPublicUsers } from "../middlewares/authMiddleware.js";

const router = express.Router();

const staffOnly = [protect, authorize("editor", "admin", "superadmin")];

// Public reads
router.route("/").get(getDestinations).post(...staffOnly, createDestination);
router.route("/:slug").get(optionalAuth, getDestinationBySlug);
router.get("/meta/filters", getDestinationFilters);

router.route("/").get(getDestinations).post(...staffOnly, createDestination);
router.route("/id/:id").put(...staffOnly, updateDestination).delete(...staffOnly, deleteDestination);
router.post("/id/:id/like", protect, onlyPublicUsers, toggleDestinationLike);

export default router;