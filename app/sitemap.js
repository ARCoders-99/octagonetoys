// app/sitemap.js
// Generates sitemap.xml from the live catalogue. Static pages are always
// included; products and collections are added when the database responds.
// Keeping this dynamic means a deploy does not need database access at build.

import { connect } from "@/lib/mongoose";
import Product from "@/lib/models/Product";
import Collection from "@/lib/models/Collection";

export const dynamic = "force-dynamic";

const BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000").replace(
  /\/$/,
  ""
);

const STATIC_ROUTES = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/shop", changeFrequency: "daily", priority: 0.9 },
  { path: "/collections", changeFrequency: "weekly", priority: 0.8 },
  { path: "/about", changeFrequency: "monthly", priority: 0.5 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.5 },
  { path: "/policies/privacy-policy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/policies/returns-policy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/policies/shipping-policy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/policies/terms", changeFrequency: "yearly", priority: 0.3 },
];

function absoluteUrl(value) {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return `${BASE_URL}${value.startsWith("/") ? "" : "/"}${value}`;
}

function imageUrls(product) {
  return (product.images || [])
    .map((image) => absoluteUrl(image?.url))
    .filter(Boolean);
}

export default async function sitemap() {
  const entries = STATIC_ROUTES.map((route) => ({
    url: `${BASE_URL}${route.path}`,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  try {
    await connect();

    const [products, collections] = await Promise.all([
      Product.find({ isActive: true, isDeleted: false })
        .select("slug images updatedAt")
        .sort({ updatedAt: -1 })
        .lean(),
      Collection.find({ isActive: true, isDeleted: false })
        .select("slug updatedAt")
        .sort({ position: 1 })
        .lean(),
    ]);

    for (const collection of collections) {
      entries.push({
        url: `${BASE_URL}/collections/${collection.slug}`,
        lastModified: collection.updatedAt || new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }

    for (const product of products) {
      if (!product.slug) continue;
      const entry = {
        url: `${BASE_URL}/product/${product.slug}`,
        lastModified: product.updatedAt || new Date(),
        changeFrequency: "weekly",
        priority: 0.6,
      };
      const images = imageUrls(product);
      if (images.length) entry.images = images;
      entries.push(entry);
    }
  } catch (error) {
    // Never fail the whole sitemap because the catalogue is temporarily down.
    console.error("Sitemap data error:", error.message);
  }

  return entries;
}
