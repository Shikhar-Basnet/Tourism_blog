import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Verifies the access token cookie and attaches req.user.
// Any route behind this must have a logged-in user, regardless of role.
export const protect = async (req, res, next) => {
  // Authenticated responses must never be cached by the browser/any
  // intermediate cache — otherwise a signed-out user (or a shared/public
  // computer) could potentially be served a stale cached response for
  // protected data instead of a fresh 401.
  res.set("Cache-Control", "no-store");

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

// Restricts an action to plain visitor accounts (role: "user") — e.g. liking
// or commenting. Staff (editor/admin/superadmin) are deliberately excluded:
// those actions represent a visitor's personal opinion/engagement, and a
// staff member liking/commenting on their own site's content isn't a
// meaningful signal — plus it would let a staff account inflate its own posts.
export const onlyPublicUsers = (req, res, next) => {
  if (!req.user || req.user.role !== "user") {
    res.status(403);
    return next(new Error("Only visitor accounts can perform this action"));
  }
  next();
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