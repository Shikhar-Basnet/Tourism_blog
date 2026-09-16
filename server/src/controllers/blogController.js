import Blog from "../models/Blog.js";
import { deleteCloudinaryImage } from "../middlewares/uploadMiddleware.js";
import { cacheGetOrSet, cacheInvalidate } from "../config/cache.js";
import { sanitizeText, sanitizeObjectId, logSecurityEvent } from "../utils/security.js";

const STAFF_ROLES = ["editor", "admin", "superadmin"];
const isStaff = (req) => req.user && STAFF_ROLES.includes(req.user.role);
const MAX_LIMIT = 100;

// @desc    List blogs. Public visitors only ever see published posts;
//          staff can pass ?status=draft (or any status) to review their own work.
// @route   GET /api/v1/blogs
export const getBlogs = async (req, res, next) => {
  try {
    const { category, tag, search, status } = req.query;
    const page = Number(req.query.page) > 0 ? Number(req.query.page) : 1;
    const limit = Math.min(Number(req.query.limit) || 9, MAX_LIMIT);
    const safeCategory = sanitizeText(category, 80);
    const safeTag = sanitizeText(tag, 80);
    const safeSearch = sanitizeText(search, 120);
    const safeStatus = status && ["draft", "published"].includes(status) ? status : null;

    const query = {};
    if (isStaff(req) && safeStatus) {
      query.status = safeStatus;
    } else {
      query.status = "published";
    }
    if (safeCategory) query.category = safeCategory;
    if (safeTag) query.tags = safeTag;
    if (safeSearch) query.$text = { $search: safeSearch };

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
        page,
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
    const slug = sanitizeText(req.params.slug, 120).toLowerCase();
    if (!slug) {
      res.status(400);
      throw new Error("Blog slug is required");
    }

    const blog = await Blog.findOne({ slug })
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
    const title = sanitizeText(req.body?.title, 180);
    const content = sanitizeText(req.body?.content, 20000);
    const excerpt = sanitizeText(req.body?.excerpt, 300);
    const category = sanitizeText(req.body?.category, 80);
    const status = req.body?.status === "published" ? "published" : "draft";

    if (!title || !content) {
      res.status(400);
      throw new Error("Title and content are required");
    }

    const body = {
      title,
      excerpt: excerpt || undefined,
      content,
      category: category || undefined,
      status,
      author: req.user._id,
    };

    if (typeof req.body?.tags === "string") {
      try {
        body.tags = JSON.parse(req.body.tags);
      } catch {
        body.tags = req.body.tags.split(",").map((t) => sanitizeText(t, 50)).filter(Boolean);
      }
    }
    if (Array.isArray(req.body?.tags)) {
      body.tags = req.body.tags.map((tag) => sanitizeText(tag, 50)).filter(Boolean).slice(0, 20);
    }
    if (req.file) body.featuredImage = req.file.path;

    const blog = await Blog.create(body);
    await cacheInvalidate("blogs:list:*");
    logSecurityEvent("blog_created", { actorId: req.user?._id?.toString(), blogId: blog._id.toString(), status: blog.status });
    res.status(201).json({ success: true, data: blog });
  } catch (err) {
    next(err);
  }
};

// @route   PUT /api/v1/blogs/id/:id  (staff only)
export const updateBlog = async (req, res, next) => {
  try {
    const blogId = sanitizeObjectId(req.params.id, "Blog ID");
    const updates = {};

    if (req.body?.title !== undefined) updates.title = sanitizeText(req.body.title, 180);
    if (req.body?.excerpt !== undefined) updates.excerpt = sanitizeText(req.body.excerpt, 300);
    if (req.body?.content !== undefined) updates.content = sanitizeText(req.body.content, 20000);
    if (req.body?.category !== undefined) updates.category = sanitizeText(req.body.category, 80) || undefined;
    if (req.body?.status !== undefined) updates.status = req.body.status === "published" ? "published" : "draft";

    if (typeof req.body?.tags === "string") {
      try {
        updates.tags = JSON.parse(req.body.tags);
      } catch {
        updates.tags = req.body.tags.split(",").map((t) => sanitizeText(t, 50)).filter(Boolean);
      }
    } else if (Array.isArray(req.body?.tags)) {
      updates.tags = req.body.tags.map((tag) => sanitizeText(tag, 50)).filter(Boolean).slice(0, 20);
    }

    const blog = await Blog.findById(blogId);
    if (!blog) { res.status(404); throw new Error("Blog not found"); }

    const removeFeaturedImage = req.body?.removeFeaturedImage === "true";

    const previousImage = blog.featuredImage;
    Object.assign(blog, updates);

    if (req.file) {
      blog.featuredImage = req.file.path;
      if (previousImage) await deleteCloudinaryImage(previousImage);
    } else if (removeFeaturedImage) {
      blog.featuredImage = undefined;
      if (previousImage) await deleteCloudinaryImage(previousImage);
    }

    if (updates.title && !updates.content) {
      // no-op: the title field is already assigned, and content is validated separately when present
    }
    if (updates.title === "" || updates.content === "") {
      res.status(400);
      throw new Error("Title and content must not be empty");
    }

    await blog.save();
    await cacheInvalidate("blogs:list:*");
    logSecurityEvent("blog_updated", { actorId: req.user?._id?.toString(), blogId: blog._id.toString() });
    res.json({ success: true, data: blog });
  } catch (err) {
    next(err);
  }
};

// @route   DELETE /api/v1/blogs/id/:id  (staff only)
export const deleteBlog = async (req, res, next) => {
  try {
    const blogId = sanitizeObjectId(req.params.id, "Blog ID");
    const blog = await Blog.findByIdAndDelete(blogId);
    if (!blog) {
      res.status(404);
      throw new Error("Blog not found");
    }
    if (blog.featuredImage) await deleteCloudinaryImage(blog.featuredImage);
    await cacheInvalidate("blogs:list:*");
    logSecurityEvent("blog_deleted", { actorId: req.user?._id?.toString(), blogId: blog._id.toString() });
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
    const blogId = sanitizeObjectId(req.params.id, "Blog ID");
    const userId = req.user._id;

    const alreadyLiked = await Blog.exists({ _id: blogId, likedBy: userId });

    const update = alreadyLiked
      ? { $pull: { likedBy: userId } }
      : { $addToSet: { likedBy: userId } };

    const blog = await Blog.findByIdAndUpdate(blogId, update, { new: true });
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