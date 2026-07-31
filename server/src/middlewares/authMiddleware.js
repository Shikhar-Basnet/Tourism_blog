import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Verifies the access token cookie and attaches req.user.
// Any route behind this must have a logged-in user, regardless of role.
export const protect = async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken;

    if (!token) {
      res.status(401);
      throw new Error("Not authenticated - no access token");
    }

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      res.status(401);
      throw new Error("Not authenticated - user not found or deactivated");
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401);
    next(new Error("Not authenticated - invalid or expired token"));
  }
};

// Role gate — usage: router.post('/', protect, authorize('admin', 'superadmin'), handler)
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403);
      return next(new Error(`Role '${req.user?.role}' is not permitted to perform this action`));
    }
    next();
  };
};

// Doesn't block the request if there's no token — just attaches req.user when present.
// Useful for routes like "leave a comment" where guests can read but logged-in users get extras.
export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken;
    if (!token) return next();

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await User.findById(decoded.id);
    if (user && user.isActive) req.user = user;
  } catch (err) {
    // invalid/expired token on an optional route — just proceed as guest
  }
  next();
};