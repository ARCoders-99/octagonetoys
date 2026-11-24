// tests/format.test.js
// Money is stored as integer paisa; these tests pin the display and
// effective-price rules that the storefront relies on.

import test from "node:test";
import assert from "node:assert/strict";

import {
  effectivePrice,
  formatPrice,
  initials,
  isSaleActive,
  salePercent,
  stockLabel,
} from "../lib/format.js";

const daysFromNow = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

test("formatPrice renders paisa as whole PKR", () => {
  assert.match(formatPrice(0), /^Rs\s?0$/);
  assert.match(formatPrice(129900), /^Rs\s?1,299$/);
  assert.match(formatPrice(399900), /^Rs\s?3,999$/);
});

test("formatPrice never shows fractions for paisa amounts", () => {
  // 1,299.49 PKR still renders as Rs 1,299 because prices are whole rupees.
  assert.doesNotMatch(formatPrice(129949), /\./);
});

test("formatPrice tolerates junk input", () => {
  assert.match(formatPrice(undefined), /^Rs\s?0$/);
  assert.match(formatPrice("not-a-number"), /^Rs\s?0$/);
});

test("isSaleActive is false without a sale price", () => {
  assert.equal(isSaleActive({ price: 100000 }), false);
  assert.equal(isSaleActive({ price: 100000, salePrice: null }), false);
  assert.equal(isSaleActive(null), false);
});

test("isSaleActive respects the sale window", () => {
  const base = { price: 100000, salePrice: 80000 };
  assert.equal(isSaleActive({ ...base, saleStart: daysFromNow(1) }), false);
  assert.equal(isSaleActive({ ...base, saleEnd: daysFromNow(-1) }), false);
  assert.equal(
    isSaleActive({ ...base, saleStart: daysFromNow(-1), saleEnd: daysFromNow(1) }),
    true
  );
});

test("isSaleActive ignores a sale price that is not cheaper", () => {
  assert.equal(isSaleActive({ price: 100000, salePrice: 100000 }), false);
  assert.equal(isSaleActive({ price: 100000, salePrice: 120000 }), false);
});

test("effectivePrice switches between price and sale price", () => {
  assert.equal(effectivePrice({ price: 100000 }), 100000);
  assert.equal(effectivePrice({ price: 100000, salePrice: 80000 }), 80000);
  assert.equal(effectivePrice({ price: 100000, salePrice: 80000, saleEnd: daysFromNow(-1) }), 100000);
  assert.equal(effectivePrice(null), 0);
});

test("salePercent rounds to the nearest whole percent", () => {
  assert.equal(salePercent({ price: 100000, salePrice: 80000 }), 20);
  assert.equal(salePercent({ price: 129900, salePrice: 99900 }), 23);
  assert.equal(salePercent({ price: 100000 }), 0);
  assert.equal(salePercent({ price: 0, salePrice: 0 }), 0);
});

test("stockLabel maps stock levels to labels and tones", () => {
  assert.deepEqual(stockLabel(0), { label: "Out of stock", tone: "danger" });
  assert.deepEqual(stockLabel(-5), { label: "Out of stock", tone: "danger" });
  assert.deepEqual(stockLabel(3), { label: "Only 3 left", tone: "warning" });
  assert.deepEqual(stockLabel(5), { label: "Only 5 left", tone: "warning" });
  assert.deepEqual(stockLabel(6), { label: "In stock", tone: "success" });
  assert.deepEqual(stockLabel(2, 1), { label: "In stock", tone: "success" });
});

test("initials uses the first two name parts", () => {
  assert.equal(initials("Ayesha Khan"), "AK");
  assert.equal(initials("Ali"), "A");
  assert.equal(initials("  "), "");
  assert.equal(initials(""), "");
});
