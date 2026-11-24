// app/api/admin/reviews/[id]/route.js
// Approve/edit/delete reviews and keep product rating aggregates in sync.

import { connect } from "@/lib/mongoose";
import Review from "@/lib/models/Review";
import { withAdminAuth } from "@/lib/middleware/withAdminAuth";
import { jsonOk, jsonError, handleApiError, isValidObjectId } from "@/lib/server/api";
import { recalculateProductRating } from "@/lib/server/rating";

export const dynamic = "force-dynamic";

async function resolveId(context) {
  const { id } = await context.params;
  return isValidObjectId(id) ? id : null;
}

export const PATCH = withAdminAuth(async (req, context) => {
  try {
    await connect();
    const id = await resolveId(context);
    if (!id) return jsonError("Invalid review ID", 400);

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return jsonError("Invalid request body", 400);

    const updates = {};
    if (body.isApproved !== undefined) updates.isApproved = Boolean(body.isApproved);
    if (body.rating !== undefined) {
      const rating = Number(body.rating);
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return jsonError("Rating must be between 1 and 5", 400);
      }
      updates.rating = rating;
    }
    if (body.title !== undefined) updates.title = String(body.title || "").trim().slice(0, 120);
    if (body.comment !== undefined) updates.comment = String(body.comment || "").trim().slice(0, 2000);

    if (!Object.keys(updates).length) return jsonError("No updatable fields provided", 400);

    const review = await Review.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: updates },
      { new: true, runValidators: true }
    ).lean();

    if (!review) return jsonError("Review not found", 404);

    await recalculateProductRating(review.productId);

    return jsonOk({ review });
  } catch (error) {
    return handleApiError(error, "PATCH /api/admin/reviews/[id]");
  }
});

export const DELETE = withAdminAuth(async (req, context) => {
  try {
    await connect();
    const id = await resolveId(context);
    if (!id) return jsonError("Invalid review ID", 400);

    const review = await Review.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: { isDeleted: true, isApproved: false } },
      { new: true }
    ).lean();

    if (!review) return jsonError("Review not found", 404);

    await recalculateProductRating(review.productId);

    return jsonOk({ message: "Review deleted" });
  } catch (error) {
    return handleApiError(error, "DELETE /api/admin/reviews/[id]");
  }
});
