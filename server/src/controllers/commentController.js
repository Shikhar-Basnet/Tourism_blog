import Comment from "../models/Comment.js";

const VALID_TARGETS = ["Blog", "Destination"];
const STAFF_ROLES = ["editor", "admin", "superadmin"];
const MAX_COMMENTS_PER_USER = 5;

// @desc    List comments for a blog or destination
// @route   GET /api/v1/comments?targetType=Blog&targetId=<id>
export const getComments = async (req, res, next) => {
  try {
    const { targetType, targetId } = req.query;

    if (!VALID_TARGETS.includes(targetType) || !targetId) {
      res.status(400);
      throw new Error("targetType (Blog|Destination) and targetId are required");
    }

    const comments = await Comment.find({ targetType, targetId })
      .populate("author", "name avatar role")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: comments.length, data: comments });
  } catch (err) {
    next(err);
  }
};

// @desc    Create a comment — visitor accounts (role: "user") only
// @route   POST /api/v1/comments
export const createComment = async (req, res, next) => {
  try {
    const { targetType, targetId, content } = req.body;

    if (!VALID_TARGETS.includes(targetType) || !targetId) {
      res.status(400);
      throw new Error("targetType (Blog|Destination) and targetId are required");
    }
    if (!content?.trim()) {
      res.status(400);
      throw new Error("Comment content is required");
    }

    const existingCommentCount = await Comment.countDocuments({
      author: req.user._id,
      targetType,
      targetId,
    });

    if (existingCommentCount >= MAX_COMMENTS_PER_USER) {
      res.status(400);
      throw new Error("You can only leave up to 5 comments on this post");
    }

    const comment = await Comment.create({
      content: content.trim(),
      author: req.user._id,
      targetType,
      targetId,
    });

    await comment.populate("author", "name avatar role");
    res.status(201).json({ success: true, data: comment });
  } catch (err) {
    next(err);
  }
};

// @desc    Edit your own comment
// @route   PUT /api/v1/comments/:id
export const updateComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      res.status(404);
      throw new Error("Comment not found");
    }
    if (comment.author.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("You can only edit your own comments");
    }

    comment.content = req.body.content?.trim() || comment.content;
    comment.isEdited = true;
    await comment.save();
    await comment.populate("author", "name avatar role");

    res.json({ success: true, data: comment });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a comment — the comment's own author, or staff (moderation)
// @route   DELETE /api/v1/comments/:id
export const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      res.status(404);
      throw new Error("Comment not found");
    }

    const isOwner = comment.author.toString() === req.user._id.toString();
    const isStaff = STAFF_ROLES.includes(req.user.role);

    if (!isOwner && !isStaff) {
      res.status(403);
      throw new Error("You can only delete your own comments");
    }

    await comment.deleteOne();
    res.json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};