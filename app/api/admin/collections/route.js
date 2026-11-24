// app/api/admin/collections/route.js

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
  escapeRegex,
  parsePagination,
  buildPagination,
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

export const GET = withAdminAuth(async (req) => {
  try {
    await connect();
    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = parsePagination(searchParams, { defaultLimit: 50 });

    const query = { isDeleted: false };
    const search = searchParams.get("search")?.trim();
    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      query.$or = [{ name: regex }, { slug: regex }];
    }

    const [collections, total] = await Promise.all([
      Collection.find(query).sort({ position: 1, createdAt: -1 }).skip(skip).limit(limit).lean(),
      Collection.countDocuments(query),
    ]);

    const counts = await Product.aggregate([
      {
        $match: {
          isDeleted: false,
          isActive: true,
          collectionIds: { $in: collections.map((collection) => collection._id) },
        },
      },
      { $unwind: "$collectionIds" },
      { $group: { _id: "$collectionIds", count: { $sum: 1 } } },
    ]);
    const countMap = new Map(counts.map((item) => [String(item._id), item.count]));

    const enriched = collections.map((collection) => ({
      ...collection,
      productCount: countMap.get(String(collection._id)) || 0,
    }));

    return jsonOk({ collections: enriched, pagination: buildPagination(total, page, limit) });
  } catch (error) {
    return handleApiError(error, "GET /api/admin/collections");
  }
});

export const POST = withAdminAuth(async (req) => {
  try {
    await connect();
    const body = await req.json().catch(() => null);
    if (!body) return jsonError("Invalid request body", 400);

    if (!body.name || !String(body.name).trim()) {
      return jsonError("Collection name is required", 400);
    }

    const slug = slugify(body.slug || body.name);
    if (!slug) return jsonError("Could not generate a valid slug", 400);

    const products = normalizeProducts(body.products);

    const collection = await Collection.create({
      name: String(body.name).trim(),
      slug,
      description: String(body.description || "").trim(),
      image: String(body.image || "").trim(),
      products,
      isActive: body.isActive !== false,
      isFeatured: body.isFeatured === true,
      position: toInt(body.position, 0),
      metaTitle: String(body.metaTitle || "").trim(),
      metaDescription: String(body.metaDescription || "").trim(),
    });

    if (products.length) {
      await syncCollectionProducts(collection._id.toString(), products.map((item) => String(item.productId)));
    }

    return jsonOk({ collection }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "POST /api/admin/collections");
  }
});
