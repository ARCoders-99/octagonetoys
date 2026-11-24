// lib/server/settingsRules.js
// Pure store-settings normalisation. Imported by `settings.js` at runtime and
// directly by the unit tests (no Next.js or database imports here).

import { DEFAULT_STORE_SETTINGS } from "../constants.js";

const TEXT_FIELDS = [
  "storeName",
  "storeEmail",
  "storePhone",
  "whatsappNumber",
  "storeAddress",
];

export const SOCIAL_FIELDS = ["instagram", "youtube", "facebook", "tiktok"];

function text(value, fallback) {
  const trimmed = String(value ?? "").trim();
  return trimmed || fallback;
}

function paisa(value, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) return fallback;
  return Math.round(number);
}

/** Merge a stored document (or partial payload) with the defaults. */
export function normalizeSettings(raw = {}) {
  const base = DEFAULT_STORE_SETTINGS;
  const source = raw || {};

  const socialSource = source.socialLinks || {};
  const socialLinks = {};
  for (const network of SOCIAL_FIELDS) {
    socialLinks[network] = text(socialSource[network], base.socialLinks[network] || "");
  }

  const result = {
    shippingFee: paisa(source.shippingFee, base.shippingFee),
    freeShippingThreshold: paisa(
      source.freeShippingThreshold,
      base.freeShippingThreshold
    ),
    socialLinks,
  };

  for (const field of TEXT_FIELDS) {
    result[field] = text(source[field], base[field]);
  }

  return result;
}
