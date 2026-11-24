import mongoose from "mongoose";

const { Schema } = mongoose;

const messageSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, default: "", trim: true },
    subject: { type: String, default: "", trim: true },
    message: { type: String, required: true, trim: true },
    isRead: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    emailSentAt: { type: Date, default: null },
  },
  { timestamps: true }
);

messageSchema.index({ isDeleted: 1, isRead: 1, createdAt: -1 });
messageSchema.index({ email: 1, createdAt: -1 });

const Message = mongoose.models.Message || mongoose.model("Message", messageSchema);

export default Message;
export { Message };
