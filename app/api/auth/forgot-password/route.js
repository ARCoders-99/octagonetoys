// app/api/auth/forgot-password/route.js
// Start the password-reset flow. Always responds generically so the endpoint
// cannot be used to check whether an email is registered.

import { connect } from "@/lib/mongoose";
import User from "@/lib/models/User";
import { jsonOk, jsonError, handleApiError } from "@/lib/server/api";
import { enforceRateLimit } from "@/lib/server/rateLimit";
import { createResetToken } from "@/lib/server/passwordReset";
import { sendPasswordReset } from "@/lib/server/email";

export const dynamic = "force-dynamic";

const GENERIC_MESSAGE =
  "If an account exists for that email, we have sent a password reset link. Check your inbox and spam folder.";

function baseUrl(req) {
  const configured = process.env.NEXT_PUBLIC_BASE_URL;
  if (configured) return configured.replace(/\/+$/, "");
  return new URL(req.url).origin;
}

export async function POST(req) {
  const ipLimited = enforceRateLimit(req, {
    bucket: "forgot-password-ip",
    limit: 5,
    windowMs: 15 * 60 * 1000,
  });
  if (ipLimited) return ipLimited;

  try {
    const body = await req.json().catch(() => null);
    if (!body?.email) return jsonError("Please enter your email address", 400);

    const email = String(body.email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonError("Please enter a valid email address", 400);
    }

    const emailLimited = enforceRateLimit(req, {
      bucket: "forgot-password-email",
      limit: 3,
      windowMs: 15 * 60 * 1000,
      identity: email,
    });
    if (emailLimited) return emailLimited;

    await connect();

    const user = await User.findOne({ email, isDeleted: false, isActive: true }).lean();

    if (user) {
      const { token, tokenHash, expiresAt } = createResetToken();

      await User.updateOne(
        { _id: user._id },
        { $set: { resetTokenHash: tokenHash, resetTokenExpiresAt: expiresAt } }
      );

      const resetUrl = `${baseUrl(req)}/reset-password?token=${token}`;
      try {
        const result = await sendPasswordReset(
          user.email,
          resetUrl,
          user.name || user.firstName || ""
        );
        if (!result.sent && result.reason !== "email-not-configured") {
          console.error("Password reset email was not sent:", result);
        }
      } catch (error) {
        // Never leak mail failures to the caller.
        console.error("Password reset email failed:", error.message);
      }
    }

    return jsonOk({ message: GENERIC_MESSAGE });
  } catch (error) {
    return handleApiError(error, "POST /api/auth/forgot-password");
  }
}
