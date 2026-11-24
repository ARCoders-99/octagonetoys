import mongoose from "mongoose";

const { Schema } = mongoose;

const addressSchema = new Schema(
  {
    label: { type: String, default: "Home", trim: true },
    fullName: { type: String, default: "", trim: true },
    phone: { type: String, default: "", trim: true },
    line1: { type: String, required: true, trim: true },
    line2: { type: String, default: "", trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, default: "", trim: true },
    zip: { type: String, default: "", trim: true },
    country: { type: String, default: "Pakistan", trim: true },
  },
  { _id: false }
);

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    firstName: { type: String, default: "", trim: true },
    lastName: { type: String, default: "", trim: true },
    name: { type: String, default: "", trim: true },
    phone: { type: String, default: "", trim: true },
    role: {
      type: String,
      enum: ["admin", "customer"],
      default: "customer",
    },
    addressBook: { type: [addressSchema], default: [] },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },

    // Password reset. Only the hash of the emailed token is stored.
    resetTokenHash: { type: String, default: "", select: false },
    resetTokenExpiresAt: { type: Date, default: null, select: false },
    passwordChangedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

userSchema.index({ role: 1, isDeleted: 1, createdAt: -1 });

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
export { User };
