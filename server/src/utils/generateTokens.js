import jwt from "jsonwebtoken";
import crypto from "node:crypto";

export const generateAccessToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || "15m",
  });

export const generateRefreshToken = (user) =>
  jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES || "30d",
  });

export const generateCsrfToken = () => crypto.randomBytes(32).toString("hex");

// HTTP-only cookies — inaccessible to JS, mitigates XSS token theft.
// sameSite: "lax" is enough for same-site OAuth redirect flow; switch to "none" + secure
// if client and server ever live on fully different top-level domains.
export const setAuthCookies = (res, accessToken, refreshToken) => {
  const isProd = process.env.NODE_ENV === "production";
  const csrfToken = generateCsrfToken();

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    maxAge: 15 * 60 * 1000, // 15 min
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/api/v1/auth", // only sent to auth routes (refresh/logout), reduces exposure
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  res.cookie("csrfToken", csrfToken, {
    httpOnly: false,
    secure: isProd,
    sameSite: "lax",
    maxAge: 15 * 60 * 1000,
  });
};

export const clearAuthCookies = (res) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken", { path: "/api/v1/auth" });
  res.clearCookie("csrfToken");
};