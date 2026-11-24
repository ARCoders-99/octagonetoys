// lib/middleware/withCustomerAuth.js
// Higher-order wrapper that requires a signed-in customer (not an admin).

import { getAuthPayload } from "./auth.js";

export function withCustomerAuth(handler) {
  return async (req, context) => {
    try {
      const payload = getAuthPayload(req);

      if (payload.role !== "customer") {
        return Response.json(
          { ok: false, error: "Forbidden: Customer access required" },
          { status: 403 }
        );
      }

      req.customer = payload;
      return await handler(req, context);
    } catch (error) {
      return Response.json(
        { ok: false, error: error.message || "Unauthorized" },
        { status: error.status || 401 }
      );
    }
  };
}

export default withCustomerAuth;
