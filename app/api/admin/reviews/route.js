// app/api/admin/reviews/route.js

import { connect } from "@/lib/mongoose";
import Review from "@/lib/models/Review";
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
    const { page, limit, skip } = parsePagination(searchParams, { defaultLimit: 30 });

    const query = { isDeleted: false };
    const approved = searchParams.get("approved");
    const productId = searchParams.get("productId");
    const search = searchParams.get("search")?.trim();

    if (approved === "true" || approved === "false") query.isApproved = approved === "true";
    if (productId) query.productId = productId;
    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      query.$or = [{ authorName: regex }, { authorEmail: regex }, { title: regex }, { comment: regex }];
    }

    const [reviews, total, pendingCount] = await Promise.all([
      Review.find(query)
        .populate("productId", "name slug images")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments(query),
      Review.countDocuments({ isDeleted: false, isApproved: false }),
    ]);

    return jsonOk({
      reviews,
      pendingCount,
      pagination: buildPagination(total, page, limit),
    });
  } catch (error) {
    return handleApiError(error, "GET /api/admin/reviews");
  }
});
