// lib/server/rateLimit.js
// Small fixed-window rate limiter for API routes.
//
// The store is in-memory, which protects a single Node/serverless instance.
// If the shop is ever deployed across several instances, replace `buckets`
// with a shared store (Redis, Upstash, etc.); the call sites stay the same.

const buckets = new Map();
const MAX_BUCKETS = 10000;

function pruneExpired(now) {
  for (const [key, entry] of buckets) {
    if (entry.resetAt <= now) buckets.delete(key);
  }
}

export function clientIp(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return (
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

function take(key, limit, windowMs) {
  const now = Date.now();
  if (buckets.size > MAX_BUCKETS) pruneExpired(now);

  let entry = buckets.get(key);
  if (!entry || entry.resetAt <= now) {
    entry = { count: 0, resetAt: now + windowMs };
    buckets.set(key, entry);
  }

  entry.count += 1;

  return {
    allowed: entry.count <= limit,
    limit,
    remaining: Math.max(0, limit - entry.count),
    retryAfter: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
  };
}

function tooManyRequests(result) {
  return Response.json(
    { ok: false, error: "Too many requests. Please wait a moment and try again." },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfter),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
      },
    }
  );
}

/**
 * Returns a 429 Response when the caller is over the limit, otherwise null.
 * Pass `identity` to limit something other than the client IP (e.g. an email).
 */
export function enforceRateLimit(request, { bucket, limit, windowMs, identity }) {
  const key = `${bucket}:${identity || clientIp(request)}`;
  const result = take(key, limit, windowMs);
  return result.allowed ? null : tooManyRequests(result);
}
