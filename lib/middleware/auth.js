// lib/middleware/auth.js
// Token extraction and validation helper for API route handlers.

import { verifyToken } from "../auth.js";

/**
 * Extract and verify the JWT from either the Authorization header or the
 * HttpOnly "auth" cookie.
 */
export function getAuthPayload(req) {
  let token = null;

  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    token = authHeader.slice(7).trim();
  }

  if (!token && req.cookies && typeof req.cookies.get === "function") {
    token = req.cookies.get("auth")?.value;
  }

  if (!token) {
    const rawCookie = req.headers.get("cookie");
    if (rawCookie) {
      const match = rawCookie.match(/(?:^|;\s*)auth=([^;]+)/);
      if (match) token = decodeURIComponent(match[1]);
    }
  }

  if (!token) {
    const error = new Error("Authentication token missing");
    error.status = 401;
    throw error;
  }

  try {
    return verifyToken(token);
  } catch (error) {
    const authError = new Error(error.message || "Invalid or expired token");
    authError.status = 401;
    throw authError;
  }
}

/** Optional-auth variant: returns null instead of throwing. */
export function getOptionalAuthPayload(req) {
  try {
    return getAuthPayload(req);
  } catch {
    return null;
  }
}
