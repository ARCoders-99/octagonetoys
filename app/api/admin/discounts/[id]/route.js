// app/api/admin/discounts/[id]/route.js

import { connect } from "@/lib/mongoose";
import Discount from "@/lib/models/Discount";
import { withAdminAuth } from "@/lib/middleware/withAdminAuth";
import { jsonOk, jsonError, handleApiError, isValidObjectId, toInt } from "@/lib/server/api";

export const dynamic = "force-dynamic";

async function resolveId(context) {
  const { id } = await context.params;
  return isValidObjectId(id) ? id : null;
}

export const GET = withAdminAuth(async (req, context) => {
  try {
    await connect();
    const id = await resolveId(context);
    if (!id) return jsonError("Invalid discount ID", 400);

    const discount = await Discount.findOne({ _id: id, isDeleted: false }).lean();
    if (!discount) return jsonError("Discount not found", 404);
    return jsonOk({ discount });
  } catch (error) {
    return handleApiError(error, "GET /api/admin/discounts/[id]");
  }
});

export const PUT = withAdminAuth(async (req, context) => {
  try {
    await connect();
    const id = await resolveId(context);
    if (!id) return jsonError("Invalid discount ID", 400);

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return jsonError("Invalid update payload", 400);

    const updates = {};
    if (body.code !== undefined) {
      if (!String(body.code).trim()) return jsonError("Discount code cannot be empty", 400);
      updates.code = String(body.code).trim().toUpperCase();
    }
    if (body.description !== undefined) updates.description = String(body.description || "").trim();
    if (body.discountType !== undefined) {
      if (!["percentage", "fixed"].includes(body.discountType)) {
        return jsonError("Discount type must be percentage or fixed", 400);
      }
      updates.discountType = body.discountType;
    }
    if (body.discountValue !== undefined) {
      const value = toInt(body.discountValue, NaN);
      if (!Number.isFinite(value) || value < 0) return jsonError("Invalid discount value", 400);
      updates.discountValue = value;
    }
    if (body.minSubtotal !== undefined) updates.minSubtotal = Math.max(0, toInt(body.minSubtotal, 0));
    if (body.startsAt !== undefined) updates.startsAt = body.startsAt ? new Date(body.startsAt) : null;
    if (body.endsAt !== undefined) updates.endsAt = body.endsAt ? new Date(body.endsAt) : null;
    if (body.usageLimit !== undefined) {
      updates.usageLimit =
        body.usageLimit === "" || body.usageLimit == null ? null : Math.max(0, toInt(body.usageLimit, 0));
    }
    if (body.isActive !== undefined) updates.isActive = Boolean(body.isActive);

    if (!Object.keys(updates).length) return jsonError("No updatable fields provided", 400);

    if (updates.discountType === "percentage" && updates.discountValue !== undefined) {
      if (updates.discountValue < 1 || updates.discountValue > 100) {
        return jsonError("Percentage discount must be between 1 and 100", 400);
      }
    }

    const discount = await Discount.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: updates },
      { new: true, runValidators: true }
    ).lean();

    if (!discount) return jsonError("Discount not found", 404);
    return jsonOk({ discount });
  } catch (error) {
    return handleApiError(error, "PUT /api/admin/discounts/[id]");
  }
});

export const PATCH = PUT;

export const DELETE = withAdminAuth(async (req, context) => {
  try {
    await connect();
    const id = await resolveId(context);
    if (!id) return jsonError("Invalid discount ID", 400);

    const discount = await Discount.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: { isDeleted: true, isActive: false } },
      { new: true }
    );

    if (!discount) return jsonError("Discount not found", 404);
    return jsonOk({ message: "Discount deleted" });
  } catch (error) {
    return handleApiError(error, "DELETE /api/admin/discounts/[id]");
  }
});
