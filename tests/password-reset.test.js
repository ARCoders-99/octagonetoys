// tests/password-reset.test.js
// Token generation/hashing and new-password rules.

import test from "node:test";
import assert from "node:assert/strict";

import {
  RESET_TOKEN_TTL_MS,
  createResetToken,
  hashResetToken,
  isResetTokenUsable,
  validateNewPassword,
} from "../lib/server/passwordReset.js";

test("hashResetToken is deterministic sha-256 hex", () => {
  const hash = hashResetToken("abc123");
  assert.match(hash, /^[a-f0-9]{64}$/);
  assert.equal(hash, hashResetToken("abc123"));
  assert.notEqual(hash, hashResetToken("abc124"));
  assert.match(hashResetToken(""), /^[a-f0-9]{64}$/);
});

test("createResetToken returns a unique token and a 30 minute expiry", () => {
  const now = Date.UTC(2026, 0, 1, 12, 0, 0);
  const first = createResetToken(now);
  const second = createResetToken(now);

  assert.match(first.token, /^[a-f0-9]{64}$/);
  assert.notEqual(first.token, second.token);
  assert.equal(first.tokenHash, hashResetToken(first.token));
  assert.equal(first.expiresAt.getTime(), now + RESET_TOKEN_TTL_MS);
  assert.equal(RESET_TOKEN_TTL_MS, 30 * 60 * 1000);
});

test("isResetTokenUsable requires a valid hash and a future expiry", () => {
  const now = Date.now();
  const hash = hashResetToken("token");

  assert.equal(isResetTokenUsable(hash, new Date(now + 1000), now), true);
  assert.equal(isResetTokenUsable(hash, new Date(now - 1000), now), false);
  assert.equal(isResetTokenUsable("", new Date(now + 1000), now), false);
  assert.equal(isResetTokenUsable("short", new Date(now + 1000), now), false);
  assert.equal(isResetTokenUsable(hash, "not-a-date", now), false);
  assert.equal(isResetTokenUsable(hash, null, now), false);
});

test("validateNewPassword enforces length and character mix", () => {
  assert.deepEqual(validateNewPassword("short1"), {
    error: "Password must be at least 8 characters",
  });
  assert.ok(validateNewPassword("allletters").error);
  assert.ok(validateNewPassword("12345678").error);
  assert.ok(validateNewPassword("a".repeat(73)).error);
  assert.deepEqual(validateNewPassword("Toybox2026"), { value: "Toybox2026" });
});
