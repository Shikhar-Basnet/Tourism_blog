import express from "express";
import {
  getDestinations,
  getDestinationBySlug,
  createDestination,
  updateDestination,
  deleteDestination,
} from "../controllers/destinationController.js";

const router = express.Router();

router.route("/").get(getDestinations).post(createDestination);
router.route("/:slug").get(getDestinationBySlug);
router.route("/id/:id").put(updateDestination).delete(deleteDestination);

export default router;
