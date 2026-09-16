import Destination from "../models/Destination.js";
import { deleteCloudinaryImage } from "../middlewares/uploadMiddleware.js";
import { cacheGetOrSet, cacheInvalidate } from "../config/cache.js";
import { sanitizeText, sanitizeObjectId, logSecurityEvent } from "../utils/security.js";

const MAX_LIMIT = 100;

// @desc    Get all destinations (supports pagination + basic filters)
// @route   GET /api/v1/destinations
export const getDestinations = async (req, res, next) => {
  try {
    const page = Number(req.query.page) > 0 ? Number(req.query.page) : 1;
    const limit = Math.min(Number(req.query.limit) || 12, MAX_LIMIT);
    const province = sanitizeText(req.query.province, 80);
    const category = sanitizeText(req.query.category, 80);
    const search = sanitizeText(req.query.search, 120);

    const query = {};
    if (province) query.province = province;
    if (category) query.category = category;
    if (search) query.$text = { $search: search };

    const cacheKey = `destinations:list:${page}:${limit}:${province || ""}:${category || ""}:${search || ""}`;

    const result = await cacheGetOrSet(cacheKey, 30, async () => {
      const destinations = await Destination.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      const total = await Destination.countDocuments(query);

      return {
        count: destinations.length,
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
        data: destinations,
      };
    });

    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single destination by slug
// @route   GET /api/v1/destinations/:slug
export const getDestinationBySlug = async (req, res, next) => {
  try {
    const slug = sanitizeText(req.params.slug, 120).toLowerCase();
    if (!slug) {
      res.status(400);
      throw new Error("Destination slug is required");
    }

    const destination = await Destination.findOne({ slug });
    if (!destination) {
      res.status(404);
      throw new Error("Destination not found");
    }

    const isLikedByCurrentUser = req.user
      ? destination.likedBy.some((id) => id.toString() === req.user._id.toString())
      : false;

    res.json({ success: true, data: destination, isLikedByCurrentUser });
  } catch (err) {
    next(err);
  }
};

// @desc    Distinct provinces & categories, for populating filter dropdowns
// @route   GET /api/v1/destinations/meta/filters
export const getDestinationFilters = async (req, res, next) => {
  try {
    // Provinces/categories change only when staff add a destination in a
    // new one — a 5-minute cache is safe and cuts two distinct() scans
    // down to once every 5 minutes instead of on every page load.
    const data = await cacheGetOrSet("destinations:filters", 300, async () => {
      const [provinces, categories] = await Promise.all([
        Destination.distinct("province"),
        Destination.distinct("category"),
      ]);
      return { provinces: provinces.sort(), categories: categories.sort() };
    });

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// @desc    Toggle a like from the current user — restricted to role "user".
// @route   POST /api/v1/destinations/id/:id/like
export const toggleDestinationLike = async (req, res, next) => {
  try {
    const destinationId = sanitizeObjectId(req.params.id, "Destination ID");
    const userId = req.user._id;

    const alreadyLiked = await Destination.exists({ _id: destinationId, likedBy: userId });

    const update = alreadyLiked
      ? { $pull: { likedBy: userId } }
      : { $addToSet: { likedBy: userId } };

    const destination = await Destination.findByIdAndUpdate(destinationId, update, { new: true });
    if (!destination) {
      res.status(404);
      throw new Error("Destination not found");
    }

    res.json({
      success: true,
      data: { liked: !alreadyLiked, likesCount: destination.likedBy.length },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Related destinations — vector similarity if embeddings exist,
//          falling back to shared category/province otherwise.
// @route   GET /api/v1/destinations/id/:id/related
export const getRelatedDestinations = async (req, res, next) => {
  try {
    const destinationId = sanitizeObjectId(req.params.id, "Destination ID");

    const related = await cacheGetOrSet(
      `destinations:related:${destinationId}`,
      300,
      async () => {
        const destination = await Destination.findById(destinationId).select("+embedding");
        if (!destination) return null;

        let result = [];

        if (destination.embedding?.length) {
          result = await Destination.aggregate([
            {
              $vectorSearch: {
                index: "destination_vector_index",
                path: "embedding",
                queryVector: destination.embedding,
                numCandidates: 50,
                limit: 4,
              },
            },
            { $match: { _id: { $ne: destination._id } } },
            { $limit: 3 },
            { $project: { title: 1, slug: 1, province: 1, gallery: 1, category: 1 } },
          ]);
        }

        if (result.length === 0) {
          result = await Destination.find({
            _id: { $ne: destination._id },
            $or: [{ category: { $in: destination.category } }, { province: destination.province }],
          })
            .limit(3)
            .select("title slug province gallery category");
        }

        return result;
      }
    );

    if (related === null) {
      res.status(404);
      throw new Error("Destination not found");
    }

    res.json({ success: true, data: related });
  } catch (err) {
    next(err);
  }
};

// @desc    Destinations near a point, nearest-first, with distance in km
// @route   GET /api/v1/destinations/near?lat=..&lng=..&radiusKm=50
export const getNearbyDestinations = async (req, res, next) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const radiusKm = Number(req.query.radiusKm) || 50;
    const limit = Math.min(Number(req.query.limit) || 6, MAX_LIMIT);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      res.status(400);
      throw new Error("lat and lng query params are required");
    }
    if (radiusKm <= 0 || radiusKm > 5000) {
      res.status(400);
      throw new Error("radiusKm must be between 1 and 5000");
    }

    const raw = await Destination.aggregate([
      {
        $geoNear: {
          near: { type: "Point", coordinates: [lng, lat] },
          distanceField: "distanceMeters",
          maxDistance: radiusKm * 1000,
          spherical: true,
        },
      },
      { $limit: limit },
    ]);

    const data = raw.map((d) => ({
      ...d,
      distanceKm: Math.round((d.distanceMeters / 1000) * 10) / 10,
    }));

    res.json({ success: true, count: data.length, data });
  } catch (err) {
    next(err);
  }
};

// @desc    Create destination — staff only.
// @route   POST /api/v1/destinations
export const createDestination = async (req, res, next) => {
  try {
    const body = { ...req.body };

    ["category", "tags", "coordinates"].forEach((key) => {
      if (typeof body[key] === "string") {
        try { body[key] = JSON.parse(body[key]); } catch { /* leave as-is */ }
      }
    });

    const title = sanitizeText(body.title, 180);
    const description = sanitizeText(body.description, 4000);
    const province = sanitizeText(body.province, 80);
    const district = sanitizeText(body.district, 80);
    const bestTimeToVisit = sanitizeText(body.bestTimeToVisit, 120);
    const altitude = body.altitude === "" || body.altitude == null ? undefined : Number(body.altitude);
    const lat = Number(body?.coordinates?.lat ?? body["coordinates.lat"]);
    const lng = Number(body?.coordinates?.lng ?? body["coordinates.lng"]);

    if (!title || !description || !province || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      res.status(400);
      throw new Error("Title, description, province, latitude and longitude are required");
    }

    body.title = title;
    body.description = description;
    body.province = province;
    body.district = district || undefined;
    body.bestTimeToVisit = bestTimeToVisit || undefined;
    body.altitude = Number.isFinite(altitude) ? altitude : undefined;
    body.coordinates = { lat, lng };

    if (req.files?.length) {
      body.gallery = req.files.map((f) => f.path);
    }

    const destination = await Destination.create(body);

    await Promise.all([
      cacheInvalidate("destinations:list:*"),
      cacheInvalidate("destinations:related:*"),
      cacheInvalidate("destinations:filters"),
    ]);
    logSecurityEvent("destination_created", { actorId: req.user?._id?.toString(), destinationId: destination._id.toString() });

    res.status(201).json({ success: true, data: destination });
  } catch (err) {
    next(err);
  }
};

// @desc    Update destination — staff only.
// @route   PUT /api/v1/destinations/id/:id
export const updateDestination = async (req, res, next) => {
  try {
    const destinationId = sanitizeObjectId(req.params.id, "Destination ID");
    const updates = { ...req.body };

    ["category", "tags", "coordinates"].forEach((key) => {
      if (typeof updates[key] === "string") {
        try { updates[key] = JSON.parse(updates[key]); } catch { /* leave as-is */ }
      }
    });

    const destination = await Destination.findById(destinationId);
    if (!destination) {
      res.status(404);
      throw new Error("Destination not found");
    }

    if (updates.title !== undefined) updates.title = sanitizeText(updates.title, 180);
    if (updates.description !== undefined) updates.description = sanitizeText(updates.description, 4000);
    if (updates.province !== undefined) updates.province = sanitizeText(updates.province, 80);
    if (updates.district !== undefined) updates.district = sanitizeText(updates.district, 80) || undefined;
    if (updates.bestTimeToVisit !== undefined) updates.bestTimeToVisit = sanitizeText(updates.bestTimeToVisit, 120) || undefined;
    if (updates.altitude !== undefined && updates.altitude !== "") updates.altitude = Number(updates.altitude);
    if (updates.coordinates !== undefined) {
      const lat = Number(updates.coordinates.lat);
      const lng = Number(updates.coordinates.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        res.status(400);
        throw new Error("Latitude and longitude must be valid numbers");
      }
      updates.coordinates = { lat, lng };
    }

    let gallery = destination.gallery || [];
    if (updates.removeImages) {
      const toRemove = Array.isArray(JSON.parse(updates.removeImages)) ? JSON.parse(updates.removeImages) : [];
      gallery = gallery.filter((url) => !toRemove.includes(url));
      await Promise.all(toRemove.map(deleteCloudinaryImage));
    }
    delete updates.removeImages;

    if (req.files?.length) {
      const newUrls = req.files.map((f) => f.path);
      gallery = [...gallery, ...newUrls];
    }
    updates.gallery = gallery;

    Object.assign(destination, updates);
    await destination.save({ validateBeforeSave: true });

    // filters is included here too — an edit can change a destination's
    // province/category, which shifts what the filter dropdowns should show.
    await Promise.all([
      cacheInvalidate("destinations:list:*"),
      cacheInvalidate("destinations:related:*"),
      cacheInvalidate("destinations:filters"),
    ]);
    logSecurityEvent("destination_updated", { actorId: req.user?._id?.toString(), destinationId: destination._id.toString() });

    res.json({ success: true, data: destination });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete destination — also cleans up its gallery images on Cloudinary.
// @route   DELETE /api/v1/destinations/id/:id
export const deleteDestination = async (req, res, next) => {
  try {
    const destinationId = sanitizeObjectId(req.params.id, "Destination ID");
    const destination = await Destination.findByIdAndDelete(destinationId);
    if (!destination) {
      res.status(404);
      throw new Error("Destination not found");
    }
    await Promise.all((destination.gallery || []).map(deleteCloudinaryImage));

    await Promise.all([
      cacheInvalidate("destinations:list:*"),
      cacheInvalidate("destinations:related:*"),
      cacheInvalidate("destinations:filters"),
    ]);
    logSecurityEvent("destination_deleted", { actorId: req.user?._id?.toString(), destinationId: destination._id.toString() });

    res.json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};