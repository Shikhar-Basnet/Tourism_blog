import Destination from "../models/Destination.js";
import { deleteCloudinaryImage } from "../middlewares/uploadMiddleware.js";
import { cacheGetOrSet, cacheInvalidate } from "../config/cache.js";

const MAX_LIMIT = 100;

// @desc    Get all destinations (supports pagination + basic filters)
// @route   GET /api/v1/destinations
export const getDestinations = async (req, res, next) => {
  try {
    const { page = 1, province, category, search } = req.query;
    const limit = Math.min(Number(req.query.limit) || 12, MAX_LIMIT);

    const query = {};
    if (province) query.province = province;
    if (category) query.category = category;
    if (search) query.$text = { $search: search };

    // Cached per unique combination of filters/page — search queries are
    // deliberately excluded from the cache key space growing unbounded by
    // capping TTL short (30s), since search terms vary far more than
    // province/category browsing.
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
    const destination = await Destination.findOne({ slug: req.params.slug });
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
    const userId = req.user._id;

    const alreadyLiked = await Destination.exists({ _id: req.params.id, likedBy: userId });

    const update = alreadyLiked
      ? { $pull: { likedBy: userId } }
      : { $addToSet: { likedBy: userId } };

    const destination = await Destination.findByIdAndUpdate(req.params.id, update, { new: true });
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
    // $vectorSearch is the most expensive query in this whole controller,
    // and "related" content tolerates a few minutes of staleness fine —
    // nobody notices if a related-destinations row updates 5 minutes late.
    const related = await cacheGetOrSet(
      `destinations:related:${req.params.id}`,
      300,
      async () => {
        const destination = await Destination.findById(req.params.id).select("+embedding");
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
    const { lat, lng, radiusKm = 50 } = req.query;
    const limit = Math.min(Number(req.query.limit) || 6, MAX_LIMIT);
    if (lat == null || lng == null) {
      res.status(400);
      throw new Error("lat and lng query params are required");
    }

    const raw = await Destination.aggregate([
      {
        $geoNear: {
          near: { type: "Point", coordinates: [Number(lng), Number(lat)] },
          distanceField: "distanceMeters",
          maxDistance: Number(radiusKm) * 1000,
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

    if (req.files?.length) {
      body.gallery = req.files.map((f) => f.path);
    }

    const destination = await Destination.create(body);

    await Promise.all([
      cacheInvalidate("destinations:list:*"),
      cacheInvalidate("destinations:related:*"),
      cacheInvalidate("destinations:filters"),
    ]);

    res.status(201).json({ success: true, data: destination });
  } catch (err) {
    next(err);
  }
};

// @desc    Update destination — staff only.
// @route   PUT /api/v1/destinations/id/:id
export const updateDestination = async (req, res, next) => {
  try {
    const updates = { ...req.body };

    ["category", "tags", "coordinates"].forEach((key) => {
      if (typeof updates[key] === "string") {
        try { updates[key] = JSON.parse(updates[key]); } catch { /* leave as-is */ }
      }
    });

    const destination = await Destination.findById(req.params.id);
    if (!destination) {
      res.status(404);
      throw new Error("Destination not found");
    }

    let gallery = destination.gallery || [];
    if (updates.removeImages) {
      const toRemove = JSON.parse(updates.removeImages);
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

    res.json({ success: true, data: destination });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete destination — also cleans up its gallery images on Cloudinary.
// @route   DELETE /api/v1/destinations/id/:id
export const deleteDestination = async (req, res, next) => {
  try {
    const destination = await Destination.findByIdAndDelete(req.params.id);
    if (!destination) {
      res.status(404);
      throw new Error("Destination not found");
    }
    await Promise.all((destination.gallery || []).map(deleteCloudinaryImage));

    // filters is included here too — deleting the last destination in a
    // province/category should make it disappear from the filter dropdowns.
    await Promise.all([
      cacheInvalidate("destinations:list:*"),
      cacheInvalidate("destinations:related:*"),
      cacheInvalidate("destinations:filters"),
    ]);

    res.json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};