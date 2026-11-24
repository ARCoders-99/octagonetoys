// app/api/account/profile/route.js
// Update the signed-in customer's name and phone number.

import { connect } from "@/lib/mongoose";
import User from "@/lib/models/User";
import { withCustomerAuth } from "@/lib/middleware/withCustomerAuth";
import { jsonOk, jsonError, handleApiError } from "@/lib/server/api";
import { validateProfile } from "@/lib/server/account";

export const dynamic = "force-dynamic";

export const PATCH = withCustomerAuth(async (req) => {
  try {
    await connect();

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return jsonError("Invalid request body", 400);

    const validated = validateProfile(body);
    if (validated.error) return jsonError(validated.error, 400);

    const user = await User.findOneAndUpdate(
      { _id: req.customer.id, isDeleted: false },
      { $set: validated.value },
      { new: true }
    )
      .select("name firstName lastName email phone")
      .lean();

    if (!user) return jsonError("Account not found", 404);

    return jsonOk({
      user,
      message: "Your profile has been updated.",
    });
  } catch (error) {
    return handleApiError(error, "PATCH /api/account/profile");
  }
});
