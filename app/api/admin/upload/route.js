// app/api/admin/upload/route.js
// Admin-only image upload endpoint.

import { withAdminAuth } from "@/lib/middleware/withAdminAuth";
import { uploadImage } from "@/lib/server/cloudinary";
import { jsonOk, jsonError, handleApiError } from "@/lib/server/api";
import { MAX_PRODUCT_IMAGES } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withAdminAuth(async (req) => {
  try {
    const formData = await req.formData();
    const files = [...formData.getAll("files"), ...formData.getAll("file")].filter(
      (file) => file && typeof file !== "string"
    );

    if (!files.length) {
      return jsonError("Please choose at least one image", 400);
    }

    if (files.length > MAX_PRODUCT_IMAGES) {
      return jsonError(`You can upload up to ${MAX_PRODUCT_IMAGES} images at a time`, 400);
    }

    const images = [];
    for (const file of files) {
      const uploaded = await uploadImage(file, "octagonetoys/products");
      images.push({
        url: uploaded.url,
        publicId: uploaded.publicId || "",
        alt: "",
      });
    }

    return jsonOk({ images }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "POST /api/admin/upload");
  }
});
