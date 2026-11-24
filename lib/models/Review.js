import mongoose from "mongoose";

const { Schema } = mongoose;

const reviewSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    authorName: { type: String, required: true, trim: true },
    authorEmail: { type: String, default: "", trim: true, lowercase: true },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: { validator: Number.isInteger, message: "Rating must be 1-5" },
    },
    title: { type: String, default: "", trim: true },
    comment: { type: String, default: "", trim: true },
    isApproved: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

reviewSchema.index({ productId: 1, isApproved: 1, isDeleted: 1, createdAt: -1 });
reviewSchema.index({ isApproved: 1, isDeleted: 1, createdAt: -1 });

const Review = mongoose.models.Review || mongoose.model("Review", reviewSchema);

export default Review;
export { Review };
