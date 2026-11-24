// app/api/auth/me/route.js

import { getAuthPayload } from "@/lib/middleware/auth";
import { jsonOk, jsonError } from "@/lib/server/api";

export async function GET(req) {
  try {
    const user = getAuthPayload(req);
    return jsonOk({ user });
  } catch (error) {
    return jsonError(error.message || "Unauthorized", error.status || 401);
  }
}
