// app/api/admin/products/[id]/route.js

import mongoose from "mongoose";
import { connect } from "@/lib/mongoose";
import Product from "@/lib/models/Product";
import Collection from "@/lib/models/Collection";
import { withAdminAuth } from "@/lib/middleware/withAdminAuth";
import {
  jsonOk,
  jsonError,
  handleApiError,
  slugify,
  isValidObjectId,
  toInt,
} from "@/lib/server/api";
import { syncProductCollections } from "@/lib/server/collections";

export const dynamic = "force-dynamic";

function normalizeImages(images) {
  if (!Array.isArray(images)) return [];
  return images
    .filter((image) => image && (typeof image === "string" || image.url))
    .map((image) => {
      if (typeof image === "string") return { url: image.trim(), alt: "", publicId: "" };
      return {
        url: String(image.url || "").trim(),
        alt: String(image.alt || "").trim(),
        publicId: String(image.publicId || "").trim(),
      };
    })
    .filter((image) => image.url);
}

async function resolveId(context) {
  const { id } = await context.params;
  return isValidObjectId(id) ? id : null;
}

export const GET = withAdminAuth(async (req, context) => {
  try {
    await connect();
    const id = await resolveId(context);
    if (!id) return jsonError("Invalid product ID", 400);

    const product = await Product.findOne({ _id: id, isDeleted: false })
      .populate("collectionIds", "name slug")
      .lean();

    if (!product) return jsonError("Product not found", 404);
    return jsonOk({ product });
  } catch (error) {
    return handleApiError(error, "GET /api/admin/products/[id]");
  }
});

export const PUT = withAdminAuth(async (req, context) => {
  try {
    await connect();
    const id = await resolveId(context);
    if (!id) return jsonError("Invalid product ID", 400);

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return jsonError("Invalid update payload", 400);

    const updates = {};

    if (body.name !== undefined) {
      if (!String(body.name).trim()) return jsonError("Product name cannot be empty", 400);
      updates.name = String(body.name).trim();
    }
    if (body.slug !== undefined) {
      const slug = slugify(body.slug);
      if (!slug) return jsonError("Invalid slug", 400);
      updates.slug = slug;
    }
    if (body.sku !== undefined) updates.sku = body.sku ? String(body.sku).trim() : undefined;
    if (body.shortDescription !== undefined) updates.shortDescription = String(body.shortDescription || "").trim();
    if (body.description !== undefined) updates.description = String(body.description || "").trim();
    if (body.price !== undefined) {
      const price = toInt(body.price, NaN);
      if (!Number.isFinite(price) || price < 0) return jsonError("Price must be a valid amount", 400);
      updates.price = price;
    }
    if (body.salePrice !== undefined) {
      if (body.salePrice === null || body.salePrice === "") {
        updates.salePrice = null;
      } else {
        const salePrice = toInt(body.salePrice, NaN);
        if (!Number.isFinite(salePrice) || salePrice < 0) {
          return jsonError("Sale price must be a valid amount", 400);
        }
        updates.salePrice = salePrice;
      }
    }
    if (body.saleStart !== undefined) updates.saleStart = body.saleStart ? new Date(body.saleStart) : null;
    if (body.saleEnd !== undefined) updates.saleEnd = body.saleEnd ? new Date(body.saleEnd) : null;
    if (body.images !== undefined) updates.images = normalizeImages(body.images);
    if (body.stock !== undefined) updates.stock = Math.max(0, toInt(body.stock, 0));
    if (body.lowStockThreshold !== undefined) {
      updates.lowStockThreshold = Math.max(0, toInt(body.lowStockThreshold, 5));
    }
    if (body.isActive !== undefined) updates.isActive = Boolean(body.isActive);
    if (body.isFeatured !== undefined) updates.isFeatured = Boolean(body.isFeatured);
    if (body.collectionIds !== undefined) {
      updates.collectionIds = Array.isArray(body.collectionIds)
        ? body.collectionIds.filter((cid) => mongoose.Types.ObjectId.isValid(cid))
        : [];
    }
    if (body.tags !== undefined) {
      updates.tags = Array.isArray(body.tags)
        ? body.tags.map(String).map((tag) => tag.trim()).filter(Boolean)
        : [];
    }
    if (body.position !== undefined) updates.position = toInt(body.position, 0);
    if (body.metaTitle !== undefined) updates.metaTitle = String(body.metaTitle || "").trim();
    if (body.metaDescription !== undefined) updates.metaDescription = String(body.metaDescription || "").trim();
    if (body.metaKeywords !== undefined) {
      updates.metaKeywords = Array.isArray(body.metaKeywords) ? body.metaKeywords.map(String) : [];
    }

    if (!Object.keys(updates).length) return jsonError("No updatable fields provided", 400);

    const product = await Product.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate("collectionIds", "name slug")
      .lean();

    if (!product) return jsonError("Product not found", 404);

    if (updates.collectionIds !== undefined) {
      await syncProductCollections(id, updates.collectionIds);
    }

    return jsonOk({ product });
  } catch (error) {
    return handleApiError(error, "PUT /api/admin/products/[id]");
  }
});

export const PATCH = PUT;

export const DELETE = withAdminAuth(async (req, context) => {
  try {
    await connect();
    const id = await resolveId(context);
    if (!id) return jsonError("Invalid product ID", 400);

    const product = await Product.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: { isDeleted: true, isActive: false } },
      { new: true }
    );

    if (!product) return jsonError("Product not found", 404);

    await Collection.updateMany(
      { "products.productId": product._id },
      { $pull: { products: { productId: product._id } } }
    );

    return jsonOk({ message: "Product deleted" });
  } catch (error) {
    return handleApiError(error, "DELETE /api/admin/products/[id]");
  }
});
