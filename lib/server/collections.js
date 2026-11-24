// lib/server/collections.js
// Keeps Product.collectionIds and Collection.products in sync.

import mongoose from "mongoose";
import { connect } from "@/lib/mongoose";
import Collection from "@/lib/models/Collection";
import Product from "@/lib/models/Product";

function validIds(ids = []) {
  return [...new Set(ids.map(String).filter((id) => mongoose.Types.ObjectId.isValid(id)))];
}

/** Called when a product's collection membership changes. */
export async function syncProductCollections(productId, collectionIds = []) {
  if (!mongoose.Types.ObjectId.isValid(productId)) return;
  await connect();

  const ids = validIds(collectionIds);
  const productObjectId = new mongoose.Types.ObjectId(productId);

  await Collection.updateMany(
    { _id: { $nin: ids }, "products.productId": productObjectId },
    { $pull: { products: { productId: productObjectId } } }
  );

  if (!ids.length) return;

  const collections = await Collection.find({ _id: { $in: ids } })
    .select("_id products")
    .lean();

  const bulk = collections.map((collection) => {
    const exists = collection.products?.some(
      (item) => String(item.productId) === String(productId)
    );
    if (exists) return null;
    return {
      updateOne: {
        filter: { _id: collection._id },
        update: { $push: { products: { productId: productObjectId, position: 0 } } },
      },
    };
  }).filter(Boolean);

  if (bulk.length) await Collection.bulkWrite(bulk);
}

/** Called when a collection's ordered product list changes. */
export async function syncCollectionProducts(collectionId, productIds = []) {
  if (!mongoose.Types.ObjectId.isValid(collectionId)) return;
  await connect();

  const collectionObjectId = new mongoose.Types.ObjectId(collectionId);
  const existing = await Collection.findById(collectionObjectId).select("products").lean();
  const oldIds = new Set((existing?.products || []).map((item) => String(item.productId)));
  const newIds = validIds(productIds);
  const newIdSet = new Set(newIds);

  const added = newIds.filter((id) => !oldIds.has(id));
  const removed = [...oldIds].filter((id) => !newIdSet.has(id));

  if (added.length) {
    await Product.updateMany(
      { _id: { $in: added } },
      { $addToSet: { collectionIds: collectionObjectId } }
    );
  }
  if (removed.length) {
    await Product.updateMany(
      { _id: { $in: removed } },
      { $pull: { collectionIds: collectionObjectId } }
    );
  }
}
