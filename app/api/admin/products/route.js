// app/api/admin/products/route.js
// Admin products: list with filters + create.

import mongoose from "mongoose";
import { connect } from "@/lib/mongoose";
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

export const GET = withAdminAuth(async (req) => {
  try {
    await connect();
    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = parsePagination(searchParams, { defaultLimit: 20 });

    const query = { isDeleted: false };
    const search = searchParams.get("search")?.trim();
    const collectionId = searchParams.get("collectionId")?.trim();
    const isFeatured = searchParams.get("isFeatured");
    const isActive = searchParams.get("isActive");
    const lowStock = searchParams.get("lowStock");
    const sort = searchParams.get("sort") || "newest";

    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      query.$or = [{ name: regex }, { sku: regex }, { slug: regex }, { tags: regex }];
    }

    if (collectionId && mongoose.Types.ObjectId.isValid(collectionId)) {
      query.collectionIds = new mongoose.Types.ObjectId(collectionId);
    }
    if (isFeatured === "true" || isFeatured === "false") {
      query.isFeatured = isFeatured === "true";
    }
    if (isActive === "true" || isActive === "false") {
      query.isActive = isActive === "true";
    }
    if (lowStock === "true") {
      query.$expr = { $lte: ["$stock", "$lowStockThreshold"] };
    }

    const sortMap = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      name: { name: 1 },
      price_asc: { price: 1 },
      price_desc: { price: -1 },
      stock_asc: { stock: 1 },
      stock_desc: { stock: -1 },
      position: { position: 1, createdAt: -1 },
    };

    const [products, total] = await Promise.all([
      Product.find(query)
        .sort(sortMap[sort] || sortMap.newest)
        .skip(skip)
        .limit(limit)
        .populate("collectionIds", "name slug")
        .lean(),
      Product.countDocuments(query),
    ]);

    return jsonOk({ products, pagination: buildPagination(total, page, limit) });
  } catch (error) {
    return handleApiError(error, "GET /api/admin/products");
  }
});

export const POST = withAdminAuth(async (req) => {
  try {
    await connect();
    const body = await req.json().catch(() => null);
    if (!body) return jsonError("Invalid request body", 400);

    if (!body.name || !String(body.name).trim()) {
      return jsonError("Product name is required", 400);
    }

    const price = toInt(body.price, NaN);
    if (!Number.isFinite(price) || price < 0) {
      return jsonError("Price must be a valid amount in paisa", 400);
    }

    const slug = slugify(body.slug || body.name);
    if (!slug) return jsonError("Could not generate a valid slug", 400);

    let salePrice = null;
    if (body.salePrice !== undefined && body.salePrice !== null && body.salePrice !== "") {
      salePrice = toInt(body.salePrice, NaN);
      if (!Number.isFinite(salePrice) || salePrice < 0) {
        return jsonError("Sale price must be a valid amount in paisa", 400);
      }
    }

    const collectionIds = Array.isArray(body.collectionIds)
      ? body.collectionIds.filter((id) => mongoose.Types.ObjectId.isValid(id))
      : [];

    const product = await Product.create({
      name: String(body.name).trim(),
      slug,
      sku: body.sku ? String(body.sku).trim() : undefined,
      shortDescription: String(body.shortDescription || "").trim(),
      description: String(body.description || "").trim(),
      price,
      salePrice,
      saleStart: body.saleStart ? new Date(body.saleStart) : null,
      saleEnd: body.saleEnd ? new Date(body.saleEnd) : null,
      images: normalizeImages(body.images),
      stock: Math.max(0, toInt(body.stock, 0)),
      lowStockThreshold: Math.max(0, toInt(body.lowStockThreshold, 5)),
      isActive: body.isActive !== false,
      isFeatured: body.isFeatured === true,
      collectionIds,
      tags: Array.isArray(body.tags) ? body.tags.map(String).map((tag) => tag.trim()).filter(Boolean) : [],
      position: toInt(body.position, 0),
      metaTitle: String(body.metaTitle || "").trim(),
      metaDescription: String(body.metaDescription || "").trim(),
      metaKeywords: Array.isArray(body.metaKeywords) ? body.metaKeywords.map(String) : [],
    });

    if (collectionIds.length) {
      await syncProductCollections(product._id.toString(), collectionIds);
    }

    return jsonOk({ product }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "POST /api/admin/products");
  }
});
