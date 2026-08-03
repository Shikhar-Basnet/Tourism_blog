import User from "../models/User.js";

const ALL_ROLES = ["user", "editor", "admin", "superadmin"];

// @route   GET /api/v1/admin/users
export const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 15, role, search } = req.query;
    const query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query)
      .select("-refreshTokenHash -password")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await User.countDocuments(query);

    res.json({ success: true, count: users.length, total, page: Number(page), pages: Math.ceil(total / limit), data: users });
  } catch (err) {
    next(err);
  }
};

// Role escalation is the most sensitive action in the whole admin panel —
// restricted to superadmin only, and you can never touch your own account
// (prevents accidentally locking yourself out of superadmin).
// @route   PATCH /api/v1/admin/users/:id/role
export const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!ALL_ROLES.includes(role)) { res.status(400); throw new Error("Invalid role"); }
    if (req.params.id === req.user._id.toString()) { res.status(400); throw new Error("You can't change your own role"); }

    const target = await User.findById(req.params.id);
    if (!target) { res.status(404); throw new Error("User not found"); }

    if (req.user.role === "admin") {
      if (target.role === "superadmin") {
        res.status(403);
        throw new Error("Admins can't change a superadmin's role");
      }
      if (role === "superadmin") {
        res.status(403);
        throw new Error("Admins can only assign roles up to 'admin'");
      }
    }

    target.role = role;
    await target.save();

    const safeUser = await User.findById(target._id).select("-refreshTokenHash -password");
    res.json({ success: true, data: safeUser });
  } catch (err) {
    next(err);
  }
};

// @route   PATCH /api/v1/admin/users/:id/status
export const toggleUserActive = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) { res.status(400); throw new Error("You can't deactivate your own account"); }

    const user = await User.findById(req.params.id);
    if (!user) { res.status(404); throw new Error("User not found"); }

    if (req.user.role === "admin" && user.role === "superadmin") {
      res.status(403);
      throw new Error("Admins can't deactivate a superadmin's account");
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({ success: true, data: { id: user._id, isActive: user.isActive } });
  } catch (err) {
    next(err);
  }
};