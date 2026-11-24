// app/api/discounts/validate/route.js
// Public discount preview used by the cart/checkout. It only previews the
// amount; the authoritative calculation happens again inside /api/checkout.

import { connect } from "@/lib/mongoose";
import Discount from "@/lib/models/Discount";
import { jsonOk, jsonError, handleApiError } from "@/lib/server/api";
import { enforceRateLimit } from "@/lib/server/rateLimit";
import { evaluateDiscount } from "@/lib/server/checkout";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const limited = enforceRateLimit(request, {
    bucket: "discount-validate",
    limit: 30,
    windowMs: 10 * 60 * 1000,
  });
  if (limited) return limited;

  try {
    await connect();

    const body = await request.json().catch(() => null);
    if (!body) return jsonError("Invalid request body", 400);

    const code = String(body.code || "").trim().toUpperCase();
    const subtotal = Math.max(0, Math.round(Number(body.subtotal) || 0));

    if (!code) return jsonError("Please enter a discount code", 400);
    if (!subtotal) return jsonError("Add items to your cart before applying a code", 400);

    const discount = await Discount.findOne({
      code,
      isActive: true,
      isDeleted: false,
    }).lean();

    if (!discount) return jsonError("That discount code is not valid", 400);

    const result = evaluateDiscount({ discount, subtotal });
    if (result.error) return jsonError(result.error, 400);

    return jsonOk({
      code: discount.code,
      description: discount.description || "",
      discountType: discount.discountType,
      discountValue: discount.discountValue,
      discountAmount: result.amount,
    });
  } catch (error) {
    return handleApiError(error, "POST /api/discounts/validate");
  }
}
