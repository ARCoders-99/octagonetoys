import mongoose from "mongoose";

const { Schema } = mongoose;

const orderItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    title: { type: String, required: true, trim: true },
    slug: { type: String, default: "", trim: true },
    price: {
      type: Number,
      required: true,
      min: 0,
      validate: { validator: Number.isInteger, message: "Item price must be integer paisa" },
    },
    image: { type: String, default: "", trim: true },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      validate: { validator: Number.isInteger, message: "Quantity must be an integer" },
    },
    sku: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const shippingAddressSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    addressLine1: { type: String, required: true, trim: true },
    addressLine2: { type: String, default: "", trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, default: "", trim: true },
    postalCode: { type: String, default: "", trim: true },
    country: { type: String, default: "Pakistan", trim: true },
  },
  { _id: false }
);

const statusHistorySchema = new Schema(
  {
    status: { type: String, required: true },
    note: { type: String, default: "", trim: true },
    changedBy: { type: String, default: "system", trim: true },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true, trim: true },
    // Random token lets a guest view their confirmation without an account.
    accessToken: { type: String, required: true, unique: true, trim: true },

    customerId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: [(items) => Array.isArray(items) && items.length > 0, "Order must contain items"],
    },
    shippingAddress: { type: shippingAddressSchema, required: true },

    // Integer paisa amounts.
    subtotal: { type: Number, required: true, min: 0 },
    shippingFee: { type: Number, default: 0, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    discountCode: { type: String, default: null, trim: true, uppercase: true },
    totalAmount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "PKR" },

    status: {
      type: String,
      enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "refunded"],
      default: "unpaid",
    },
    paymentMethod: {
      type: String,
      enum: ["cod", "card", "bank_transfer", "jazzcash", "easypaisa"],
      default: "cod",
    },
    paymentId: { type: String, default: null, trim: true },
    trackingNumber: { type: String, default: null, trim: true },
    carrier: { type: String, default: null, trim: true },
    customerNotes: { type: String, default: "", trim: true },
    adminNotes: { type: String, default: "", trim: true },
    statusHistory: { type: [statusHistorySchema], default: [] },
    emailSentAt: { type: Date, default: null },
    // Guards against restoring stock twice when an order is cancelled.
    inventoryRestored: { type: Boolean, default: false },

    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

orderSchema.index({ customerId: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ "shippingAddress.email": 1 });

const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);

export default Order;
export { Order };
