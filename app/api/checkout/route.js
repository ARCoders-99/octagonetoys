// app/api/checkout/route.js
// Guest + customer checkout. Never trusts client prices: every total is
// recalculated from the database before the order is created.
//
// The pricing rules live in lib/server/checkout.js so they can be unit tested.

import crypto from "crypto";
import mongoose from "mongoose";
import { connect } from "@/lib/mongoose";
import Product from "@/lib/models/Product";
import Order from "@/lib/models/Order";
import Discount from "@/lib/models/Discount";
import { getOptionalAuthPayload } from "@/lib/middleware/auth";
import { jsonOk, jsonError, handleApiError, isValidObjectId } from "@/lib/server/api";
import { enforceRateLimit } from "@/lib/server/rateLimit";
import {
  buildOrderItems,
  calculateTotals,
  evaluateDiscount,
  generateOrderNumber,
  normalizeCartItems,
  sanitizePaymentMethod,
  validateShippingAddress,
} from "@/lib/server/checkout";
import { getSettings } from "@/lib/server/settings";
import { sendOrderConfirmation } from "@/lib/server/email";

export async function POST(request) {
  const limited = enforceRateLimit(request, {
    bucket: "checkout",
    limit: 10,
    windowMs: 10 * 60 * 1000,
  });
  if (limited) return limited;

  let decremented = [];
  let committed = false;
  let reservedDiscountId = null;

  try {
    await connect();

    const body = await request.json().catch(() => null);
    if (!body) return jsonError("Invalid request body", 400);

    const cart = normalizeCartItems(body.items);
    if (cart.error) return jsonError(cart.error, 400);

    const ids = cart.items.map((item) => item.id);
    const products = await Product.find({
      _id: { $in: ids },
      isActive: true,
      isDeleted: false,
    }).lean();

    if (products.length !== ids.length) {
      return jsonError("One or more products are no longer available. Please refresh your cart.", 409);
    }

    const productMap = new Map(products.map((product) => [String(product._id), product]));
    const built = buildOrderItems({ items: cart.items, productMap });
    if (built.error) return jsonError(built.error, built.status || 409);

    const { items: orderItems, subtotal } = built;

    let discount = null;
    let discountAmount = 0;
    const discountCode = String(body.discountCode || "").trim().toUpperCase();

    if (discountCode) {
      discount = await Discount.findOne({
        code: discountCode,
        isActive: true,
        isDeleted: false,
      });

      if (!discount) return jsonError("That discount code is not valid", 400);

      const discountResult = evaluateDiscount({ discount, subtotal });
      if (discountResult.error) return jsonError(discountResult.error, 400);
      discountAmount = discountResult.amount;
    }

    const { shippingFee, totalAmount } = calculateTotals({
      subtotal,
      discountAmount,
      settings: await getSettings(),
    });

    const session = getOptionalAuthPayload(request);
    const addressResult = validateShippingAddress(body.shippingAddress, session?.email);
    if (addressResult.error) return jsonError(addressResult.error, 400);

    const paymentMethod = sanitizePaymentMethod(body.paymentMethod);

    // Reserve a discount use atomically right before stock. This closes the
    // race where two concurrent checkouts both pass the usage-limit check.
    if (discount) {
      const reserved = await Discount.findOneAndUpdate(
        {
          _id: discount._id,
          isActive: true,
          isDeleted: false,
          $or: [{ usageLimit: null }, { $expr: { $lt: ["$usedCount", "$usageLimit"] } }],
        },
        { $inc: { usedCount: 1 } },
        { new: true }
      );

      if (!reserved) {
        return jsonError("This discount code has reached its usage limit", 409);
      }
      reservedDiscountId = discount._id;
    }

    // Reserve stock atomically. If any item fails, the catch block rolls back.
    for (const { id, quantity } of cart.items) {
      const updated = await Product.findOneAndUpdate(
        {
          _id: id,
          isActive: true,
          isDeleted: false,
          stock: { $gte: quantity },
        },
        { $inc: { stock: -quantity, soldCount: quantity } },
        { new: true }
      );

      if (!updated) {
        throw Object.assign(
          new Error("Stock changed while you were checking out. Please review your cart."),
          { status: 409 }
        );
      }
      decremented.push({ id, quantity });
    }

    let order = null;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        order = await Order.create({
          orderNumber: generateOrderNumber(),
          accessToken: crypto.randomBytes(24).toString("hex"),
          customerId:
            session?.id && isValidObjectId(session.id) ? new mongoose.Types.ObjectId(session.id) : null,
          items: orderItems,
          shippingAddress: addressResult.value,
          subtotal,
          shippingFee,
          discountAmount,
          discountCode: discountCode || null,
          totalAmount,
          paymentMethod,
          paymentStatus: "unpaid",
          status: "pending",
          customerNotes: String(body.customerNotes || "").trim().slice(0, 500),
          statusHistory: [
            {
              status: "pending",
              note: "Order placed by customer",
              changedBy: "customer",
              at: new Date(),
            },
          ],
        });
        break;
      } catch (error) {
        if (error?.code === 11000 && attempt < 4) continue;
        throw error;
      }
    }

    if (!order) throw new Error("Could not create your order. Please try again.");

    committed = true;

    try {
      const emailResult = await sendOrderConfirmation(order);
      if (emailResult.sent) {
        await Order.updateOne({ _id: order._id }, { $set: { emailSentAt: new Date() } });
      }
    } catch (error) {
      console.error("Order confirmation email failed:", error);
    }

    return jsonOk(
      {
        orderNumber: order.orderNumber,
        accessToken: order.accessToken,
        orderId: order._id.toString(),
        totalAmount,
      },
      { status: 201 }
    );
  } catch (error) {
    if (!committed) {
      for (const item of decremented) {
        await Product.updateOne(
          { _id: item.id },
          { $inc: { stock: item.quantity, soldCount: -item.quantity } }
        ).catch(() => {});
      }
      if (reservedDiscountId) {
        await Discount.updateOne(
          { _id: reservedDiscountId },
          { $inc: { usedCount: -1 } }
        ).catch(() => {});
      }
    }
    return handleApiError(error, "POST /api/checkout");
  }
}
