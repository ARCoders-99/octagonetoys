// tests/models.test.js
// Schema-level guarantees. These run without a database: Mongoose validates
// documents locally, which is enough to pin the money and snapshot rules.

import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";

import Product from "../lib/models/Product.js";
import Order from "../lib/models/Order.js";
import Discount from "../lib/models/Discount.js";

// ------------------------------------------------------------------- product

const makeProduct = (overrides = {}) =>
  new Product({ name: "Toy Car", slug: "toy-car", price: 129900, ...overrides });

test("product stores whole-paisa prices only", () => {
  assert.equal(makeProduct().validateSync(), undefined);

  const fractional = makeProduct({ price: 1299.5 }).validateSync();
  assert.equal(fractional.errors.price.message, "Price must be an integer in paisa");

  const negative = makeProduct({ price: -1 }).validateSync();
  assert.ok(negative.errors.price);
});

test("product sale price must be an integer or null", () => {
  assert.equal(makeProduct({ salePrice: null }).validateSync(), undefined);
  assert.equal(makeProduct({ salePrice: 99900 }).validateSync(), undefined);
  assert.equal(
    makeProduct({ salePrice: 999.5 }).validateSync().errors.salePrice.message,
    "Sale price must be an integer in paisa"
  );
});

test("product defaults are storefront-safe", () => {
  const product = makeProduct();
  assert.equal(product.stock, 0);
  assert.equal(product.isActive, true);
  assert.equal(product.isDeleted, false);
  assert.equal(product.isFeatured, false);
  assert.deepEqual(product.images, []);
});

test("product slug is lowercased", () => {
  assert.equal(new Product({ name: "X", slug: "Toy-Car", price: 100 }).slug, "toy-car");
});

test("product rejects fractional stock", () => {
  const error = makeProduct({ stock: 1.5 }).validateSync();
  assert.equal(error.errors.stock.message, "Stock must be an integer");
});

// --------------------------------------------------------------------- order

const makeOrder = (overrides = {}) =>
  new Order({
    orderNumber: "OCT-20261111-ABCD",
    accessToken: "access-token-123",
    items: [
      {
        productId: new mongoose.Types.ObjectId(),
        title: "Turbo Stunt RC Car",
        slug: "turbo-stunt-rc-car",
        price: 129900,
        image: "https://cdn.example.com/car.jpg",
        quantity: 2,
        sku: "TOY-RC-01",
      },
    ],
    shippingAddress: {
      fullName: "Ayesha Khan",
      phone: "03001234567",
      email: "ayesha@example.com",
      addressLine1: "House 12",
      city: "Lahore",
    },
    subtotal: 259800,
    shippingFee: 25000,
    totalAmount: 284800,
    ...overrides,
  });

test("a complete order validates", () => {
  assert.equal(makeOrder().validateSync(), undefined);
});

test("order defaults keep new orders unfulfilled and unpaid", () => {
  const order = makeOrder();
  assert.equal(order.status, "pending");
  assert.equal(order.paymentStatus, "unpaid");
  assert.equal(order.paymentMethod, "cod");
  assert.equal(order.currency, "PKR");
  assert.equal(order.discountAmount, 0);
  assert.equal(order.inventoryRestored, false);
  assert.equal(order.isDeleted, false);
});

test("order keeps its own product snapshot", () => {
  const order = makeOrder();
  const [item] = order.items;

  assert.equal(item.title, "Turbo Stunt RC Car");
  assert.equal(item.price, 129900);
  assert.equal(item.image, "https://cdn.example.com/car.jpg");
  assert.equal(item.quantity, 2);

  // Mutating a product later cannot touch the stored snapshot.
  item.title = "Renamed later";
  assert.equal(order.items[0].title, "Renamed later");
  assert.equal(makeOrder().items[0].title, "Turbo Stunt RC Car");
});

test("order item prices must be whole paisa", () => {
  const error = makeOrder({
    items: [
      {
        productId: new mongoose.Types.ObjectId(),
        title: "Car",
        price: 1299.5,
        quantity: 1,
      },
    ],
  }).validateSync();

  assert.equal(error.errors["items.0.price"].message, "Item price must be integer paisa");
});

test("order quantities must be positive integers", () => {
  const baseItem = {
    productId: new mongoose.Types.ObjectId(),
    title: "Car",
    price: 129900,
  };

  assert.ok(makeOrder({ items: [{ ...baseItem, quantity: 0 }] }).validateSync());
  assert.ok(makeOrder({ items: [{ ...baseItem, quantity: 1.5 }] }).validateSync());
  assert.equal(makeOrder({ items: [{ ...baseItem, quantity: 3 }] }).validateSync(), undefined);
});

test("order requires identity, items and a shipping address", () => {
  assert.ok(makeOrder({ orderNumber: "" }).validateSync().errors.orderNumber);
  assert.ok(makeOrder({ accessToken: "" }).validateSync().errors.accessToken);
  assert.ok(makeOrder({ items: [] }).validateSync().errors.items);

  const addressErrors = makeOrder({ shippingAddress: {} }).validateSync().errors;
  assert.ok(
    Object.keys(addressErrors).some((key) => key.startsWith("shippingAddress.")),
    `expected shipping address errors, got ${Object.keys(addressErrors).join(", ")}`
  );
});

test("order rejects unknown statuses", () => {
  assert.ok(makeOrder({ status: "lost" }).validateSync().errors.status);
  assert.ok(makeOrder({ paymentStatus: "maybe" }).validateSync().errors.paymentStatus);
});

test("order requires non-negative money fields", () => {
  assert.ok(makeOrder({ subtotal: -1 }).validateSync().errors.subtotal);
  assert.ok(makeOrder({ totalAmount: -1 }).validateSync().errors.totalAmount);
});

// ------------------------------------------------------------------ discount

const makeDiscount = (overrides = {}) =>
  new Discount({
    code: "welcome10",
    discountType: "percentage",
    discountValue: 10,
    ...overrides,
  });

test("discount uppercases its code and starts unused", () => {
  const discount = makeDiscount();
  assert.equal(discount.code, "WELCOME10");
  assert.equal(discount.usedCount, 0);
  assert.equal(discount.isActive, true);
  assert.equal(discount.isDeleted, false);
});

test("discount rejects unknown types and fractional values", () => {
  assert.ok(makeDiscount({ discountType: "bogus" }).validateSync().errors.discountType);
  assert.ok(makeDiscount({ discountValue: 10.5 }).validateSync().errors.discountValue);
  assert.equal(makeDiscount({ discountType: "fixed", discountValue: 50000 }).validateSync(), undefined);
});
