import Category from "../models/Category.js";
import { cacheGetOrSet, cacheInvalidate } from "../config/cache.js";
import { sanitizeText, sanitizeObjectId, logSecurityEvent } from "../utils/security.js";

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
    const slug = sanitizeText(req.params.slug, 120).toLowerCase();
    if (!slug) {
      res.status(400);
      throw new Error("Category slug is required");
    }

    const category = await cacheGetOrSet(
      `categories:slug:${slug}`,
      300,
      async () => Category.findOne({ slug })
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
    const name = sanitizeText(req.body?.name, 100);
    const description = sanitizeText(req.body?.description, 500);
    const icon = sanitizeText(req.body?.icon, 50);

    if (!name) {
      res.status(400);
      throw new Error("Category name is required");
    }

    const category = await Category.create({
      name,
      description: description || undefined,
      icon: icon || undefined,
    });
    await cacheInvalidate("categories:*");
    res.status(201).json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
};

// @route   PUT /api/v1/categories/id/:id  (staff only)
export const updateCategory = async (req, res, next) => {
  try {
    const categoryId = sanitizeObjectId(req.params.id, "Category ID");
    const updates = {};

    if (req.body?.name !== undefined) updates.name = sanitizeText(req.body.name, 100);
    if (req.body?.description !== undefined) updates.description = sanitizeText(req.body.description, 500);
    if (req.body?.icon !== undefined) updates.icon = sanitizeText(req.body.icon, 50);

    if (!updates.name && !updates.description && !updates.icon) {
      res.status(400);
      throw new Error("No valid category fields provided");
    }

    const category = await Category.findByIdAndUpdate(categoryId, updates, {
      new: true,
      runValidators: true,
    });
    if (!category) {
      res.status(404);
      throw new Error("Category not found");
    }
    await cacheInvalidate("categories:*");
    logSecurityEvent("category_updated", { actorId: req.user?._id?.toString(), categoryId: category._id.toString() });
    res.json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
};

// @route   DELETE /api/v1/categories/id/:id  (staff only)
export const deleteCategory = async (req, res, next) => {
  try {
    const categoryId = sanitizeObjectId(req.params.id, "Category ID");
    const category = await Category.findByIdAndDelete(categoryId);
    if (!category) {
      res.status(404);
      throw new Error("Category not found");
    }
    await cacheInvalidate("categories:*");
    logSecurityEvent("category_deleted", { actorId: req.user?._id?.toString(), categoryId: category._id.toString() });
    res.json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};