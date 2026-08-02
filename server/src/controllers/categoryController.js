import Category from "../models/Category.js";

// @route   GET /api/v1/categories
export const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json({ success: true, count: categories.length, data: categories });
  } catch (err) {
    next(err);
  }
};

// @route   GET /api/v1/categories/:slug
export const getCategoryBySlug = async (req, res, next) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug });
    if (!category) {
      res.status(404);
      throw new Error("Category not found");
    }
    res.json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
};

// @route   POST /api/v1/categories  (staff only)
export const createCategory = async (req, res, next) => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
};

// @route   PUT /api/v1/categories/id/:id  (staff only)
export const updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!category) {
      res.status(404);
      throw new Error("Category not found");
    }
    res.json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
};

// @route   DELETE /api/v1/categories/id/:id  (staff only)
export const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      res.status(404);
      throw new Error("Category not found");
    }
    res.json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};