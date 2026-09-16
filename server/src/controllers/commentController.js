import mongoose from "mongoose";
import Comment from "../models/Comment.js";
import { cacheGetOrSet, cacheInvalidate } from "../config/cache.js";
import { sanitizeText, sanitizeObjectId, logSecurityEvent } from "../utils/security.js";

const VALID_TARGETS = ["Blog", "Destination"];
const STAFF_ROLES = ["editor", "admin", "superadmin"];
const MAX_COMMENTS_PER_USER = 5;

const commentsCacheKey = (targetType, targetId) => `comments:${targetType}:${targetId}`;
const normalizeTargetType = (value) => {
  const normalized = typeof value === "string" ? value.trim() : "";
  return VALID_TARGETS.includes(normalized) ? normalized : null;
};

// @desc    List comments for a blog or destination
// @route   GET /api/v1/comments?targetType=Blog&targetId=<id>
export const getComments = async (req, res, next) => {
  try {
    const targetType = normalizeTargetType(req.query.targetType);
    const targetId = typeof req.query.targetId === "string" ? sanitizeObjectId(req.query.targetId, "Comment target ID") : null;

    if (!targetType || !targetId) {
      res.status(400);
      throw new Error("targetType (Blog|Destination) and targetId are required");
    }

    const comments = await cacheGetOrSet(
      commentsCacheKey(targetType, targetId),
      20,
      async () =>
        Comment.find({ targetType, targetId })
          .populate("author", "name avatar role")
          .sort({ createdAt: -1 })
    );

    res.json({ success: true, count: comments.length, data: comments });
  } catch (err) {
    next(err);
  }
};

// @desc    Create a comment — visitor accounts (role: "user") only.
// @route   POST /api/v1/comments
export const createComment = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    const targetType = normalizeTargetType(req.body?.targetType);
    const targetId = typeof req.body?.targetId === "string" ? sanitizeObjectId(req.body.targetId, "Comment target ID") : null;
    const content = sanitizeText(req.body?.content, 1000);

    if (!targetType || !targetId || !content) {
      res.status(400);
      throw new Error("targetType (Blog|Destination), targetId, and comment content are required");
    }

    let comment;

    await session.withTransaction(async () => {
      const existingCommentCount = await Comment.countDocuments({
        author: req.user._id,
        targetType,
        targetId,
      }).session(session);

      if (existingCommentCount >= MAX_COMMENTS_PER_USER) {
        res.status(400);
        throw new Error("You can only leave up to 5 comments on this post");
      }

      const created = await Comment.create(
        [{ content, author: req.user._id, targetType, targetId }],
        { session }
      );
      comment = created[0];
    });

    await comment.populate("author", "name avatar role");
    await cacheInvalidate(commentsCacheKey(targetType, targetId));
    logSecurityEvent("comment_created", { actorId: req.user._id.toString(), targetType, targetId: targetId.toString() });
    res.status(201).json({ success: true, data: comment });
  } catch (err) {
    next(err);
  } finally {
    session.endSession();
  }
};

// @desc    Edit your own comment
// @route   PUT /api/v1/comments/:id
export const updateComment = async (req, res, next) => {
  try {
    const commentId = sanitizeObjectId(req.params.id, "Comment ID");
    const comment = await Comment.findById(commentId);
    if (!comment) {
      res.status(404);
      throw new Error("Comment not found");
    }
    if (comment.author.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("You can only edit your own comments");
    }

    const content = sanitizeText(req.body?.content, 1000);
    if (!content) {
      res.status(400);
      throw new Error("Comment content is required");
    }

    comment.content = content;
    comment.isEdited = true;
    await comment.save();
    await comment.populate("author", "name avatar role");

    await cacheInvalidate(commentsCacheKey(comment.targetType, comment.targetId));
    logSecurityEvent("comment_updated", { actorId: req.user._id.toString(), commentId: comment._id.toString() });
    res.json({ success: true, data: comment });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a comment — the comment's own author, or staff (moderation)
// @route   DELETE /api/v1/comments/:id
export const deleteComment = async (req, res, next) => {
  try {
    const commentId = sanitizeObjectId(req.params.id, "Comment ID");
    const comment = await Comment.findById(commentId);
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
    await cacheInvalidate(commentsCacheKey(comment.targetType, comment.targetId));
    logSecurityEvent("comment_deleted", { actorId: req.user._id.toString(), commentId: comment._id.toString(), isModerator: isStaff });
    res.json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};