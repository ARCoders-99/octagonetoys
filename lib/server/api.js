// lib/server/api.js
// Small helpers shared by API route handlers.

import { NextResponse } from "next/server";
import {
  buildPagination,
  escapeRegex,
  isValidObjectId,
  parsePagination,
  slugify,
  toInt,
} from "./validation.js";

// Re-exported so existing route imports keep working.
export { buildPagination, escapeRegex, isValidObjectId, parsePagination, slugify, toInt };

export function jsonOk(data = {}, init) {
  return NextResponse.json({ ok: true, ...data }, init);
}

export function jsonError(message, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export function handleApiError(error, label = "API error") {
  if (error?.code === 11000) {
    const field = Object.keys(error.keyPattern || {})[0] || "value";
    return jsonError(`${field} already exists`, 409);
  }

  console.error(`${label}:`, error);
  return jsonError(error?.message || "Something went wrong", error?.status || 500);
}
