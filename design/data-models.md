# Data Model Design (Mongoose Schemas)

## User
```js
import { Schema, model } from "mongoose";

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    firstName: { type: String },
    lastName: { type: String },
    role: { type: String, enum: ["admin", "customer"], default: "customer" },
    addressBook: [
      {
        label: String,
        line1: String,
        line2: String,
        city: String,
        state: String,
        zip: String,
        country: String,
        phone: String,
      },
    ],
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const User = model("User", userSchema);
```

---

## Product
```js
import { Schema, model } from "mongoose";

const productSchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, trim: true },
    sku: { type: String, unique: true, sparse: true },
    shortDescription: { type: String },
    description: { type: String },
    price: { type: Number, required: true }, // integer (smallest currency unit)
    salePrice: { type: Number },
    saleStart: { type: Date },
    saleEnd: { type: Date },
    images: [
      {
        url: { type: String, required: true },
        alt: { type: String },
      },
    ],
    stock: { type: Number, default: 0 },
    lowStockThreshold: { type: Number, default: 5 },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    collectionIds: [{ type: Schema.Types.ObjectId, ref: "Collection" }],
    tags: [String],
    isDeleted: { type: Boolean, default: false },
    position: { type: Number, default: 0 },
    metaTitle: { type: String },
    metaDescription: { type: String },
    metaKeywords: [String],
  },
  { timestamps: true }
);

export const Product = model("Product", productSchema);
```

---

## Collection
```js
import { Schema, model } from "mongoose";

const collectionSchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, trim: true },
    // Optional per‑collection ordering of products
    products: [
      {
        productId: { type: Schema.Types.ObjectId, ref: "Product" },
        position: { type: Number, default: 0 },
      },
    ],
    isDeleted: { type: Boolean, default: false },
    position: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Collection = model("Collection", collectionSchema);
```

---

### Design Decisions
- Integer pricing (store money as smallest unit).
- Soft‑delete (`isDeleted`).
- `timestamps: true` for audit fields.
- Simple integer `position` for ordering.
- Relations via `collectionIds` on Product and optional ordered `products` array on Collection.
- Dynamic calculations (ratings, sales totals) will be done with aggregations, not stored.
