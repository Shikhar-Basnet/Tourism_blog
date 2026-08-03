import User from "../models/User.js";
import Destination from "../models/Destination.js";
import Blog from "../models/Blog.js";
import Comment from "../models/Comment.js";

export const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalDestinations, featuredDestinations, totalUsers, usersByRoleRaw,
      recentDestinations, totalBlogs, destLikesAgg, blogLikesAgg,
      totalComments, recentComments,
    ] = await Promise.all([
      Destination.countDocuments(),
      Destination.countDocuments({ featured: true }),
      User.countDocuments(),
      User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
      Destination.find().sort({ createdAt: -1 }).limit(5).select("title province createdAt"),
      Blog.countDocuments(),
      Destination.aggregate([
        { $project: { count: { $size: "$likedBy" } } },
        { $group: { _id: null, total: { $sum: "$count" } } },
      ]),
      Blog.aggregate([
        { $project: { count: { $size: "$likedBy" } } },
        { $group: { _id: null, total: { $sum: "$count" } } },
      ]),
      Comment.countDocuments(),
      Comment.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("author", "name avatar role")
        .populate("targetId", "title"), // resolves via refPath (Blog or Destination)
    ]);

    const usersByRole = { user: 0, editor: 0, admin: 0, superadmin: 0 };
    usersByRoleRaw.forEach(({ _id, count }) => { if (_id in usersByRole) usersByRole[_id] = count; });

    res.json({
      success: true,
      data: {
        totalDestinations, featuredDestinations, totalUsers, totalBlogs,
        usersByRole, recentDestinations, recentComments,
        totalLikes: (destLikesAgg[0]?.total || 0) + (blogLikesAgg[0]?.total || 0),
        totalComments,
      },
    });
  } catch (err) {
    next(err);
  }
};