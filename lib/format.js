import { CURRENCY, CURRENCY_LOCALE } from "./constants.js";

/** Format an integer paisa amount as PKR. */
export function formatPrice(amountInPaisa = 0) {
  const value = (Number(amountInPaisa) || 0) / 100;
  return new Intl.NumberFormat(CURRENCY_LOCALE, {
    style: "currency",
    currency: CURRENCY,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value = 0) {
  return new Intl.NumberFormat(CURRENCY_LOCALE).format(Number(value) || 0);
}

export function formatDate(value, options = {}) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(CURRENCY_LOCALE, {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options,
  }).format(new Date(value));
}

export function formatDateTime(value) {
  return formatDate(value, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Returns true when a sale price is currently active. */
export function isSaleActive(product, now = new Date()) {
  if (!product || product.salePrice == null) return false;
  if (product.saleStart && new Date(product.saleStart) > now) return false;
  if (product.saleEnd && new Date(product.saleEnd) < now) return false;
  return Number(product.salePrice) < Number(product.price);
}

/** Current selling price in paisa. */
export function effectivePrice(product) {
  if (!product) return 0;
  return isSaleActive(product) ? Number(product.salePrice) : Number(product.price) || 0;
}

/** Percentage saved, e.g. 20 for 20% off. */
export function salePercent(product) {
  if (!isSaleActive(product)) return 0;
  const price = Number(product.price) || 0;
  if (price <= 0) return 0;
  return Math.round(((price - Number(product.salePrice)) / price) * 100);
}

export function stockLabel(stock, lowStockThreshold = 5) {
  const value = Number(stock) || 0;
  if (value <= 0) return { label: "Out of stock", tone: "danger" };
  if (value <= (Number(lowStockThreshold) || 5)) {
    return { label: `Only ${value} left`, tone: "warning" };
  }
  return { label: "In stock", tone: "success" };
}

export function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
