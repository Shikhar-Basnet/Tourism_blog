import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

const REQUIRED_ENV = ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"];

export const assertCloudinaryConfigured = () => {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
  if (missing.length) {
    console.error(
      `\n❌ Missing Cloudinary credentials in .env: ${missing.join(", ")}\n` +
      `   Sign up free at https://cloudinary.com (no card required), then copy\n` +
      `   your Cloud Name / API Key / API Secret from the dashboard into .env.\n` +
      `   Image uploads will fail until this is set.\n`
    );
  } else {
    console.log("Cloudinary configured");
  }
};

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "nepal-tourism",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 2000, height: 2000, crop: "limit" }],
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  cb(allowed.includes(file.mimetype) ? null : new Error("Only image files (jpg, png, webp) are allowed"), allowed.includes(file.mimetype));
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

export const deleteCloudinaryImage = async (url) => {
  if (!url || !url.includes("res.cloudinary.com")) return;
  try {
    const publicId = url.split("/upload/")[1]?.split(".")[0]?.replace(/^v\d+\//, "");
    if (publicId) await cloudinary.uploader.destroy(publicId);
  } catch {
    // Non-fatal — a stray orphaned image isn't worth failing the request over
  }
};

export default cloudinary;