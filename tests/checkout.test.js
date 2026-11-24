// tests/checkout.test.js
// The authoritative money rules: cart normalisation, trusted prices, discount
// evaluation, shipping and totals. Everything is integer paisa.

import test from "node:test";
import assert from "node:assert/strict";

import {
  buildOrderItems,
  calculateShipping,
  calculateTotals,
  evaluateDiscount,
  generateOrderNumber,
  normalizeCartItems,
  sanitizePaymentMethod,
  validateShippingAddress,
} from "../lib/server/checkout.js";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from "../lib/constants.js";

const PID = "507f1f77bcf86cd799439011";
const PID_2 = "507f1f77bcf86cd799439012";

const makeProduct = (overrides = {}) => ({
  _id: PID,
  name: "Turbo Stunt RC Car",
  slug: "turbo-stunt-rc-car",
  price: 129900,
  salePrice: null,
  stock: 10,
  images: [{ url: "https://cdn.example.com/car.jpg" }],
  sku: "TOY-RC-01",
  ...overrides,
});

const mapOf = (...products) => new Map(products.map((product) => [String(product._id), product]));

const makeDiscount = (overrides = {}) => ({
  code: "WELCOME10",
  discountType: "percentage",
  discountValue: 10,
  minSubtotal: 0,
  startsAt: null,
  endsAt: null,
  usageLimit: null,
  usedCount: 0,
  isActive: true,
  isDeleted: false,
  ...overrides,
});

// ---------------------------------------------------------------- cart input

test("normalizeCartItems rejects an empty cart", () => {
  assert.deepEqual(normalizeCartItems([]), { error: "Your cart is empty" });
  assert.deepEqual(normalizeCartItems(undefined), { error: "Your cart is empty" });
});

test("normalizeCartItems rejects malformed product ids", () => {
  assert.equal(
    normalizeCartItems([{ productId: "nope", quantity: 1 }]).error,
    "Your cart contains an invalid product"
  );
});

test("normalizeCartItems merges duplicate lines and clamps quantities", () => {
  const result = normalizeCartItems([
    { productId: PID, quantity: 2 },
    { productId: PID, quantity: 3 },
    { _id: PID_2, quantity: 0 },
    { productId: PID_2, quantity: 150 },
    { productId: "507f1f77bcf86cd799439013", quantity: "2.6" },
  ]);

  assert.deepEqual(result.items, [
    { id: PID, quantity: 5 },
    { id: PID_2, quantity: 100 }, // 1 + 99
    { id: "507f1f77bcf86cd799439013", quantity: 3 },
  ]);
});

// ------------------------------------------------------------- trusted prices

test("buildOrderItems uses the database price, never the client's", () => {
  const product = makeProduct();
  const result = buildOrderItems({
    items: [{ id: PID, quantity: 2 }],
    productMap: mapOf(product),
  });

  assert.equal(result.subtotal, 259800);
  assert.equal(result.items[0].price, 129900);
  assert.equal(result.items[0].title, product.name);
  assert.equal(result.items[0].image, "https://cdn.example.com/car.jpg");
});

test("buildOrderItems charges the sale price while a sale is active", () => {
  const product = makeProduct({ salePrice: 99900 });
  const result = buildOrderItems({ items: [{ id: PID, quantity: 3 }], productMap: mapOf(product) });

  assert.equal(result.subtotal, 299700);
  assert.equal(result.items[0].price, 99900);
});

test("buildOrderItems sums multiple lines as integers", () => {
  const result = buildOrderItems({
    items: [
      { id: PID, quantity: 2 },
      { id: PID_2, quantity: 1 },
    ],
    productMap: mapOf(
      makeProduct(),
      makeProduct({ _id: PID_2, name: "Puzzle", price: 45000, images: [], sku: undefined })
    ),
  });

  assert.equal(result.subtotal, 129900 * 2 + 45000);
  assert.ok(Number.isInteger(result.subtotal));
  assert.equal(result.items[1].image, "");
  assert.equal(result.items[1].sku, "");
});

test("buildOrderItems refuses to oversell", () => {
  const result = buildOrderItems({
    items: [{ id: PID, quantity: 11 }],
    productMap: mapOf(makeProduct({ stock: 10 })),
  });

  assert.equal(result.status, 409);
  assert.match(result.error, /Only 10 left of "Turbo Stunt RC Car"/);
});

test("buildOrderItems reports unavailable and zero-priced products", () => {
  const missing = buildOrderItems({ items: [{ id: PID, quantity: 1 }], productMap: new Map() });
  assert.equal(missing.status, 409);
  assert.match(missing.error, /unavailable/);

  const free = buildOrderItems({
    items: [{ id: PID, quantity: 1 }],
    productMap: mapOf(makeProduct({ price: 0, salePrice: null })),
  });
  assert.equal(free.status, 409);
  assert.match(free.error, /does not have a valid price/);
});

// ------------------------------------------------------------------ discounts

test("evaluateDiscount applies a percentage and rounds to the nearest paisa", () => {
  assert.equal(evaluateDiscount({ discount: makeDiscount(), subtotal: 399900 }).amount, 39990);
  assert.equal(
    evaluateDiscount({
      discount: makeDiscount({ discountValue: 10 }),
      subtotal: 333,
    }).amount,
    33
  );
});

test("evaluateDiscount applies a fixed amount but never above the subtotal", () => {
  const fixed = makeDiscount({ discountType: "fixed", discountValue: 50000 });
  assert.equal(evaluateDiscount({ discount: fixed, subtotal: 129900 }).amount, 50000);
  assert.equal(evaluateDiscount({ discount: fixed, subtotal: 30000 }).amount, 30000);
});

test("evaluateDiscount clamps percentage to 100", () => {
  const discount = makeDiscount({ discountValue: 150 });
  assert.equal(evaluateDiscount({ discount, subtotal: 50000 }).amount, 50000);
});

test("evaluateDiscount enforces the minimum spend", () => {
  const discount = makeDiscount({ minSubtotal: 200000 });
  assert.equal(evaluateDiscount({ discount, subtotal: 199999 }).error, "Your order does not meet the minimum spend for this code");
  assert.equal(evaluateDiscount({ discount, subtotal: 200000 }).amount, 20000);
});

test("evaluateDiscount enforces the active window", () => {
  const now = new Date("2026-11-11T12:00:00Z");
  const future = makeDiscount({ startsAt: new Date("2026-11-12T00:00:00Z") });
  const past = makeDiscount({ endsAt: new Date("2026-11-10T00:00:00Z") });

  assert.equal(evaluateDiscount({ discount: future, subtotal: 100000, now }).error, "This discount code is not active yet");
  assert.equal(evaluateDiscount({ discount: past, subtotal: 100000, now }).error, "This discount code has expired");
});

test("evaluateDiscount enforces the usage limit", () => {
  const capped = makeDiscount({ usageLimit: 5, usedCount: 5 });
  const remaining = makeDiscount({ usageLimit: 5, usedCount: 4 });
  const unlimited = makeDiscount({ usageLimit: null, usedCount: 999 });

  assert.equal(evaluateDiscount({ discount: capped, subtotal: 100000 }).error, "This discount code has reached its usage limit");
  assert.equal(evaluateDiscount({ discount: remaining, subtotal: 100000 }).amount, 10000);
  assert.equal(evaluateDiscount({ discount: unlimited, subtotal: 100000 }).amount, 10000);
});

test("evaluateDiscount rejects an unknown code", () => {
  assert.equal(evaluateDiscount({ discount: null, subtotal: 100000 }).error, "That discount code is not valid");
  assert.equal(evaluateDiscount({}).error, "That discount code is not valid");
});

// --------------------------------------------------------- shipping & totals

test("shipping is free exactly at the threshold", () => {
  assert.equal(calculateShipping(0), SHIPPING_FEE);
  assert.equal(calculateShipping(FREE_SHIPPING_THRESHOLD - 1), SHIPPING_FEE);
  assert.equal(calculateShipping(FREE_SHIPPING_THRESHOLD), 0);
  assert.equal(calculateShipping(FREE_SHIPPING_THRESHOLD + 1), 0);
});

test("calculateTotals adds shipping then subtracts the discount", () => {
  assert.deepEqual(calculateTotals({ subtotal: 129900 }), {
    shippingFee: SHIPPING_FEE,
    discountAmount: 0,
    totalAmount: 154900,
  });

  assert.deepEqual(calculateTotals({ subtotal: 399900, discountAmount: 39990 }), {
    shippingFee: 0,
    discountAmount: 39990,
    totalAmount: 359910,
  });
});

test("calculateTotals never returns a negative total", () => {
  const totals = calculateTotals({ subtotal: 10000, discountAmount: 500000 });
  assert.equal(totals.totalAmount, 0);
});

test("every total stays an integer number of paisa", () => {
  const totals = calculateTotals({ subtotal: 129999, discountAmount: 33333 });
  assert.ok(Number.isInteger(totals.totalAmount));
  assert.ok(Number.isInteger(totals.shippingFee));
});

// ---------------------------------------------------------------- address/misc

test("validateShippingAddress normalises a valid address", () => {
  const result = validateShippingAddress({
    fullName: "  Ayesha Khan ",
    phone: "0300 1234567",
    email: "  AYESHA@Example.COM ",
    addressLine1: " House 12 ",
    addressLine2: " Street 4 ",
    city: " Lahore ",
    state: " Punjab ",
    postalCode: " 54000 ",
  });

  assert.deepEqual(result.value, {
    fullName: "Ayesha Khan",
    phone: "0300 1234567",
    email: "ayesha@example.com",
    addressLine1: "House 12",
    addressLine2: "Street 4",
    city: "Lahore",
    state: "Punjab",
    postalCode: "54000",
    country: "Pakistan",
  });
});

test("validateShippingAddress falls back to the signed-in email", () => {
  const result = validateShippingAddress(
    { fullName: "Ali", phone: "03001234567", addressLine1: "A", city: "Karachi" },
    "ali@example.com"
  );
  assert.equal(result.value.email, "ali@example.com");
});

test("validateShippingAddress rejects each missing field", () => {
  const valid = {
    fullName: "Ali",
    phone: "03001234567",
    email: "ali@example.com",
    addressLine1: "House 1",
    city: "Karachi",
  };

  const cases = [
    ["fullName", "recipient's full name"],
    ["phone", "valid phone number"],
    ["email", "valid email address"],
    ["addressLine1", "street address"],
    ["city", "city"],
  ];

  for (const [field, message] of cases) {
    const result = validateShippingAddress({ ...valid, [field]: "" });
    assert.match(result.error, new RegExp(message.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }

  assert.match(validateShippingAddress({ ...valid, phone: "12-34-56" }).error, /valid phone number/);
  assert.match(validateShippingAddress({ ...valid, email: "nope" }).error, /valid email/);
});

test("sanitizePaymentMethod falls back to cash on delivery", () => {
  assert.equal(sanitizePaymentMethod("jazzcash"), "jazzcash");
  assert.equal(sanitizePaymentMethod("bitcoin"), "cod");
  assert.equal(sanitizePaymentMethod(undefined), "cod");
});

test("generateOrderNumber uses the order date and a hex suffix", () => {
  const orderNumber = generateOrderNumber(new Date("2026-11-11T23:59:00Z"));
  assert.match(orderNumber, /^OCT-20261111-[0-9A-F]{4}$/);
});

test("generateOrderNumber is random enough for 50 orders", () => {
  const numbers = new Set(Array.from({ length: 50 }, () => generateOrderNumber()));
  assert.ok(numbers.size >= 48, `expected near-unique numbers, got ${numbers.size}/50`);
});
