import mongoose from "mongoose";

const { Schema } = mongoose;

// Store-wide configuration. There is exactly one document, keyed "store".
const socialSchema = new Schema(
  {
    instagram: { type: String, default: "", trim: true },
    youtube: { type: String, default: "", trim: true },
    facebook: { type: String, default: "", trim: true },
    tiktok: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const settingSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "store" },

    storeName: { type: String, default: "", trim: true },
    storeEmail: { type: String, default: "", trim: true, lowercase: true },
    storePhone: { type: String, default: "", trim: true },
    whatsappNumber: { type: String, default: "", trim: true },
    storeAddress: { type: String, default: "", trim: true },

    // Integer paisa. Never store rupees as decimals.
    shippingFee: {
      type: Number,
      default: 0,
      min: 0,
      validate: { validator: Number.isInteger, message: "Shipping fee must be integer paisa" },
    },
    freeShippingThreshold: {
      type: Number,
      default: 0,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: "Free shipping threshold must be integer paisa",
      },
    },

    socialLinks: { type: socialSchema, default: () => ({}) },
    updatedBy: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

const Setting = mongoose.models.Setting || mongoose.model("Setting", settingSchema);

export default Setting;
export { Setting };
