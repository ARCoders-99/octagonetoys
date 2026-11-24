// app/api/reviews/route.js
// Public review submission. New reviews wait for admin approval.

import mongoose from "mongoose";
import { connect } from "@/lib/mongoose";
import Review from "@/lib/models/Review";
import Product from "@/lib/models/Product";
import { getOptionalAuthPayload } from "@/lib/middleware/auth";
import { jsonOk, jsonError, handleApiError, isValidObjectId } from "@/lib/server/api";
import { enforceRateLimit } from "@/lib/server/rateLimit";

export async function GET(request) {
  try {
    await connect();
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    if (!isValidObjectId(productId)) {
      return jsonError("A valid productId is required", 400);
    }

    const reviews = await Review.find({
      productId,
      isApproved: true,
      isDeleted: false,
    })
      .sort({ createdAt: -1 })
      .lean();

    return jsonOk({ reviews });
  } catch (error) {
    return handleApiError(error, "GET /api/reviews");
  }
}

export async function POST(request) {
  const limited = enforceRateLimit(request, {
    bucket: "review-submit",
    limit: 5,
    windowMs: 10 * 60 * 1000,
  });
  if (limited) return limited;

  try {
    await connect();

    const body = await request.json().catch(() => null);
    if (!body) return jsonError("Invalid request body", 400);

    const productId = String(body.productId || "");
    if (!isValidObjectId(productId)) {
      return jsonError("A valid product is required", 400);
    }

    const rating = Number(body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return jsonError("Rating must be between 1 and 5", 400);
    }

    const product = await Product.findOne({
      _id: new mongoose.Types.ObjectId(productId),
      isActive: true,
      isDeleted: false,
    }).select("_id");

    if (!product) {
      return jsonError("Product not found", 404);
    }

    const session = getOptionalAuthPayload(request);
    const authorName = String(body.name || session?.name || "").trim().slice(0, 80);
    if (!authorName) {
      return jsonError("Please enter your name", 400);
    }

    const authorEmail = String(body.email || session?.email || "").trim().toLowerCase().slice(0, 160);
    if (authorEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authorEmail)) {
      return jsonError("Please enter a valid email address", 400);
    }

    const review = await Review.create({
      productId: product._id,
      userId: session?.id && isValidObjectId(session.id) ? session.id : null,
      authorName,
      authorEmail,
      rating,
      title: String(body.title || "").trim().slice(0, 120),
      comment: String(body.comment || "").trim().slice(0, 2000),
      isApproved: false,
    });

    return jsonOk(
      {
        review,
        message: "Thank you! Your review will appear after approval.",
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error, "POST /api/reviews");
  }
}
