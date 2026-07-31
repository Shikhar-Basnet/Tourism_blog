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
    res.json({ success: true, data: destination });
  } catch (err) {
    next(err);
  }
};

// @desc    Create destination (admin/editor only — RBAC middleware added in Phase 2)
// @route   POST /api/v1/destinations
export const createDestination = async (req, res, next) => {
  try {
    const destination = await Destination.create(req.body);
    res.status(201).json({ success: true, data: destination });
  } catch (err) {
    next(err);
  }
};

// @desc    Update destination
// @route   PUT /api/v1/destinations/:id
export const updateDestination = async (req, res, next) => {
  try {
    const destination = await Destination.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!destination) {
      res.status(404);
      throw new Error("Destination not found");
    }
    res.json({ success: true, data: destination });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete destination
// @route   DELETE /api/v1/destinations/:id
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
