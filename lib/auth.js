// lib/auth.js
// JWT helpers shared by the storefront, admin panel and API routes.

import jwt from "jsonwebtoken";

export const AUTH_COOKIE = "auth";
const JWT_EXPIRES_IN = "7d";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET environment variable is not set");
    }
    return "octagonetoys-dev-only-secret";
  }
  return secret;
}

/** Generate a signed JWT for a user/admin. */
export function generateToken(payload) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: JWT_EXPIRES_IN });
}

/** Verify a JWT and return its decoded payload. Throws on invalid tokens. */
export function verifyToken(token) {
  if (!token || typeof token !== "string") {
    throw new Error("Token must be a non-empty string");
  }
  return jwt.verify(token, getJwtSecret());
}

/** Cookie options for the auth cookie. */
export function authCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  };
}
