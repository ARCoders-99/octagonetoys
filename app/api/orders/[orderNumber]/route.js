// app/api/orders/[orderNumber]/route.js
// Guest-safe order lookup. Requires the random access token issued at checkout,
// or a signed-in customer who owns the order.

import { connect } from "@/lib/mongoose";
import Order from "@/lib/models/Order";
import { getOptionalAuthPayload } from "@/lib/middleware/auth";
import { jsonOk, jsonError, handleApiError } from "@/lib/server/api";

export const dynamic = "force-dynamic";

export async function GET(request, context) {
  try {
    await connect();

    const { orderNumber } = await context.params;
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const session = getOptionalAuthPayload(request);

    const order = await Order.findOne({
      orderNumber: String(orderNumber || "").trim().toUpperCase(),
      isDeleted: false,
    }).lean();

    if (!order) return jsonError("Order not found", 404);

    const tokenMatches = token && token === order.accessToken;
    const ownerMatches =
      session?.id && order.customerId && String(order.customerId) === String(session.id);

    if (!tokenMatches && !ownerMatches) {
      return jsonError("You are not allowed to view this order", 403);
    }

    // Never expose internal notes or the access token to the browser.
    const { accessToken, adminNotes, ...safeOrder } = order;
    return jsonOk({ order: safeOrder });
  } catch (error) {
    return handleApiError(error, "GET /api/orders/[orderNumber]");
  }
}
