import mongoose from "mongoose";

const { Schema } = mongoose;

const collectionProductSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    position: { type: Number, default: 0 },
  },
  { _id: false }
);

const collectionSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    description: { type: String, default: "", trim: true },
    image: { type: String, default: "", trim: true },
    products: { type: [collectionProductSchema], default: [] },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    position: { type: Number, default: 0 },
    metaTitle: { type: String, default: "", trim: true },
    metaDescription: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

collectionSchema.index({ isDeleted: 1, isActive: 1, position: 1 });

const Collection =
  mongoose.models.Collection || mongoose.model("Collection", collectionSchema);

export default Collection;
export { Collection };
