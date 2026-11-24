// app/api/admin/stats/route.js
// Dashboard metrics and chart data.

import { connect } from "@/lib/mongoose";
import Order from "@/lib/models/Order";
import Product from "@/lib/models/Product";
import User from "@/lib/models/User";
import Review from "@/lib/models/Review";
import { withAdminAuth } from "@/lib/middleware/withAdminAuth";
import { jsonOk, handleApiError } from "@/lib/server/api";
import { serialize } from "@/lib/serialize";

export const dynamic = "force-dynamic";

function startOfDay(date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

export const GET = withAdminAuth(async () => {
  try {
    await connect();

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const chartStart = startOfDay(new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000));
    const validOrderMatch = { isDeleted: false, status: { $ne: "cancelled" } };

    const [
      totalSalesResult,
      monthSalesResult,
      ordersCount,
      pendingOrders,
      customersCount,
      productsCount,
      lowStockCount,
      pendingReviews,
      recentOrders,
      salesByDay,
      topProducts,
      statusBreakdown,
    ] = await Promise.all([
      Order.aggregate([
        { $match: validOrderMatch },
        { $group: { _id: null, total: { $sum: "$totalAmount" }, count: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: { ...validOrderMatch, createdAt: { $gte: monthStart } } },
        { $group: { _id: null, total: { $sum: "$totalAmount" }, count: { $sum: 1 } } },
      ]),
      Order.countDocuments({ isDeleted: false }),
      Order.countDocuments({ isDeleted: false, status: "pending" }),
      User.countDocuments({ role: "customer", isDeleted: false }),
      Product.countDocuments({ isDeleted: false }),
      Product.countDocuments({
        isDeleted: false,
        isActive: true,
        $expr: { $lte: ["$stock", "$lowStockThreshold"] },
      }),
      Review.countDocuments({ isDeleted: false, isApproved: false }),
      Order.find({ isDeleted: false })
        .sort({ createdAt: -1 })
        .limit(8)
        .select("orderNumber shippingAddress.fullName shippingAddress.email totalAmount status paymentStatus createdAt")
        .lean(),
      Order.aggregate([
        { $match: { ...validOrderMatch, createdAt: { $gte: chartStart } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Karachi" } },
            total: { $sum: "$totalAmount" },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Order.aggregate([
        { $match: validOrderMatch },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.productId",
            title: { $first: "$items.title" },
            sold: { $sum: "$items.quantity" },
            revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
          },
        },
        { $sort: { sold: -1 } },
        { $limit: 5 },
      ]),
      Order.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    const dayMap = new Map(salesByDay.map((item) => [item._id, item]));
    const chart = [];
    for (let index = 13; index >= 0; index -= 1) {
      const day = startOfDay(new Date(now.getTime() - index * 24 * 60 * 60 * 1000));
      const key = day.toISOString().slice(0, 10);
      const entry = dayMap.get(key);
      chart.push({
        date: key,
        label: new Intl.DateTimeFormat("en-PK", { day: "numeric", month: "short" }).format(day),
        total: entry?.total || 0,
        orders: entry?.orders || 0,
      });
    }

    return jsonOk({
      stats: {
        totalSales: totalSalesResult[0]?.total || 0,
        totalOrders: totalSalesResult[0]?.count || 0,
        monthSales: monthSalesResult[0]?.total || 0,
        monthOrders: monthSalesResult[0]?.count || 0,
        ordersCount,
        pendingOrders,
        customersCount,
        productsCount,
        lowStockCount,
        pendingReviews,
      },
      chart,
      recentOrders: serialize(recentOrders),
      topProducts: serialize(topProducts),
      statusBreakdown: serialize(statusBreakdown),
    });
  } catch (error) {
    return handleApiError(error, "GET /api/admin/stats");
  }
});
