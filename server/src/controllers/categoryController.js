import Category from "../models/Category.js";
import { cacheGetOrSet, cacheInvalidate } from "../config/cache.js";

// Categories change extremely rarely (staff CRUD only) and are read on
// nearly every page (Blogs filter chips, admin dropdowns) — a textbook
// caching candidate. 5 min TTL, same pattern as destinations:filters.

// @route   GET /api/v1/categories
export const getCategories = async (req, res, next) => {
  try {
    const categories = await cacheGetOrSet("categories:all", 300, async () => {
      return Category.find().sort({ name: 1 });
    });
    res.json({ success: true, count: categories.length, data: categories });
  } catch (err) {
    next(err);
  }
};

// @route   GET /api/v1/categories/:slug
export const getCategoryBySlug = async (req, res, next) => {
  try {
    const category = await cacheGetOrSet(
      `categories:slug:${req.params.slug}`,
      300,
      async () => Category.findOne({ slug: req.params.slug })
    );

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
    await cacheInvalidate("categories:*");
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
    await cacheInvalidate("categories:*");
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
    await cacheInvalidate("categories:*");
    res.json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};