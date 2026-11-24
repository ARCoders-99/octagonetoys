// app/api/products/route.js
// Public product listing with search, filters, sorting and pagination.

import { getStorefrontProducts } from "@/lib/server/data";
import { jsonOk, handleApiError } from "@/lib/server/api";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const result = await getStorefrontProducts({
      q: searchParams.get("q") || "",
      collection: searchParams.get("collection") || "",
      sort: searchParams.get("sort") || "featured",
      minPrice: searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : null,
      maxPrice: searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : null,
      inStock: searchParams.get("inStock") === "true",
      featured: searchParams.get("featured") === "true",
      page: Number(searchParams.get("page") || 1),
      limit: Number(searchParams.get("limit") || 12),
    });

    return jsonOk({
      products: result.products,
      collection: result.collection,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    return handleApiError(error, "GET /api/products");
  }
}
