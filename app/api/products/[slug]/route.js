// app/api/products/[slug]/route.js

import { getProductBySlug } from "@/lib/server/data";
import { jsonOk, jsonError, handleApiError } from "@/lib/server/api";

export const dynamic = "force-dynamic";

export async function GET(request, context) {
  try {
    const { slug } = await context.params;
    const result = await getProductBySlug(slug);

    if (!result) {
      return jsonError("Product not found", 404);
    }

    return jsonOk(result);
  } catch (error) {
    return handleApiError(error, "GET /api/products/[slug]");
  }
}
