// app/api/account/password/route.js
// Change the signed-in customer's password.

import bcrypt from "bcryptjs";
import { connect } from "@/lib/mongoose";
import User from "@/lib/models/User";
import { withCustomerAuth } from "@/lib/middleware/withCustomerAuth";
import { jsonOk, jsonError, handleApiError } from "@/lib/server/api";
import { enforceRateLimit } from "@/lib/server/rateLimit";
import { validateNewPassword } from "@/lib/server/passwordReset";

export const dynamic = "force-dynamic";

export const POST = withCustomerAuth(async (req) => {
  const limited = enforceRateLimit(req, {
    bucket: "change-password",
    limit: 10,
    windowMs: 15 * 60 * 1000,
    identity: req.customer.id,
  });
  if (limited) return limited;

  try {
    await connect();

    const body = await req.json().catch(() => null);
    if (!body?.currentPassword || !body?.newPassword) {
      return jsonError("Current and new passwords are required", 400);
    }

    const validated = validateNewPassword(body.newPassword);
    if (validated.error) return jsonError(validated.error, 400);

    if (body.confirmPassword !== undefined && body.confirmPassword !== body.newPassword) {
      return jsonError("New passwords do not match", 400);
    }

    const user = await User.findOne({ _id: req.customer.id, isDeleted: false });
    if (!user) return jsonError("Account not found", 404);

    const matches = await bcrypt.compare(String(body.currentPassword), user.passwordHash);
    if (!matches) return jsonError("Your current password is incorrect", 400);

    if (await bcrypt.compare(validated.value, user.passwordHash)) {
      return jsonError("Please choose a password you have not used before", 400);
    }

    user.passwordHash = await bcrypt.hash(validated.value, 10);
    user.passwordChangedAt = new Date();
    await user.save();

    return jsonOk({ message: "Your password has been changed." });
  } catch (error) {
    return handleApiError(error, "POST /api/account/password");
  }
});
