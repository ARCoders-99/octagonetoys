// tests/auth.test.js
// Session token and cookie guarantees.

import test from "node:test";
import assert from "node:assert/strict";

import { authCookieOptions, generateToken, verifyToken } from "../lib/auth.js";

const ORIGINAL_SECRET = process.env.JWT_SECRET;
const ORIGINAL_ENV = process.env.NODE_ENV;

const restore = () => {
  if (ORIGINAL_SECRET === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = ORIGINAL_SECRET;
  process.env.NODE_ENV = ORIGINAL_ENV;
};

test("a signed token round-trips its payload", () => {
  process.env.JWT_SECRET = "test-secret-value";
  try {
    const token = generateToken({ id: "user-1", role: "customer" });
    const payload = verifyToken(token);
    assert.equal(payload.id, "user-1");
    assert.equal(payload.role, "customer");
  } finally {
    restore();
  }
});

test("tampered or malformed tokens are rejected", () => {
  process.env.JWT_SECRET = "test-secret-value";
  try {
    const token = generateToken({ id: "user-1" });
    const [header, payload, signature] = token.split(".");
    const forged = `${header}.${payload}.${signature.slice(0, -2)}xx`;

    assert.throws(() => verifyToken(forged));
    assert.throws(() => verifyToken("not-a-jwt"));
    assert.throws(() => verifyToken(""));
    assert.throws(() => verifyToken(null));
  } finally {
    restore();
  }
});

test("a token signed with another secret is rejected", () => {
  try {
    process.env.JWT_SECRET = "secret-one";
    const token = generateToken({ id: "user-1" });

    process.env.JWT_SECRET = "secret-two";
    assert.throws(() => verifyToken(token));
  } finally {
    restore();
  }
});

test("production refuses to sign without JWT_SECRET", () => {
  delete process.env.JWT_SECRET;
  process.env.NODE_ENV = "production";
  try {
    assert.throws(() => generateToken({ id: "x" }), /JWT_SECRET environment variable is not set/);
  } finally {
    restore();
  }
});

test("auth cookie is HttpOnly, lax and lasts seven days", () => {
  const options = authCookieOptions();
  assert.equal(options.httpOnly, true);
  assert.equal(options.sameSite, "lax");
  assert.equal(options.path, "/");
  assert.equal(options.maxAge, 7 * 24 * 60 * 60);
});

test("auth cookie is only secure outside development", () => {
  process.env.NODE_ENV = "development";
  assert.equal(authCookieOptions().secure, false);

  process.env.NODE_ENV = "production";
  assert.equal(authCookieOptions().secure, true);

  restore();
});
