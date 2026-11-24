// lib/middleware/withAdminAuth.js
// Higher-order wrapper that requires a valid admin JWT.

import { getAuthPayload } from "./auth.js";

export function withAdminAuth(handler) {
  return async (req, context) => {
    try {
      const payload = getAuthPayload(req);

      if (payload.role !== "admin") {
        return Response.json(
          { ok: false, error: "Forbidden: Admin access required" },
          { status: 403 }
        );
      }

      req.admin = payload;
      return await handler(req, context);
    } catch (error) {
      return Response.json(
        { ok: false, error: error.message || "Unauthorized" },
        { status: error.status || 401 }
      );
    }
  };
}

export default withAdminAuth;
