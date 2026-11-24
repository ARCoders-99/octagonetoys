// tests/validation.test.js
// Pure request-parameter helpers used by the API routes.

import test from "node:test";
import assert from "node:assert/strict";

import {
  buildPagination,
  escapeRegex,
  isValidObjectId,
  parsePagination,
  slugify,
  toInt,
} from "../lib/server/validation.js";

test("slugify produces URL-safe lowercase slugs", () => {
  assert.equal(slugify("Rainbow Wooden Blocks (40 Piece)"), "rainbow-wooden-blocks-40-piece");
  assert.equal(slugify("  Space & Science  "), "space-science");
  assert.equal(slugify("---Already--Slugged---"), "already-slugged");
  assert.equal(slugify(""), "");
  assert.equal(slugify(null), "");
});

test("escapeRegex neutralises regex metacharacters", () => {
  const escaped = escapeRegex("price (Rs) * 100 + tax?");
  assert.equal(new RegExp(escaped).test("price (Rs) * 100 + tax?"), true);
  assert.equal(new RegExp(escapeRegex("a.b")).test("axb"), false);
});

test("parsePagination clamps page and limit", () => {
  const params = (query) => new URLSearchParams(query);

  assert.deepEqual(parsePagination(params("")), { page: 1, limit: 20, skip: 0 });
  assert.deepEqual(parsePagination(params("page=3&limit=10")), { page: 3, limit: 10, skip: 20 });
  assert.deepEqual(parsePagination(params("page=0&limit=0")), { page: 1, limit: 20, skip: 0 });
  assert.deepEqual(parsePagination(params("page=-4&limit=abc")), { page: 1, limit: 20, skip: 0 });
  assert.deepEqual(parsePagination(params("limit=1000"), { maxLimit: 50 }), {
    page: 1,
    limit: 50,
    skip: 0,
  });
});

test("buildPagination reports page boundaries", () => {
  assert.deepEqual(buildPagination(0, 1, 20), {
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const middle = buildPagination(95, 3, 20);
  assert.equal(middle.totalPages, 5);
  assert.equal(middle.hasNextPage, true);
  assert.equal(middle.hasPrevPage, true);

  const last = buildPagination(95, 5, 20);
  assert.equal(last.hasNextPage, false);
  assert.equal(last.hasPrevPage, true);
});

test("toInt rounds and falls back on junk", () => {
  assert.equal(toInt("42"), 42);
  assert.equal(toInt("42.6"), 43);
  assert.equal(toInt("abc", 7), 7);
  assert.equal(toInt(undefined, -1), -1);
  assert.equal(toInt(Infinity, 5), 5);
});

test("isValidObjectId accepts only 24-char hex ids", () => {
  assert.equal(isValidObjectId("507f1f77bcf86cd799439011"), true);
  assert.equal(isValidObjectId("507F1F77BCF86CD799439011"), true);
  assert.equal(isValidObjectId("507f1f77bcf86cd79943901"), false);
  assert.equal(isValidObjectId("not-an-object-id"), false);
  assert.equal(isValidObjectId(null), false);
  assert.equal(isValidObjectId(""), false);
});
