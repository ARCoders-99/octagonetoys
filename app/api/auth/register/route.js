// app/api/auth/register/route.js
// Customer registration. Admins are created only through the seed script.

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
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonError("Please enter a valid email address", 400);
    }

    const password = String(body.password);
    if (password.length < 6) {
      return jsonError("Password must be at least 6 characters", 400);
    }

    const limited = enforceRateLimit(req, {
      bucket: "register",
      limit: 10,
      windowMs: 60 * 60 * 1000,
    });
    if (limited) return limited;

    const existing = await User.findOne({ email });
    if (existing) {
      return jsonError("An account with this email already exists", 409);
    }

    const firstName = String(body.firstName || "").trim();
    const lastName = String(body.lastName || "").trim();
    const name = `${firstName} ${lastName}`.trim() || email;

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      passwordHash,
      firstName,
      lastName,
      name,
      phone: String(body.phone || "").trim(),
      role: "customer",
    });

    const payload = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const token = generateToken(payload);
    const response = jsonOk({ user: payload, token }, { status: 201 });
    response.cookies.set(AUTH_COOKIE, token, authCookieOptions());
    return response;
  } catch (error) {
    return handleApiError(error, "POST /api/auth/register");
  }
}
