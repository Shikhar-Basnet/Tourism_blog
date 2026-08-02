import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import {
  generateAccessToken,
  generateRefreshToken,
  setAuthCookies,
  clearAuthCookies,
} from "../utils/generateTokens.js";

// Shared by both OAuth callbacks: issue tokens, store hashed refresh token,
// then return the visitor to the page they were trying to reach.
const issueTokensAndRedirect = async (req, res) => {
  const user = req.user;
  const redirectTarget = req.query?.state || "/";

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
  await user.save();

  setAuthCookies(res, accessToken, refreshToken);

  const safeRedirect = redirectTarget.startsWith("/") ? redirectTarget : "/";
  res.redirect(`${process.env.CLIENT_URL}${safeRedirect}`);
};

// @route   GET /api/v1/auth/google/callback
export const googleCallback = (req, res, next) =>
  issueTokensAndRedirect(req, res).catch(next);

// @route   GET /api/v1/auth/facebook/callback
export const facebookCallback = (req, res, next) =>
  issueTokensAndRedirect(req, res).catch(next);

// @desc    Email/password login — admins only, per spec (no normal registration)
// @route   POST /api/v1/auth/admin/login
export const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error("Email and password are required");
    }

    const user = await User.findOne({ email, provider: "local" }).select("+password");

    if (!user || !(await user.comparePassword(password))) {
      res.status(401);
      throw new Error("Invalid credentials");
    }

    if (!["admin", "superadmin", "editor"].includes(user.role)) {
      res.status(403);
      throw new Error("This login is reserved for staff accounts");
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await user.save();

    setAuthCookies(res, accessToken, refreshToken);

    res.json({
      success: true,
      data: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Issue a new access token using the refresh token cookie
// @route   POST /api/v1/auth/refresh
export const refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      res.status(401);
      throw new Error("No refresh token provided");
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id).select("+refreshTokenHash");

    if (!user || !user.refreshTokenHash) {
      res.status(401);
      throw new Error("Refresh token no longer valid");
    }

    const matches = await bcrypt.compare(token, user.refreshTokenHash);
    if (!matches) {
      res.status(401);
      throw new Error("Refresh token no longer valid");
    }

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // Rotate refresh token on every use — limits damage if one is ever stolen.
    user.refreshTokenHash = await bcrypt.hash(newRefreshToken, 10);
    await user.save();

    setAuthCookies(res, newAccessToken, newRefreshToken);
    res.json({ success: true, message: "Token refreshed" });
  } catch (err) {
    res.status(401);
    next(new Error("Not authenticated - could not refresh session"));
  }
};

// @route   POST /api/v1/auth/logout
export const logout = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        await User.findByIdAndUpdate(decoded.id, { $unset: { refreshTokenHash: 1 } });
      } catch {
        // token already invalid/expired — nothing to revoke, just clear cookies
      }
    }
    clearAuthCookies(res);
    res.json({ success: true, message: "Logged out" });
  } catch (err) {
    next(err);
  }
};

// @desc    Return currently logged-in user
// @route   GET /api/v1/auth/me
export const getMe = async (req, res) => {
  res.json({
    success: true,
    data: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      avatar: req.user.avatar,
      role: req.user.role,
      provider: req.user.provider,
    },
  });
};