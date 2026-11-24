// Shared business constants. Safe to import on both server and client.

export const STORE_NAME = "Octagontoys";
export const STORE_TAGLINE = "Toys that spark big imaginations";
export const STORE_EMAIL = process.env.NEXT_PUBLIC_STORE_EMAIL || "octagontoys1@gmail.com";
export const STORE_PHONE = process.env.NEXT_PUBLIC_STORE_PHONE || "+92 320 7302842";
export const STORE_ADDRESS = "Sahiwal, Pakistan";
export const STORE_WHATSAPP = process.env.NEXT_PUBLIC_STORE_WHATSAPP || STORE_PHONE;

// Official store profiles. Overridable from the admin Settings page.
export const SOCIAL_LINKS = {
  instagram: "https://www.instagram.com/octagontoys",
  youtube: "https://youtube.com/@octagontoys",
  facebook: "https://www.facebook.com/share/1CEjD3eq37/",
  tiktok: "https://www.tiktok.com/@octagontoys.com",
};

export const CURRENCY = "PKR";
export const CURRENCY_LOCALE = "en-PK";

// All money values are integers in paisa (1 PKR = 100 paisa).
export const SHIPPING_FEE = 25000; // Rs 250
export const FREE_SHIPPING_THRESHOLD = 399900; // Rs 3,999
export const LOW_STOCK_DEFAULT = 5;

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

export const PAYMENT_STATUSES = ["unpaid", "paid", "refunded"];

export const PAYMENT_METHODS = [
  "cod",
  "card",
  "bank_transfer",
  "jazzcash",
  "easypaisa",
];

export const ORDER_STATUS_LABELS = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const MAX_PRODUCT_IMAGES = 6;
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

/**
 * Fallback store settings used before the database value is read and when a
 * field has not been saved yet. Kept in a plain module so both the server and
 * client can import it.
 */
export const DEFAULT_STORE_SETTINGS = {
  storeName: STORE_NAME,
  storeEmail: STORE_EMAIL,
  storePhone: STORE_PHONE,
  whatsappNumber: STORE_WHATSAPP,
  storeAddress: STORE_ADDRESS,
  shippingFee: SHIPPING_FEE,
  freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
  socialLinks: { ...SOCIAL_LINKS },
};
