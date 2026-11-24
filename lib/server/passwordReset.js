// lib/server/passwordReset.js
// Pure helpers for the "forgot password" flow. Tokens are random, single-use
// and stored only as a SHA-256 hash, so a database leak cannot be replayed.
//
// Kept free of Next.js/Response imports so the rules can be unit tested.

import { createHash, randomBytes } from "node:crypto";

export const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;
export const MIN_PASSWORD_LENGTH = 8;

/** Hash a reset token for storage/lookup. Always hex, always lowercase. */
export function hashResetToken(token) {
  return createHash("sha256").update(String(token || "")).digest("hex");
}

/**
 * Create a fresh reset token pair.
 * `now` is injectable so tests do not depend on the wall clock.
 */
export function createResetToken(now = Date.now()) {
  const token = randomBytes(32).toString("hex");
  return {
    token,
    tokenHash: hashResetToken(token),
    expiresAt: new Date(now + RESET_TOKEN_TTL_MS),
  };
}

/** True when the stored hash exists and has not expired. */
export function isResetTokenUsable(tokenHash, expiresAt, now = Date.now()) {
  if (!tokenHash || String(tokenHash).length !== 64) return false;
  const expiry = expiresAt instanceof Date ? expiresAt.getTime() : new Date(expiresAt).getTime();
  return Number.isFinite(expiry) && expiry > now;
}

/** Validate a new password. Returns `{ error }` or `{ value }`. */
export function validateNewPassword(password) {
  const value = String(password || "");
  if (value.length < MIN_PASSWORD_LENGTH) {
    return { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` };
  }
  if (value.length > 72) {
    // bcrypt silently truncates beyond 72 bytes; reject instead of surprising users.
    return { error: "Password must be 72 characters or fewer" };
  }
  if (!/[a-zA-Z]/.test(value) || !/[0-9]/.test(value)) {
    return { error: "Password must include at least one letter and one number" };
  }
  return { value };
}
