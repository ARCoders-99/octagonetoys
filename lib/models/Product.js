import mongoose from "mongoose";

const { Schema } = mongoose;

const imageSchema = new Schema(
  {
    url: { type: String, required: true, trim: true },
    alt: { type: String, default: "", trim: true },
    publicId: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const productSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    sku: { type: String, unique: true, sparse: true, trim: true },
    shortDescription: { type: String, default: "", trim: true },
    description: { type: String, default: "", trim: true },

    // Integer paisa values. Never store decimals for money.
    price: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: "Price must be an integer in paisa",
      },
    },
    salePrice: {
      type: Number,
      default: null,
      min: 0,
      validate: {
        validator: (value) => value == null || Number.isInteger(value),
        message: "Sale price must be an integer in paisa",
      },
    },
    saleStart: { type: Date, default: null },
    saleEnd: { type: Date, default: null },

    images: { type: [imageSchema], default: [] },
    stock: {
      type: Number,
      default: 0,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: "Stock must be an integer",
      },
    },
    lowStockThreshold: { type: Number, default: 5, min: 0 },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    collectionIds: [{ type: Schema.Types.ObjectId, ref: "Collection" }],
    tags: { type: [String], default: [] },

    // Denormalised review aggregate, recalculated when reviews are approved.
    ratingAverage: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0, min: 0 },
    soldCount: { type: Number, default: 0, min: 0 },

    isDeleted: { type: Boolean, default: false },
    position: { type: Number, default: 0 },
    metaTitle: { type: String, default: "", trim: true },
    metaDescription: { type: String, default: "", trim: true },
    metaKeywords: { type: [String], default: [] },
  },
  { timestamps: true }
);

productSchema.index({ isDeleted: 1, isActive: 1, isFeatured: 1 });
productSchema.index({ isDeleted: 1, isActive: 1, createdAt: -1 });
productSchema.index({ collectionIds: 1, position: 1 });
productSchema.index({ name: "text", shortDescription: "text", description: "text", tags: "text" });

const Product = mongoose.models.Product || mongoose.model("Product", productSchema);

export default Product;
export { Product };
