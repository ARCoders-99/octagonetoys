// app/api/collections/route.js
// Public collection listing.

import { getActiveCollections } from "@/lib/server/data";
import { jsonOk, handleApiError } from "@/lib/server/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const collections = await getActiveCollections({ limit: 50 });
    return jsonOk({ collections });
  } catch (error) {
    return handleApiError(error, "GET /api/collections");
  }
}
