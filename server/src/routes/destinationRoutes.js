import express from "express";
import {
  getDestinations,
  getDestinationBySlug,
  getRelatedDestinations,
  getNearbyDestinations,
  createDestination,
  updateDestination,
  deleteDestination,
  toggleDestinationLike,
  getDestinationFilters,
} from "../controllers/destinationController.js";
import { upload } from "../middlewares/uploadMiddleware.js";
import { protect, authorize, optionalAuth, onlyPublicUsers } from "../middlewares/authMiddleware.js";

const router = express.Router();

const staffOnly = [protect, authorize("editor", "admin", "superadmin")];

// Static/meta paths first, so "/meta/filters" is never swallowed by "/:slug"
router.get("/meta/filters", getDestinationFilters);

router.route("/")
  .get(getDestinations)
  .post(...staffOnly, upload.array("images", 10), createDestination);

router.get("/near", getNearbyDestinations);

router.route("/:slug").get(optionalAuth, getDestinationBySlug);

router.get("/id/:id/related", getRelatedDestinations);

router.route("/id/:id")
  .put(...staffOnly, upload.array("images", 10), updateDestination)
  .delete(...staffOnly, deleteDestination);

router.post("/id/:id/like", protect, onlyPublicUsers, toggleDestinationLike);

export default router;