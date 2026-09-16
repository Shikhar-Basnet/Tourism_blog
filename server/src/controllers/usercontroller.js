import User from "../models/User.js";
import { sanitizeText, sanitizeObjectId, logSecurityEvent } from "../utils/security.js";

const ALL_ROLES = ["user", "editor", "admin", "superadmin"];
const MAX_LIMIT = 100;

// @route   GET /api/v1/admin/users
export const getUsers = async (req, res, next) => {
  try {
    const { page = 1, role, search } = req.query;
    const safePage = Number(page) > 0 ? Number(page) : 1;
    const limit = Math.min(Number(req.query.limit) || 15, MAX_LIMIT);
    const query = {};
    if (role && ALL_ROLES.includes(role)) query.role = role;
    if (search) {
      const sanitizedSearch = sanitizeText(search, 80);
      if (sanitizedSearch) {
        query.$or = [
          { name: { $regex: sanitizedSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } },
          { email: { $regex: sanitizedSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } },
        ];
      }
    }

    const users = await User.find(query)
      .select("-refreshTokenHash -password")
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * limit)
      .limit(limit);
    const total = await User.countDocuments(query);

    res.json({ success: true, count: users.length, total, page: safePage, pages: Math.ceil(total / limit), data: users });
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
    const targetId = sanitizeObjectId(req.params.id, "User ID");
    const { role } = req.body;
    const safeRole = sanitizeText(role, 32);
    if (!ALL_ROLES.includes(safeRole)) { res.status(400); throw new Error("Invalid role"); }
    if (targetId === req.user._id.toString()) { res.status(400); throw new Error("You can't change your own role"); }

    const target = await User.findById(targetId);
    if (!target) { res.status(404); throw new Error("User not found"); }

    if (req.user.role === "admin") {
      if (target.role === "superadmin") {
        res.status(403);
        throw new Error("Admins can't change a superadmin's role");
      }
      if (safeRole === "superadmin") {
        res.status(403);
        throw new Error("Admins can only assign roles up to 'admin'");
      }
    }

    target.role = safeRole;
    await target.save();
    logSecurityEvent("role_changed", { actorId: req.user._id.toString(), targetId: target._id.toString(), role: safeRole });

    const safeUser = await User.findById(target._id).select("-refreshTokenHash -password");
    res.json({ success: true, data: safeUser });
  } catch (err) {
    next(err);
  }
};

// @route   PATCH /api/v1/admin/users/:id/status
export const toggleUserActive = async (req, res, next) => {
  try {
    const targetId = sanitizeObjectId(req.params.id, "User ID");
    if (targetId === req.user._id.toString()) { res.status(400); throw new Error("You can't deactivate your own account"); }

    const user = await User.findById(targetId);
    if (!user) { res.status(404); throw new Error("User not found"); }

    if (req.user.role === "admin" && user.role === "superadmin") {
      res.status(403);
      throw new Error("Admins can't deactivate a superadmin's account");
    }

    user.isActive = !user.isActive;
    await user.save();
    logSecurityEvent("account_status_changed", { actorId: req.user._id.toString(), targetId: user._id.toString(), isActive: user.isActive });

    res.json({ success: true, data: { id: user._id, isActive: user.isActive } });
  } catch (err) {
    next(err);
  }
};