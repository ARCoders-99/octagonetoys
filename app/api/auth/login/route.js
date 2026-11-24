// app/api/auth/login/route.js
// Login endpoint for admins and customers.

import bcrypt from "bcryptjs";
import { connect } from "@/lib/mongoose";
import User from "@/lib/models/User";
import { AUTH_COOKIE, authCookieOptions, generateToken } from "@/lib/auth";
import { jsonOk, jsonError, handleApiError } from "@/lib/server/api";
import { enforceRateLimit } from "@/lib/server/rateLimit";

export async function POST(req) {
  try {
    await connect();

    const body = await req.json().catch(() => null);
    if (!body?.email || !body?.password) {
      return jsonError("Email and password are required", 400);
    }

    const email = String(body.email).trim().toLowerCase();
    const password = String(body.password);

    // Slow down password guessing: cap attempts per IP and per account.
    const limited =
      enforceRateLimit(req, { bucket: "login-ip", limit: 20, windowMs: 5 * 60 * 1000 }) ||
      enforceRateLimit(req, {
        bucket: "login-email",
        limit: 10,
        windowMs: 15 * 60 * 1000,
        identity: email,
      });
    if (limited) return limited;

    const user = await User.findOne({ email, isDeleted: false, isActive: true });
    if (!user) {
      return jsonError("Invalid email or password", 401);
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      return jsonError("Invalid email or password", 401);
    }

    if (body.mode === "admin" && user.role !== "admin") {
      return jsonError("This account does not have admin access", 403);
    }

    const displayName =
      user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email;

    const payload = {
      id: user._id.toString(),
      email: user.email,
      name: displayName,
      role: user.role,
    };

    const token = generateToken(payload);
    const response = jsonOk({ user: payload, token });
    response.cookies.set(AUTH_COOKIE, token, authCookieOptions());
    return response;
  } catch (error) {
    return handleApiError(error, "POST /api/auth/login");
  }
}
