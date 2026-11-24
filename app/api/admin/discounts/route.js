// app/api/admin/discounts/route.js

import { connect } from "@/lib/mongoose";
import Discount from "@/lib/models/Discount";
import { withAdminAuth } from "@/lib/middleware/withAdminAuth";
import {
  jsonOk,
  jsonError,
  handleApiError,
  escapeRegex,
  parsePagination,
  buildPagination,
  toInt,
} from "@/lib/server/api";

export const dynamic = "force-dynamic";

function validateDiscount(body) {
  if (!body?.code || !String(body.code).trim()) return "Discount code is required";
  if (!["percentage", "fixed"].includes(body.discountType)) {
    return "Discount type must be percentage or fixed";
  }

  const value = toInt(body.discountValue, NaN);
  if (!Number.isFinite(value) || value < 0) return "Discount value must be a valid number";
  if (body.discountType === "percentage" && (value < 1 || value > 100)) {
    return "Percentage discount must be between 1 and 100";
  }

  return null;
}

export const GET = withAdminAuth(async (req) => {
  try {
    await connect();
    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = parsePagination(searchParams, { defaultLimit: 30 });

    const query = { isDeleted: false };
    const search = searchParams.get("search")?.trim();
    const active = searchParams.get("active");
    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      query.$or = [{ code: regex }, { description: regex }];
    }
    if (active === "true" || active === "false") query.isActive = active === "true";

    const [discounts, total] = await Promise.all([
      Discount.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Discount.countDocuments(query),
    ]);

    return jsonOk({ discounts, pagination: buildPagination(total, page, limit) });
  } catch (error) {
    return handleApiError(error, "GET /api/admin/discounts");
  }
});

export const POST = withAdminAuth(async (req) => {
  try {
    await connect();
    const body = await req.json().catch(() => null);
    const validationError = validateDiscount(body);
    if (validationError) return jsonError(validationError, 400);

    const discount = await Discount.create({
      code: String(body.code).trim().toUpperCase(),
      description: String(body.description || "").trim(),
      discountType: body.discountType,
      discountValue: toInt(body.discountValue, 0),
      minSubtotal: Math.max(0, toInt(body.minSubtotal, 0)),
      startsAt: body.startsAt ? new Date(body.startsAt) : null,
      endsAt: body.endsAt ? new Date(body.endsAt) : null,
      usageLimit:
        body.usageLimit === "" || body.usageLimit == null ? null : Math.max(0, toInt(body.usageLimit, 0)),
      isActive: body.isActive !== false,
    });

    return jsonOk({ discount }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "POST /api/admin/discounts");
  }
});
