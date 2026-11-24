// lib/server/rating.js
// Recalculates the denormalised rating fields on a product.

import mongoose from "mongoose";
import { connect } from "@/lib/mongoose";
import Review from "@/lib/models/Review";
import Product from "@/lib/models/Product";

export async function recalculateProductRating(productId) {
  if (!mongoose.Types.ObjectId.isValid(productId)) return null;

  await connect();

  const objectId = new mongoose.Types.ObjectId(productId);
  const [result] = await Review.aggregate([
    { $match: { productId: objectId, isApproved: true, isDeleted: false } },
    {
      $group: {
        _id: null,
        average: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);

  const ratingAverage = result ? Math.round(result.average * 10) / 10 : 0;
  const ratingCount = result?.count || 0;

  await Product.updateOne(
    { _id: objectId },
    { $set: { ratingAverage, ratingCount } }
  );

  return { ratingAverage, ratingCount };
}
