import User from "../models/User.js";
import Destination from "../models/Destination.js";

// @desc    Aggregate counts for the admin dashboard overview cards
// @route   GET /api/v1/admin/stats
export const getDashboardStats = async (req, res, next) => {
  try {
    const [totalDestinations, featuredDestinations, totalUsers, usersByRoleRaw, recentDestinations] =
      await Promise.all([
        Destination.countDocuments(),
        Destination.countDocuments({ featured: true }),
        User.countDocuments(),
        User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
        Destination.find().sort({ createdAt: -1 }).limit(5).select("title province createdAt"),
      ]);

    const usersByRole = { user: 0, editor: 0, admin: 0, superadmin: 0 };
    usersByRoleRaw.forEach(({ _id, count }) => {
      if (_id in usersByRole) usersByRole[_id] = count;
    });

    res.json({
      success: true,
      data: {
        totalDestinations,
        featuredDestinations,
        totalUsers,
        usersByRole,
        recentDestinations,
      },
    });
  } catch (err) {
    next(err);
  }
};