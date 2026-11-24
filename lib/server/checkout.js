// lib/server/checkout.js
// Authoritative checkout rules with no database access, so the money maths can
// be unit tested and the same logic can be shared with the discount preview.
//
// Every amount here is an integer number of paisa.

import crypto from "crypto";
import {
  FREE_SHIPPING_THRESHOLD,
  PAYMENT_METHODS,
  SHIPPING_FEE,
} from "../constants.js";
import { effectivePrice } from "../format.js";
import { isValidObjectId } from "./validation.js";

/** Merge duplicate ids and clamp quantities into the supported range. */
export function normalizeCartItems(rawItems) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return { error: "Your cart is empty" };
  }

  const merged = new Map();
  for (const item of rawItems) {
    const id = String(item?.productId || item?._id || "");
    if (!isValidObjectId(id)) {
      return { error: "Your cart contains an invalid product" };
    }
    const quantity = Math.max(1, Math.min(99, Math.round(Number(item.quantity) || 1)));
    merged.set(id, (merged.get(id) || 0) + quantity);
  }

  return { items: [...merged.entries()].map(([id, quantity]) => ({ id, quantity })) };
}

/**
 * Build trusted order lines from database products. Client prices are never
 * used: the price comes from `effectivePrice(product)`.
 */
export function buildOrderItems({ items = [], productMap }) {
  const orderItems = [];
  let subtotal = 0;

  for (const { id, quantity } of items) {
    const product = productMap.get(id);
    if (!product) {
      return { error: "A product in your cart is unavailable", status: 409 };
    }
    if (Number(product.stock) < quantity) {
      return { error: `Only ${product.stock} left of "${product.name}"`, status: 409 };
    }

    const price = effectivePrice(product);
    if (!price || price <= 0) {
      return { error: `"${product.name}" does not have a valid price`, status: 409 };
    }

    subtotal += price * quantity;
    orderItems.push({
      productId: product._id,
      title: product.name,
      slug: product.slug,
      price,
      image: product.images?.[0]?.url || "",
      quantity,
      sku: product.sku || "",
    });
  }

  return { items: orderItems, subtotal };
}

/**
 * Check a discount against the current subtotal and return either an error
 * message or the integer paisa amount it takes off.
 */
export function evaluateDiscount({ discount, subtotal, now = new Date() } = {}) {
  if (!discount) return { error: "That discount code is not valid" };

  if (discount.startsAt && new Date(discount.startsAt) > now) {
    return { error: "This discount code is not active yet" };
  }
  if (discount.endsAt && new Date(discount.endsAt) < now) {
    return { error: "This discount code has expired" };
  }
  if (discount.usageLimit != null && discount.usedCount >= discount.usageLimit) {
    return { error: "This discount code has reached its usage limit" };
  }
  if (subtotal < Number(discount.minSubtotal || 0)) {
    return { error: "Your order does not meet the minimum spend for this code" };
  }

  const value = Number(discount.discountValue) || 0;
  const raw =
    discount.discountType === "percentage"
      ? Math.round((subtotal * Math.min(100, value)) / 100)
      : Math.min(subtotal, value);

  // A discount can never exceed the subtotal.
  return { amount: Math.max(0, Math.min(subtotal, raw)) };
}

/** Free shipping once the subtotal clears the threshold. */
export function calculateShipping(subtotal, settings = {}) {
  const threshold = Number(settings.freeShippingThreshold);
  const fee = Number(settings.shippingFee);
  const limit = Number.isFinite(threshold) && threshold >= 0 ? threshold : FREE_SHIPPING_THRESHOLD;
  const charge = Number.isFinite(fee) && fee >= 0 ? fee : SHIPPING_FEE;
  return subtotal >= limit ? 0 : charge;
}

export function calculateTotals({ subtotal, discountAmount = 0, settings = {} }) {
  const shippingFee = calculateShipping(subtotal, settings);
  return {
    shippingFee,
    discountAmount,
    totalAmount: Math.max(0, subtotal + shippingFee - discountAmount),
  };
}

export function sanitizePaymentMethod(value) {
  return PAYMENT_METHODS.includes(value) ? value : "cod";
}

export function generateOrderNumber(now = new Date()) {
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const random = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `OCT-${date}-${random}`;
}

export function validateShippingAddress(address = {}, fallbackEmail = "") {
  const fullName = String(address.fullName || "").trim();
  const phone = String(address.phone || "").trim();
  const email = String(address.email || fallbackEmail || "").trim().toLowerCase();
  const addressLine1 = String(address.addressLine1 || "").trim();
  const city = String(address.city || "").trim();

  if (!fullName) return { error: "Please enter the recipient's full name" };
  if (!phone || phone.replace(/\D/g, "").length < 7) {
    return { error: "Please enter a valid phone number" };
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Please enter a valid email address for your receipt" };
  }
  if (!addressLine1) return { error: "Please enter your street address" };
  if (!city) return { error: "Please enter your city" };

  return {
    value: {
      fullName,
      phone,
      email,
      addressLine1,
      addressLine2: String(address.addressLine2 || "").trim(),
      city,
      state: String(address.state || "").trim(),
      postalCode: String(address.postalCode || "").trim(),
      country: String(address.country || "Pakistan").trim() || "Pakistan",
    },
  };
}
