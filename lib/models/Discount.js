import mongoose from "mongoose";

const { Schema } = mongoose;

const discountSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    description: { type: String, default: "", trim: true },
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
    },
    // percentage: whole percent (10 = 10%). fixed: integer paisa.
    discountValue: {
      type: Number,
      required: true,
      min: 0,
      validate: { validator: Number.isInteger, message: "Discount value must be an integer" },
    },
    minSubtotal: { type: Number, default: 0, min: 0 },
    startsAt: { type: Date, default: null },
    endsAt: { type: Date, default: null },
    usageLimit: { type: Number, default: null, min: 0 },
    usedCount: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

discountSchema.index({ code: 1, isDeleted: 1 });
discountSchema.index({ isActive: 1, startsAt: 1, endsAt: 1 });

const Discount = mongoose.models.Discount || mongoose.model("Discount", discountSchema);

export default Discount;
export { Discount };
