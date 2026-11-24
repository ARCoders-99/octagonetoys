// tests/settings.test.js
// Pure store-settings normalisation.

import test from "node:test";
import assert from "node:assert/strict";

import { DEFAULT_STORE_SETTINGS } from "../lib/constants.js";
import { normalizeSettings } from "../lib/server/settingsRules.js";

test("normalizeSettings falls back to defaults for an empty document", () => {
  const settings = normalizeSettings({});
  assert.equal(settings.storeName, DEFAULT_STORE_SETTINGS.storeName);
  assert.equal(settings.storeEmail, DEFAULT_STORE_SETTINGS.storeEmail);
  assert.equal(settings.shippingFee, DEFAULT_STORE_SETTINGS.shippingFee);
  assert.equal(settings.freeShippingThreshold, DEFAULT_STORE_SETTINGS.freeShippingThreshold);
  assert.deepEqual(settings.socialLinks, DEFAULT_STORE_SETTINGS.socialLinks);
});

test("normalizeSettings trims text and blanks fall back to defaults", () => {
  const settings = normalizeSettings({
    storeName: "  Octagon Toys  ",
    storeEmail: "  hello@example.com ",
    storePhone: "   ",
    storeAddress: "\nKarachi\n",
  });

  assert.equal(settings.storeName, "Octagon Toys");
  assert.equal(settings.storeEmail, "hello@example.com");
  assert.equal(settings.storePhone, DEFAULT_STORE_SETTINGS.storePhone);
  assert.equal(settings.storeAddress, "Karachi");
});

test("normalizeSettings keeps money as integer paisa", () => {
  const settings = normalizeSettings({
    shippingFee: 250.6,
    freeShippingThreshold: "399900",
  });

  assert.equal(settings.shippingFee, 251);
  assert.equal(settings.freeShippingThreshold, 399900);
  assert.ok(Number.isInteger(settings.shippingFee));
});

test("normalizeSettings rejects invalid money values", () => {
  const settings = normalizeSettings({
    shippingFee: -10,
    freeShippingThreshold: "not-a-number",
  });

  assert.equal(settings.shippingFee, DEFAULT_STORE_SETTINGS.shippingFee);
  assert.equal(settings.freeShippingThreshold, DEFAULT_STORE_SETTINGS.freeShippingThreshold);
});

test("normalizeSettings merges social links one network at a time", () => {
  const settings = normalizeSettings({
    socialLinks: { instagram: "https://instagram.com/octagontoys", tiktok: "" },
  });

  assert.equal(settings.socialLinks.instagram, "https://instagram.com/octagontoys");
  assert.equal(settings.socialLinks.tiktok, DEFAULT_STORE_SETTINGS.socialLinks.tiktok);
  assert.equal(settings.socialLinks.youtube, DEFAULT_STORE_SETTINGS.socialLinks.youtube);
  assert.equal(settings.socialLinks.facebook, DEFAULT_STORE_SETTINGS.socialLinks.facebook);
});
