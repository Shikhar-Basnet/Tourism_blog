import Blog from "../models/Blog.js";
import { deleteCloudinaryImage } from "../middlewares/uploadMiddleware.js";
import { cacheGetOrSet, cacheInvalidate } from "../config/cache.js";

const STAFF_ROLES = ["editor", "admin", "superadmin"];
const isStaff = (req) => req.user && STAFF_ROLES.includes(req.user.role);
const MAX_LIMIT = 100;

// @desc    List blogs. Public visitors only ever see published posts;
//          staff can pass ?status=draft (or any status) to review their own work.
// @route   GET /api/v1/blogs
export const getBlogs = async (req, res, next) => {
  try {
    const { page = 1, category, tag, search, status } = req.query;
    const limit = Math.min(Number(req.query.limit) || 9, MAX_LIMIT);

    const query = {};
    if (isStaff(req) && status) {
      query.status = status;
    } else {
      query.status = "published";
    }
    if (category) query.category = category;
    if (tag) query.tags = tag;
    if (search) query.$text = { $search: search };

    const fetchBlogs = async () => {
      const blogs = await Blog.find(query)
        .populate("category", "name slug")
        .populate("author", "name avatar")
        .sort({ publishedAt: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      const total = await Blog.countDocuments(query);

      return {
        count: blogs.length,
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
        data: blogs,
      };
    };

    // Only cache the public "published" listing — this is the view almost
    // everyone hits (homepage, /blogs, category filters). Staff draft/status
    // queries are low-traffic and staff expect to see their own edits
    // immediately, so those bypass the cache entirely.
    const result =
      query.status === "published"
        ? await cacheGetOrSet(
            `blogs:list:${page}:${limit}:${category || "all"}:${tag || "all"}:${search || "none"}`,
            30,
            fetchBlogs
          )
        : await fetchBlogs();

    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

// @desc    Single blog by slug. Increments views on published posts.
//          Also returns up to 3 related posts sharing the same category.
// @route   GET /api/v1/blogs/:slug
// NOTE: deliberately NOT cached — every request increments `views`, and the
// response carries `isLikedByCurrentUser`, which is per-visitor. Caching
// either value would mean either losing view counts or leaking one user's
// like state to another.
export const getBlogBySlug = async (req, res, next) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug })
      .populate("category", "name slug")
      .populate("author", "name avatar")
      .populate("relatedDestinations", "title slug province");

    if (!blog) {
      res.status(404);
      throw new Error("Blog not found");
    }

    if (blog.status !== "published" && !isStaff(req)) {
      res.status(404);
      throw new Error("Blog not found");
    }

    if (blog.status === "published") {
      await Blog.updateOne({ _id: blog._id }, { $inc: { views: 1 } });
      blog.views += 1;
    }

    const relatedPosts = await Blog.find({
      _id: { $ne: blog._id },
      category: blog.category,
      status: "published",
    })
      .limit(3)
      .select("title slug featuredImage readingTimeMinutes");

    const isLikedByCurrentUser = req.user
      ? blog.likedBy.some((id) => id.toString() === req.user._id.toString())
      : false;

    res.json({ success: true, data: blog, relatedPosts, isLikedByCurrentUser });
  } catch (err) {
    next(err);
  }
};

// @route   POST /api/v1/blogs  (staff only)
export const createBlog = async (req, res, next) => {
  try {
    const body = { ...req.body, author: req.user._id };

    if (typeof body.tags === "string") {
      try { body.tags = JSON.parse(body.tags); }
      catch { body.tags = body.tags.split(",").map((t) => t.trim()).filter(Boolean); }
    }
    if (req.file) body.featuredImage = req.file.path;

    const blog = await Blog.create(body);
    await cacheInvalidate("blogs:list:*");
    res.status(201).json({ success: true, data: blog });
  } catch (err) {
    next(err);
  }
};

// @route   PUT /api/v1/blogs/id/:id  (staff only)
export const updateBlog = async (req, res, next) => {
  try {
    const updates = { ...req.body };

    if (typeof updates.tags === "string") {
      try { updates.tags = JSON.parse(updates.tags); }
      catch { updates.tags = updates.tags.split(",").map((t) => t.trim()).filter(Boolean); }
    }

    const blog = await Blog.findById(req.params.id);
    if (!blog) { res.status(404); throw new Error("Blog not found"); }

    const removeFeaturedImage = updates.removeFeaturedImage === "true";
    delete updates.removeFeaturedImage;

    const previousImage = blog.featuredImage;
    Object.assign(blog, updates);

    if (req.file) {
      blog.featuredImage = req.file.path;
      if (previousImage) await deleteCloudinaryImage(previousImage);
    } else if (removeFeaturedImage) {
      blog.featuredImage = undefined;
      if (previousImage) await deleteCloudinaryImage(previousImage);
    }

    await blog.save();
    await cacheInvalidate("blogs:list:*");
    res.json({ success: true, data: blog });
  } catch (err) {
    next(err);
  }
};

// @route   DELETE /api/v1/blogs/id/:id  (staff only)
export const deleteBlog = async (req, res, next) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) {
      res.status(404);
      throw new Error("Blog not found");
    }
    if (blog.featuredImage) await deleteCloudinaryImage(blog.featuredImage);
    await cacheInvalidate("blogs:list:*");
    res.json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};

// @desc    Toggle a like from the current user — one like per user max.
//          Not cached/invalidated here: likesCount isn't shown on the list
//          view (BlogCard shows reading time + views, not likes), so a like
//          toggle has nothing stale to invalidate in blogs:list:*.
// @route   POST /api/v1/blogs/id/:id/like
export const toggleBlogLike = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const alreadyLiked = await Blog.exists({ _id: req.params.id, likedBy: userId });

    const update = alreadyLiked
      ? { $pull: { likedBy: userId } }
      : { $addToSet: { likedBy: userId } };

    const blog = await Blog.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!blog) {
      res.status(404);
      throw new Error("Blog not found");
    }

    res.json({
      success: true,
      data: { liked: !alreadyLiked, likesCount: blog.likedBy.length },
    });
  } catch (err) {
    next(err);
  }
};