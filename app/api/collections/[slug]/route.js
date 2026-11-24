// app/api/collections/[slug]/route.js

import { getCollectionBySlug } from "@/lib/server/data";
import { jsonOk, jsonError, handleApiError } from "@/lib/server/api";

export const dynamic = "force-dynamic";

export async function GET(request, context) {
  try {
    const { slug } = await context.params;
    const result = await getCollectionBySlug(slug);

    if (!result) {
      return jsonError("Collection not found", 404);
    }

    return jsonOk(result);
  } catch (error) {
    return handleApiError(error, "GET /api/collections/[slug]");
  }
}
