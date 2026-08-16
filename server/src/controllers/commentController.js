import mongoose from "mongoose";
import Comment from "../models/Comment.js";
import { cacheGetOrSet, cacheInvalidate } from "../config/cache.js";

const VALID_TARGETS = ["Blog", "Destination"];
const STAFF_ROLES = ["editor", "admin", "superadmin"];
const MAX_COMMENTS_PER_USER = 5;

const commentsCacheKey = (targetType, targetId) => `comments:${targetType}:${targetId}`;

// @desc    List comments for a blog or destination
// @route   GET /api/v1/comments?targetType=Blog&targetId=<id>
export const getComments = async (req, res, next) => {
  try {
    const { targetType, targetId } = req.query;

    if (!VALID_TARGETS.includes(targetType) || !targetId) {
      res.status(400);
      throw new Error("targetType (Blog|Destination) and targetId are required");
    }

    // Short TTL (20s) — comments are the most write-heavy content on the
    // site, so this isn't about long-term freshness, it's about absorbing
    // bursts of repeat views on a popular post between writes. Every write
    // (create/update/delete) invalidates this key immediately below, so a
    // visitor never sees a stale view of their own comment.
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
    const { targetType, targetId, content } = req.body;

    if (!VALID_TARGETS.includes(targetType) || !targetId) {
      res.status(400);
      throw new Error("targetType (Blog|Destination) and targetId are required");
    }
    if (!content?.trim()) {
      res.status(400);
      throw new Error("Comment content is required");
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
        [{ content: content.trim(), author: req.user._id, targetType, targetId }],
        { session }
      );
      comment = created[0];
    });

    await comment.populate("author", "name avatar role");
    await cacheInvalidate(commentsCacheKey(targetType, targetId));
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

    await cacheInvalidate(commentsCacheKey(comment.targetType, comment.targetId));
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
    await cacheInvalidate(commentsCacheKey(comment.targetType, comment.targetId));
    res.json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};