import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ensureCloudinaryConfigured = () => {
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    throw new Error(
      "Cloudinary environment variables are not fully configured."
    );
  }
};

const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Unsupported file format. Please upload JPG, PNG, WEBP, or GIF."
        )
      );
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

router.post("/hotels", upload.single("image"), async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ message: "No image uploaded." });
  }

  try {
    ensureCloudinaryConfigured();

    const encodedFile = `data:${
      req.file.mimetype
    };base64,${req.file.buffer.toString("base64")}`;

    const result = await cloudinary.uploader.upload(encodedFile, {
      folder: "stayvista/hotels",
      resource_type: "image",
    });

    return res.status(201).json({
      url: result.secure_url,
      public_id: result.public_id,
      resource_type: result.resource_type,
      bytes: result.bytes,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/rooms", upload.single("image"), async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ message: "No image uploaded." });
  }

  try {
    ensureCloudinaryConfigured();

    const encodedFile = `data:${
      req.file.mimetype
    };base64,${req.file.buffer.toString("base64")}`;

    const result = await cloudinary.uploader.upload(encodedFile, {
      folder: "stayvista/rooms",
      resource_type: "image",
    });

    return res.status(201).json({
      url: result.secure_url,
      public_id: result.public_id,
      resource_type: result.resource_type,
      bytes: result.bytes,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
