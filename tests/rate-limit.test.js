// tests/rate-limit.test.js
// Abuse protection for the public API.

import test from "node:test";
import assert from "node:assert/strict";

import { clientIp, enforceRateLimit } from "../lib/server/rateLimit.js";

let counter = 0;
const uniqueBucket = () => `test-${counter++}-${Date.now()}`;

const requestFrom = (ip, { forwarded = true } = {}) => ({
  headers: {
    get(name) {
      if (forwarded && name === "x-forwarded-for") return ip;
      return null;
    },
  },
});

test("clientIp prefers x-forwarded-for and trims the first hop", () => {
  assert.equal(clientIp(requestFrom("1.1.1.1, 2.2.2.2")), "1.1.1.1");
  assert.equal(clientIp(requestFrom("  3.3.3.3  ")), "3.3.3.3");
});

test("clientIp falls back to common proxy headers", () => {
  const headers = (map) => ({ headers: { get: (name) => map[name] || null } });

  assert.equal(clientIp(headers({ "x-real-ip": "4.4.4.4" })), "4.4.4.4");
  assert.equal(clientIp(headers({ "cf-connecting-ip": "5.5.5.5" })), "5.5.5.5");
  assert.equal(clientIp(headers({})), "unknown");
});

test("requests are allowed up to the limit, then get a 429", () => {
  const bucket = uniqueBucket();
  const request = requestFrom("9.9.9.9");
  const options = { bucket, limit: 3, windowMs: 60_000 };

  assert.equal(enforceRateLimit(request, options), null);
  assert.equal(enforceRateLimit(request, options), null);
  assert.equal(enforceRateLimit(request, options), null);

  const blocked = enforceRateLimit(request, options);
  assert.ok(blocked, "expected a Response once the limit is exceeded");
  assert.equal(blocked.status, 429);
  assert.equal(blocked.headers.get("x-ratelimit-limit"), "3");
  assert.equal(blocked.headers.get("x-ratelimit-remaining"), "0");
  assert.ok(Number(blocked.headers.get("retry-after")) >= 1);
});

test("the 429 body is JSON with a helpful message", async () => {
  const bucket = uniqueBucket();
  const options = { bucket, limit: 1, windowMs: 60_000 };

  enforceRateLimit(requestFrom("9.9.9.8"), options);
  const blocked = enforceRateLimit(requestFrom("9.9.9.8"), options);

  const body = await blocked.json();
  assert.equal(body.ok, false);
  assert.match(body.error, /Too many requests/);
});

test("limits are isolated per client ip", () => {
  const bucket = uniqueBucket();
  const options = { bucket, limit: 1, windowMs: 60_000 };

  assert.equal(enforceRateLimit(requestFrom("10.0.0.1"), options), null);
  assert.equal(enforceRateLimit(requestFrom("10.0.0.2"), options), null);
  assert.ok(enforceRateLimit(requestFrom("10.0.0.1"), options));
});

test("an explicit identity can replace the ip key", () => {
  const bucket = uniqueBucket();
  const options = { bucket, limit: 1, windowMs: 60_000 };

  assert.equal(
    enforceRateLimit(requestFrom("10.0.0.3"), { ...options, identity: "user@example.com" }),
    null
  );
  assert.equal(
    enforceRateLimit(requestFrom("10.0.0.4"), { ...options, identity: "other@example.com" }),
    null
  );
  assert.ok(
    enforceRateLimit(requestFrom("10.0.0.5"), { ...options, identity: "user@example.com" })
  );
});

test("the counter resets after the window expires", async () => {
  const bucket = uniqueBucket();
  const request = requestFrom("10.0.0.6");
  const options = { bucket, limit: 1, windowMs: 40 };

  assert.equal(enforceRateLimit(request, options), null);
  assert.ok(enforceRateLimit(request, options));

  await new Promise((resolve) => setTimeout(resolve, 60));

  assert.equal(enforceRateLimit(request, options), null);
});
