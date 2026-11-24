// lib/server/cloudinary.js
// Image upload service. Uses Cloudinary when credentials exist, and falls back
// to local /public/uploads storage during development.

import crypto from "crypto";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import { MAX_IMAGE_SIZE_BYTES } from "@/lib/constants";
import { ALLOWED_IMAGE_TYPES, detectImageType, extensionForType } from "@/lib/server/imageValidation";

function uploadError(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

function cloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

function safeExtension(mimeType) {
  return extensionForType(mimeType) || "jpg";
}

async function uploadToCloudinary(buffer, file, folder) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const timestamp = Math.floor(Date.now() / 1000);

  const params = { folder, timestamp };
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  const signature = crypto.createHash("sha1").update(`${toSign}${apiSecret}`).digest("hex");

  const form = new FormData();
  form.append("file", new Blob([buffer], { type: file.type || "image/jpeg" }), file.name || "image.jpg");
  form.append("api_key", apiKey);
  form.append("timestamp", String(timestamp));
  form.append("folder", folder);
  form.append("signature", signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: form }
  );
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error?.message || "Cloudinary upload failed");
  }

  return {
    url: data.secure_url,
    publicId: data.public_id,
    width: data.width,
    height: data.height,
    provider: "cloudinary",
  };
}

async function saveLocally(buffer, mimeType) {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Image uploads need Cloudinary in production. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET."
    );
  }

  const extension = safeExtension(mimeType);
  const filename = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${extension}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), buffer);

  return {
    url: `/uploads/${filename}`,
    publicId: "",
    provider: "local",
  };
}

export async function uploadImage(file, folder = "octagonetoys/products") {
  if (!file || typeof file === "string") {
    throw uploadError("No image file was provided");
  }

  if (!Object.prototype.hasOwnProperty.call(ALLOWED_IMAGE_TYPES, String(file.type || ""))) {
    throw uploadError("Unsupported image type. Please upload a JPG, PNG, WebP or AVIF file.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.length > MAX_IMAGE_SIZE_BYTES) {
    throw uploadError("Image is too large. Maximum size is 5 MB.");
  }
  if (buffer.length === 0) {
    throw uploadError("The uploaded image is empty");
  }

  // Trust the bytes, not the browser-provided MIME type.
  const detectedType = detectImageType(buffer);
  if (!detectedType) {
    throw uploadError(
      "That file is not a valid image. Please upload a JPG, PNG, WebP or AVIF file."
    );
  }

  const upload = {
    name: file.name || `image.${extensionForType(detectedType)}`,
    type: detectedType,
  };

  if (cloudinaryConfigured()) {
    return uploadToCloudinary(buffer, upload, folder);
  }
  return saveLocally(buffer, detectedType);
}

export async function deleteImage({ publicId, url } = {}) {
  try {
    if (publicId && cloudinaryConfigured()) {
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
      const apiKey = process.env.CLOUDINARY_API_KEY;
      const apiSecret = process.env.CLOUDINARY_API_SECRET;
      const timestamp = Math.floor(Date.now() / 1000);
      const toSign = `public_id=${publicId}&timestamp=${timestamp}`;
      const signature = crypto.createHash("sha1").update(`${toSign}${apiSecret}`).digest("hex");

      const form = new FormData();
      form.append("public_id", publicId);
      form.append("api_key", apiKey);
      form.append("timestamp", String(timestamp));
      form.append("signature", signature);

      await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
        method: "POST",
        body: form,
      });
      return true;
    }

    if (url && url.startsWith("/uploads/")) {
      const relative = url.replace(/^\/+/, "");
      const filePath = path.join(process.cwd(), "public", relative);
      await unlink(filePath);
      return true;
    }
  } catch (error) {
    console.error("[upload] delete failed:", error.message);
  }
  return false;
}
