import mongoose from "mongoose";

export const sanitizeText = (value, maxLength = 2000) => {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, maxLength);
};

export const escapeRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const normalizeEmail = (value) => sanitizeText(value || "", 254).toLowerCase();

export const ensurePositiveInt = (value, fallback, max = 1000) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > max) {
    return fallback;
  }
  return parsed;
};

export const sanitizeObjectId = (value, label = "ID") => {
  if (!mongoose.isValidObjectId(value)) {
    throw new Error(`${label} is invalid`);
  }
  return value;
};

export const logSecurityEvent = (event, details = {}) => {
  const payload = { timestamp: new Date().toISOString(), event, ...details };
  console.warn(`[SECURITY] ${JSON.stringify(payload)}`);
};
