// app/api/admin/orders/route.js
// Admin order list. Orders are never deleted from this endpoint.

import { connect } from "@/lib/mongoose";
import Order from "@/lib/models/Order";
import { withAdminAuth } from "@/lib/middleware/withAdminAuth";
import {
  jsonOk,
  handleApiError,
  escapeRegex,
  parsePagination,
  buildPagination,
} from "@/lib/server/api";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const GET = withAdminAuth(async (req) => {
  try {
    await connect();
    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = parsePagination(searchParams, { defaultLimit: 20 });

    const query = { isDeleted: false };
    const status = searchParams.get("status")?.trim();
    const paymentStatus = searchParams.get("paymentStatus")?.trim();
    const search = searchParams.get("search")?.trim();
    const sort = searchParams.get("sort") || "newest";

    if (status && ORDER_STATUSES.includes(status)) query.status = status;
    if (paymentStatus && PAYMENT_STATUSES.includes(paymentStatus)) {
      query.paymentStatus = paymentStatus;
    }

    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      query.$or = [
        { orderNumber: regex },
        { "shippingAddress.fullName": regex },
        { "shippingAddress.email": regex },
        { "shippingAddress.phone": regex },
      ];
    }

    const sortMap = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      total_desc: { totalAmount: -1 },
      total_asc: { totalAmount: 1 },
    };

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort(sortMap[sort] || sortMap.newest)
        .skip(skip)
        .limit(limit)
        .populate("customerId", "email name")
        .lean(),
      Order.countDocuments(query),
    ]);

    return jsonOk({ orders, pagination: buildPagination(total, page, limit) });
  } catch (error) {
    return handleApiError(error, "GET /api/admin/orders");
  }
});
