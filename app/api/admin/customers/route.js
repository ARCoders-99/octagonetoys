// app/api/admin/customers/route.js

import { connect } from "@/lib/mongoose";
import User from "@/lib/models/User";
import Order from "@/lib/models/Order";
import { withAdminAuth } from "@/lib/middleware/withAdminAuth";
import {
  jsonOk,
  handleApiError,
  escapeRegex,
  parsePagination,
  buildPagination,
} from "@/lib/server/api";

export const dynamic = "force-dynamic";

export const GET = withAdminAuth(async (req) => {
  try {
    await connect();
    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = parsePagination(searchParams, { defaultLimit: 20 });

    const query = { role: "customer", isDeleted: false };
    const search = searchParams.get("search")?.trim();
    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      query.$or = [{ name: regex }, { email: regex }, { phone: regex }, { firstName: regex }, { lastName: regex }];
    }

    const [customers, total] = await Promise.all([
      User.find(query)
        .select("-passwordHash")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    const stats = await Order.aggregate([
      { $match: { customerId: { $in: customers.map((customer) => customer._id) }, isDeleted: false } },
      {
        $group: {
          _id: "$customerId",
          orders: { $sum: 1 },
          spent: { $sum: "$totalAmount" },
          lastOrderAt: { $max: "$createdAt" },
        },
      },
    ]);
    const statsMap = new Map(stats.map((item) => [String(item._id), item]));

    const enriched = customers.map((customer) => ({
      ...customer,
      orderCount: statsMap.get(String(customer._id))?.orders || 0,
      totalSpent: statsMap.get(String(customer._id))?.spent || 0,
      lastOrderAt: statsMap.get(String(customer._id))?.lastOrderAt || null,
    }));

    return jsonOk({ customers: enriched, pagination: buildPagination(total, page, limit) });
  } catch (error) {
    return handleApiError(error, "GET /api/admin/customers");
  }
});
