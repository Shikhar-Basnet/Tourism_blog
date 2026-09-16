import crypto from "node:crypto";

const isSafeMethod = (method = "") => ["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase());

const isAuthEndpoint = (path = "") => /^(?:\/api\/v1\/auth\/(?:admin\/login|refresh|logout|csrf-token|google|facebook|me))$/.test(path);

const compareCsrfTokens = (tokenA, tokenB) => {
  const left = typeof tokenA === "string" ? tokenA.trim() : "";
  const right = typeof tokenB === "string" ? tokenB.trim() : "";

  if (!left || !right || left.length !== right.length) {
    return false;
  }

  const expected = Buffer.from(left, "utf8");
  const actual = Buffer.from(right, "utf8");

  return crypto.timingSafeEqual(expected, actual);
};

export const csrfProtection = (req, res, next) => {
  if (isSafeMethod(req.method) || isAuthEndpoint(req.path)) {
    return next();
  }

  const headerToken = typeof req.headers["x-csrf-token"] === "string"
    ? req.headers["x-csrf-token"]
    : "";
  const bodyToken = typeof req.body?._csrf === "string" ? req.body._csrf : "";
  const cookieToken = typeof req.cookies?.csrfToken === "string" ? req.cookies.csrfToken : "";

  if (!cookieToken || (!headerToken && !bodyToken)) {
    res.status(403);
    return next(new Error("CSRF token missing or invalid"));
  }

  const candidate = headerToken || bodyToken;

  if (!compareCsrfTokens(cookieToken, candidate)) {
    res.status(403);
    return next(new Error("CSRF token missing or invalid"));
  }

  next();
};
