import Destination from "../models/Destination.js";

// @desc    Get all destinations (supports pagination + basic filters)
// @route   GET /api/v1/destinations
export const getDestinations = async (req, res, next) => {
  try {
    const { page = 1, limit = 12, province, category, search } = req.query;

    const query = {};
    if (province) query.province = province;
    if (category) query.category = category;
    if (search) query.$text = { $search: search };

    const destinations = await Destination.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Destination.countDocuments(query);

    res.json({
      success: true,
      count: destinations.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: destinations,
    });
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
    const [provinces, categories] = await Promise.all([
      Destination.distinct("province"),
      Destination.distinct("category"),
    ]);
    res.json({
      success: true,
      data: { provinces: provinces.sort(), categories: categories.sort() },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Toggle a like from the current user — restricted to role "user".
// @route   POST /api/v1/destinations/id/:id/like
export const toggleDestinationLike = async (req, res, next) => {
  try {
    const destination = await Destination.findById(req.params.id);
    if (!destination) {
      res.status(404);
      throw new Error("Destination not found");
    }

    const userId = req.user._id.toString();
    const alreadyLiked = destination.likedBy.some((id) => id.toString() === userId);

    if (alreadyLiked) {
      destination.likedBy = destination.likedBy.filter((id) => id.toString() !== userId);
    } else {
      destination.likedBy.push(req.user._id);
    }

    await destination.save({ validateBeforeSave: false });

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
    const destination = await Destination.findById(req.params.id).select("+embedding");
    if (!destination) {
      res.status(404);
      throw new Error("Destination not found");
    }

    let related = [];

    if (destination.embedding?.length) {
      related = await Destination.aggregate([
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

    if (related.length === 0) {
      related = await Destination.find({
        _id: { $ne: destination._id },
        $or: [{ category: { $in: destination.category } }, { province: destination.province }],
      })
        .limit(3)
        .select("title slug province gallery category");
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
    const { lat, lng, radiusKm = 50, limit = 6 } = req.query;
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
      { $limit: Number(limit) },
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

// @desc    Create destination — staff only. Accepts multiple uploaded images
//          (req.files, field name "images") which become the initial gallery.
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
      body.gallery = req.files.map((f) => `/uploads/images/${f.filename}`);
    }

    const destination = await Destination.create(body);
    res.status(201).json({ success: true, data: destination });
  } catch (err) {
    next(err);
  }
};

// @desc    Update destination — staff only. Supports adding any number of new
//          images (req.files, field name "images") and removing existing ones
//          by URL via a JSON-encoded "removeImages" field in the body.
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

    // Start from the existing gallery, minus anything the admin removed
    let gallery = destination.gallery || [];
    if (updates.removeImages) {
      const toRemove = JSON.parse(updates.removeImages);
      gallery = gallery.filter((url) => !toRemove.includes(url));
    }
    delete updates.removeImages;

    // Append any newly uploaded files
    if (req.files?.length) {
      const newUrls = req.files.map((f) => `/uploads/images/${f.filename}`);
      gallery = [...gallery, ...newUrls];
    }
    updates.gallery = gallery;

    Object.assign(destination, updates);
    await destination.save({ validateBeforeSave: true });

    res.json({ success: true, data: destination });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete destination
// @route   DELETE /api/v1/destinations/id/:id
export const deleteDestination = async (req, res, next) => {
  try {
    const destination = await Destination.findByIdAndDelete(req.params.id);
    if (!destination) {
      res.status(404);
      throw new Error("Destination not found");
    }
    res.json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};