// app/api/auth/reset-password/route.js
// Complete the password-reset flow with the token emailed to the customer.

import bcrypt from "bcryptjs";
import { connect } from "@/lib/mongoose";
import User from "@/lib/models/User";
import { jsonOk, jsonError, handleApiError } from "@/lib/server/api";
import { enforceRateLimit } from "@/lib/server/rateLimit";
import { hashResetToken, isResetTokenUsable, validateNewPassword } from "@/lib/server/passwordReset";

export const dynamic = "force-dynamic";

export async function POST(req) {
  const limited = enforceRateLimit(req, {
    bucket: "reset-password",
    limit: 10,
    windowMs: 15 * 60 * 1000,
  });
  if (limited) return limited;

  try {
    const body = await req.json().catch(() => null);
    if (!body?.token || !body?.password) {
      return jsonError("Reset token and new password are required", 400);
    }

    const token = String(body.token).trim();
    if (!/^[a-f0-9]{64}$/i.test(token)) {
      return jsonError("This reset link is invalid or has expired", 400);
    }

    const validated = validateNewPassword(body.password);
    if (validated.error) return jsonError(validated.error, 400);

    if (body.confirmPassword !== undefined && body.confirmPassword !== body.password) {
      return jsonError("Passwords do not match", 400);
    }

    await connect();

    const tokenHash = hashResetToken(token);
    const user = await User.findOne({
      resetTokenHash: tokenHash,
      isDeleted: false,
      isActive: true,
    })
      .select("+resetTokenHash +resetTokenExpiresAt")
      .lean();

    if (!user || !isResetTokenUsable(user.resetTokenHash, user.resetTokenExpiresAt)) {
      return jsonError("This reset link is invalid or has expired", 400);
    }

    const passwordHash = await bcrypt.hash(validated.value, 10);

    // Single-use: clear the token in the same update that sets the password.
    await User.updateOne(
      { _id: user._id },
      {
        $set: { passwordHash, passwordChangedAt: new Date(), resetTokenHash: "", resetTokenExpiresAt: null },
      }
    );

    return jsonOk({ message: "Your password has been updated. You can now sign in." });
  } catch (error) {
    return handleApiError(error, "POST /api/auth/reset-password");
  }
}
