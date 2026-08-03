import Blog from "../models/Blog.js";

const STAFF_ROLES = ["editor", "admin", "superadmin"];
const isStaff = (req) => req.user && STAFF_ROLES.includes(req.user.role);

// @desc    List blogs. Public visitors only ever see published posts;
//          staff can pass ?status=draft (or any status) to review their own work.
// @route   GET /api/v1/blogs
export const getBlogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 9, category, tag, search, status } = req.query;

    const query = {};
    if (isStaff(req) && status) {
      query.status = status;
    } else {
      query.status = "published"; // public/guest visitors never see drafts
    }
    if (category) query.category = category;
    if (tag) query.tags = tag;
    if (search) query.$text = { $search: search };

    const blogs = await Blog.find(query)
      .populate("category", "name slug")
      .populate("author", "name avatar")
      .sort({ publishedAt: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Blog.countDocuments(query);

    res.json({
      success: true,
      count: blogs.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: blogs,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Single blog by slug. Increments views on published posts.
//          Also returns up to 3 related posts sharing the same category.
// @route   GET /api/v1/blogs/:slug
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

    // Drafts are only visible to staff
    if (blog.status !== "published" && !isStaff(req)) {
      res.status(404);
      throw new Error("Blog not found");
    }

    if (blog.status === "published") {
      blog.views += 1;
      await blog.save({ validateBeforeSave: false });
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
    if (req.file) body.featuredImage = `/uploads/images/${req.file.filename}`;

    const blog = await Blog.create(body);
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

    // "removeFeaturedImage" is a string over multipart form-data ("true"/"false")
    const removeFeaturedImage = updates.removeFeaturedImage === "true";
    delete updates.removeFeaturedImage;

    Object.assign(blog, updates);

    // A newly uploaded file always wins; otherwise honor an explicit removal.
    if (req.file) {
      blog.featuredImage = `/uploads/images/${req.file.filename}`;
    } else if (removeFeaturedImage) {
      blog.featuredImage = undefined;
    }

    await blog.save();
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
    res.json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};

// @desc    Toggle a like from the current user — one like per user max,
//          calling this again removes it. Restricted to role "user" (see
//          onlyPublicUsers middleware) — staff accounts can't like posts.
// @route   POST /api/v1/blogs/id/:id/like
export const toggleBlogLike = async (req, res, next) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      res.status(404);
      throw new Error("Blog not found");
    }

    const userId = req.user._id.toString();
    const alreadyLiked = blog.likedBy.some((id) => id.toString() === userId);

    if (alreadyLiked) {
      blog.likedBy = blog.likedBy.filter((id) => id.toString() !== userId);
    } else {
      blog.likedBy.push(req.user._id);
    }

    await blog.save({ validateBeforeSave: false });

    res.json({
      success: true,
      data: { liked: !alreadyLiked, likesCount: blog.likedBy.length },
    });
  } catch (err) {
    next(err);
  }
};