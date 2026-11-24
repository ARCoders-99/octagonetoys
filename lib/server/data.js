// lib/server/data.js
// Server-only storefront queries. Pages call these directly instead of making
// HTTP requests to their own API, which is faster and avoids base-URL issues.

import mongoose from "mongoose";
import { connect } from "@/lib/mongoose";
import Product from "@/lib/models/Product";
import Collection from "@/lib/models/Collection";
import Review from "@/lib/models/Review";
import Order from "@/lib/models/Order";
import User from "@/lib/models/User";
import { escapeRegex } from "@/lib/server/api";
import { serialize } from "@/lib/serialize";

const PRODUCT_SORT = {
  featured: { isFeatured: -1, position: 1, createdAt: -1 },
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  name: { name: 1 },
  rating: { ratingAverage: -1, ratingCount: -1 },
};

// Age buckets are derived from the free-form product tags the admin sets.
export const AGE_TAG_PATTERNS = {
  "0-1": [/baby/i, /infant/i, /newborn/i, /\bages?\s*0\b/i, /18\s*months/i],
  "1-3": [/toddler/i, /\bages?\s*1\b/i, /\bages?\s*2\b/i, /18\s*months/i],
  "3-6": [/preschool/i, /\bages?\s*3\b/i, /\bages?\s*4\b/i, /\bages?\s*5\b/i],
  "6-plus": [/\bages?\s*6\b/i, /\bages?\s*7\b/i, /\bages?\s*8\b/i, /\bages?\s*9\b/i, /\bages?\s*1[0-2]\b/i, /big kid/i],
};

export const AGE_BUCKET_LABELS = {
  "0-1": "0 – 1 years",
  "1-3": "1 – 3 years",
  "3-6": "3 – 6 years",
  "6-plus": "6+ years",
};

export async function getFeaturedProducts(limit = 8) {
  await connect();
  const products = await Product.find({ isActive: true, isDeleted: false, isFeatured: true })
    .sort({ position: 1, createdAt: -1 })
    .limit(limit)
    .lean();
  return serialize(products);
}

export async function getNewArrivals(limit = 8) {
  await connect();
  const products = await Product.find({ isActive: true, isDeleted: false })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  return serialize(products);
}

export async function getSaleProducts(limit = 8) {
  await connect();
  const now = new Date();
  const products = await Product.find({
    isActive: true,
    isDeleted: false,
    salePrice: { $ne: null, $gt: 0 },
    $and: [
      { $or: [{ saleStart: null }, { saleStart: { $lte: now } }] },
      { $or: [{ saleEnd: null }, { saleEnd: { $gte: now } }] },
    ],
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  return serialize(products);
}

export async function getActiveCollections({ limit = 12, featuredOnly = false } = {}) {
  await connect();

  const query = { isDeleted: false, isActive: true };
  if (featuredOnly) query.isFeatured = true;

  const collections = await Collection.find(query)
    .sort({ position: 1, createdAt: -1 })
    .limit(limit)
    .lean();

  if (!collections.length) return [];

  const counts = await Product.aggregate([
    {
      $match: {
        isDeleted: false,
        isActive: true,
        collectionIds: { $in: collections.map((collection) => collection._id) },
      },
    },
    { $unwind: "$collectionIds" },
    { $group: { _id: "$collectionIds", count: { $sum: 1 } } },
  ]);

  const countMap = new Map(counts.map((item) => [String(item._id), item.count]));

  return serialize(
    collections.map((collection) => ({
      ...collection,
      productCount: countMap.get(String(collection._id)) || 0,
    }))
  );
}

export async function getStorefrontProducts({
  q = "",
  collection = "",
  sort = "featured",
  minPrice = null,
  maxPrice = null,
  inStock = false,
  age = "",
  page = 1,
  limit = 12,
  featured = false,
} = {}) {
  await connect();

  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(48, Math.max(1, Number(limit) || 12));
  const skip = (safePage - 1) * safeLimit;

  const query = { isActive: true, isDeleted: false };
  let activeCollection = null;

  if (q) {
    const regex = new RegExp(escapeRegex(String(q).trim()), "i");
    query.$or = [
      { name: regex },
      { shortDescription: regex },
      { description: regex },
      { tags: regex },
      { sku: regex },
    ];
  }

  if (collection) {
    activeCollection = await Collection.findOne({
      slug: String(collection).toLowerCase(),
      isDeleted: false,
      isActive: true,
    })
      .select("_id name slug")
      .lean();

    if (!activeCollection) {
      return {
        products: [],
        total: 0,
        page: safePage,
        limit: safeLimit,
        totalPages: 1,
        collection: null,
      };
    }
    query.collectionIds = activeCollection._id;
  }

  if (featured) query.isFeatured = true;
  if (inStock) query.stock = { $gt: 0 };

  const agePatterns = AGE_TAG_PATTERNS[String(age)];
  if (agePatterns) {
    const ageMatch = agePatterns.map((pattern) => ({ tags: pattern }));
    if (query.$or) {
      // Keep both the text search and the age filter.
      query.$and = [{ $or: query.$or }, { $or: ageMatch }];
      delete query.$or;
    } else {
      query.$or = ageMatch;
    }
  }

  if (minPrice !== null || maxPrice !== null) {
    query.price = {};
    if (minPrice !== null) query.price.$gte = Number(minPrice);
    if (maxPrice !== null) query.price.$lte = Number(maxPrice);
  }

  const sortClause = PRODUCT_SORT[sort] || PRODUCT_SORT.featured;
  const [products, total] = await Promise.all([
    Product.find(query).sort(sortClause).skip(skip).limit(safeLimit).lean(),
    Product.countDocuments(query),
  ]);

  return {
    products: serialize(products),
    total,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    collection: activeCollection ? serialize(activeCollection) : null,
  };
}

export async function getProductBySlug(slug) {
  await connect();

  const product = await Product.findOne({
    slug: String(slug || "").toLowerCase(),
    isActive: true,
    isDeleted: false,
  }).lean();

  if (!product) return null;

  const [collections, reviews] = await Promise.all([
    product.collectionIds?.length
      ? Collection.find({ _id: { $in: product.collectionIds }, isDeleted: false })
          .select("name slug")
          .lean()
      : [],
    Review.find({ productId: product._id, isApproved: true, isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean(),
  ]);

  return {
    product: serialize(product),
    collections: serialize(collections),
    reviews: serialize(reviews),
  };
}

export async function getRelatedProducts(product, limit = 4) {
  if (!product) return [];
  await connect();

  const baseQuery = { _id: { $ne: new mongoose.Types.ObjectId(product._id) }, isActive: true, isDeleted: false };
  let query = { ...baseQuery };

  if (product.collectionIds?.length) {
    query.collectionIds = { $in: product.collectionIds };
  }

  let products = await Product.find(query).sort({ isFeatured: -1, createdAt: -1 }).limit(limit).lean();

  if (!products.length && query.collectionIds) {
    products = await Product.find(baseQuery).sort({ createdAt: -1 }).limit(limit).lean();
  }

  return serialize(products);
}

export async function getCollectionBySlug(slug) {
  await connect();

  const collection = await Collection.findOne({
    slug: String(slug || "").toLowerCase(),
    isDeleted: false,
    isActive: true,
  }).lean();

  if (!collection) return null;

  let products = [];

  if (collection.products?.length) {
    const ids = collection.products.map((item) => item.productId);
    const found = await Product.find({
      _id: { $in: ids },
      isActive: true,
      isDeleted: false,
    }).lean();

    const productMap = new Map(found.map((product) => [String(product._id), product]));
    products = collection.products
      .map((item, index) => {
        const product = productMap.get(String(item.productId));
        if (!product) return null;
        return { ...product, collectionPosition: item.position ?? index };
      })
      .filter(Boolean)
      .sort((a, b) => a.collectionPosition - b.collectionPosition);
  } else {
    products = await Product.find({
      collectionIds: collection._id,
      isActive: true,
      isDeleted: false,
    })
      .sort({ position: 1, createdAt: -1 })
      .lean();
  }

  return {
    collection: serialize(collection),
    products: serialize(products),
  };
}

export async function getStorefrontCollections() {
  return getActiveCollections({ limit: 20 });
}

/** Fetch a single order for the confirmation page. Requires a matching token. */
export async function getOrderForCustomer(orderNumber, accessToken) {
  if (!orderNumber || !accessToken) return null;
  await connect();

  const order = await Order.findOne({
    orderNumber: String(orderNumber).trim().toUpperCase(),
    accessToken: String(accessToken),
    isDeleted: false,
  }).lean();

  return order ? serialize(order) : null;
}

/** Orders belonging to a signed-in customer, newest first. */
export async function getCustomerOrders(customerId, limit = 20) {
  if (!customerId || !mongoose.Types.ObjectId.isValid(customerId)) return [];
  await connect();

  const orders = await Order.find({ customerId, isDeleted: false })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return serialize(orders);
}

/** Profile + order history for the account dashboard. */
export async function getAccountData(customerId) {
  if (!customerId || !mongoose.Types.ObjectId.isValid(customerId)) return null;
  await connect();

  const user = await User.findOne({ _id: customerId, isDeleted: false })
    .select("-passwordHash")
    .lean();

  if (!user) return null;

  const orders = await getCustomerOrders(customerId);

  return { user: serialize(user), orders };
}

/** Lightweight profile lookup used to prefill checkout for signed-in customers. */
export async function getCustomerProfile(customerId) {
  if (!customerId || !mongoose.Types.ObjectId.isValid(customerId)) return null;
  await connect();

  const user = await User.findOne({ _id: customerId, isDeleted: false })
    .select("name firstName lastName email phone addressBook")
    .lean();

  return user ? serialize(user) : null;
}
