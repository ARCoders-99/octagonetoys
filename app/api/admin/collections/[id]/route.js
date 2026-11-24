// app/api/admin/collections/[id]/route.js

import mongoose from "mongoose";
import { connect } from "@/lib/mongoose";
import Collection from "@/lib/models/Collection";
import Product from "@/lib/models/Product";
import { withAdminAuth } from "@/lib/middleware/withAdminAuth";
import {
  jsonOk,
  jsonError,
  handleApiError,
  slugify,
  isValidObjectId,
  toInt,
} from "@/lib/server/api";
import { syncCollectionProducts } from "@/lib/server/collections";

export const dynamic = "force-dynamic";

function normalizeProducts(products) {
  if (!Array.isArray(products)) return [];
  const seen = new Set();
  return products
    .filter((item) => item && mongoose.Types.ObjectId.isValid(item.productId || item._id))
    .map((item, index) => ({
      productId: new mongoose.Types.ObjectId(item.productId || item._id),
      position: item.position !== undefined ? toInt(item.position, index) : index,
    }))
    .filter((item) => {
      const key = String(item.productId);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

async function resolveId(context) {
  const { id } = await context.params;
  return isValidObjectId(id) ? id : null;
}

export const GET = withAdminAuth(async (req, context) => {
  try {
    await connect();
    const id = await resolveId(context);
    if (!id) return jsonError("Invalid collection ID", 400);

    const collection = await Collection.findOne({ _id: id, isDeleted: false })
      .populate("products.productId", "name slug price stock images isActive")
      .lean();

    if (!collection) return jsonError("Collection not found", 404);

    const assignedProducts = await Product.find({
      collectionIds: new mongoose.Types.ObjectId(id),
      isDeleted: false,
    })
      .select("name slug price stock images isActive")
      .lean();

    return jsonOk({ collection, assignedProducts });
  } catch (error) {
    return handleApiError(error, "GET /api/admin/collections/[id]");
  }
});

export const PUT = withAdminAuth(async (req, context) => {
  try {
    await connect();
    const id = await resolveId(context);
    if (!id) return jsonError("Invalid collection ID", 400);

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return jsonError("Invalid update payload", 400);

    const updates = {};

    if (body.name !== undefined) {
      if (!String(body.name).trim()) return jsonError("Collection name cannot be empty", 400);
      updates.name = String(body.name).trim();
    }
    if (body.slug !== undefined) {
      const slug = slugify(body.slug);
      if (!slug) return jsonError("Invalid slug", 400);
      updates.slug = slug;
    }
    if (body.description !== undefined) updates.description = String(body.description || "").trim();
    if (body.image !== undefined) updates.image = String(body.image || "").trim();
    if (body.isActive !== undefined) updates.isActive = Boolean(body.isActive);
    if (body.isFeatured !== undefined) updates.isFeatured = Boolean(body.isFeatured);
    if (body.position !== undefined) updates.position = toInt(body.position, 0);
    if (body.metaTitle !== undefined) updates.metaTitle = String(body.metaTitle || "").trim();
    if (body.metaDescription !== undefined) updates.metaDescription = String(body.metaDescription || "").trim();

    let productIds = null;
    if (body.products !== undefined) {
      const products = normalizeProducts(body.products);
      updates.products = products;
      productIds = products.map((item) => String(item.productId));
    }

    if (!Object.keys(updates).length) return jsonError("No updatable fields provided", 400);

    const collection = await Collection.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: updates },
      { new: true, runValidators: true }
    ).lean();

    if (!collection) return jsonError("Collection not found", 404);

    if (productIds) {
      await syncCollectionProducts(id, productIds);
    }

    return jsonOk({ collection });
  } catch (error) {
    return handleApiError(error, "PUT /api/admin/collections/[id]");
  }
});

export const PATCH = PUT;

export const DELETE = withAdminAuth(async (req, context) => {
  try {
    await connect();
    const id = await resolveId(context);
    if (!id) return jsonError("Invalid collection ID", 400);

    const collection = await Collection.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: { isDeleted: true, isActive: false } },
      { new: true }
    );

    if (!collection) return jsonError("Collection not found", 404);

    await Product.updateMany(
      { collectionIds: collection._id },
      { $pull: { collectionIds: collection._id } }
    );

    return jsonOk({ message: "Collection deleted" });
  } catch (error) {
    return handleApiError(error, "DELETE /api/admin/collections/[id]");
  }
});
