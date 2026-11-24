// app/api/admin/orders/[id]/route.js
// View an order and update fulfilment/payment details. No delete endpoint.

import { connect } from "@/lib/mongoose";
import Order from "@/lib/models/Order";
import Product from "@/lib/models/Product";
import { withAdminAuth } from "@/lib/middleware/withAdminAuth";
import { jsonOk, jsonError, handleApiError, isValidObjectId } from "@/lib/server/api";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "@/lib/constants";
import { sendOrderStatusUpdate } from "@/lib/server/email";

export const dynamic = "force-dynamic";

async function resolveId(context) {
  const { id } = await context.params;
  return isValidObjectId(id) ? id : null;
}

export const GET = withAdminAuth(async (req, context) => {
  try {
    await connect();
    const id = await resolveId(context);
    if (!id) return jsonError("Invalid order ID", 400);

    const order = await Order.findOne({ _id: id, isDeleted: false })
      .populate("customerId", "email name phone")
      .lean();

    if (!order) return jsonError("Order not found", 404);
    return jsonOk({ order });
  } catch (error) {
    return handleApiError(error, "GET /api/admin/orders/[id]");
  }
});

export const PATCH = withAdminAuth(async (req, context) => {
  try {
    await connect();
    const id = await resolveId(context);
    if (!id) return jsonError("Invalid order ID", 400);

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return jsonError("Invalid request body", 400);

    const existing = await Order.findOne({ _id: id, isDeleted: false }).lean();
    if (!existing) return jsonError("Order not found", 404);

    const update = {};

    if (body.status !== undefined) {
      if (!ORDER_STATUSES.includes(body.status)) {
        return jsonError(`Invalid status. Allowed: ${ORDER_STATUSES.join(", ")}`, 400);
      }
      update.status = body.status;
    }

    if (body.paymentStatus !== undefined) {
      if (!PAYMENT_STATUSES.includes(body.paymentStatus)) {
        return jsonError(`Invalid payment status. Allowed: ${PAYMENT_STATUSES.join(", ")}`, 400);
      }
      update.paymentStatus = body.paymentStatus;
    }

    if (body.trackingNumber !== undefined) {
      update.trackingNumber = body.trackingNumber ? String(body.trackingNumber).trim() : null;
    }
    if (body.carrier !== undefined) {
      update.carrier = body.carrier ? String(body.carrier).trim() : null;
    }
    if (body.adminNotes !== undefined) {
      update.adminNotes = String(body.adminNotes || "").trim().slice(0, 2000);
    }

    if (!Object.keys(update).length) {
      return jsonError("No updatable fields provided", 400);
    }

    const mongoUpdate = { $set: update };
    const statusChanged = update.status && update.status !== existing.status;
    const willCancel = statusChanged && update.status === "cancelled";
    const willReactivate = statusChanged && existing.status === "cancelled";

    // Cancelling an order puts its reserved stock back. The flag is claimed
    // atomically so two simultaneous cancels cannot restore stock twice.
    if (willCancel && !existing.inventoryRestored) {
      const claimed = await Order.findOneAndUpdate(
        { _id: id, isDeleted: false, inventoryRestored: { $ne: true } },
        { $set: { inventoryRestored: true } },
        { new: false }
      );

      if (claimed) {
        for (const item of existing.items) {
          await Product.updateOne(
            { _id: item.productId },
            { $inc: { stock: item.quantity, soldCount: -item.quantity } }
          ).catch((error) => console.error("Stock restore failed:", error));
        }
      }
    }

    // Moving an order out of cancelled re-reserves its stock. If stock is no
    // longer available the admin gets a clear error and the order is unchanged.
    if (willReactivate && existing.inventoryRestored) {
      const reserved = [];
      try {
        for (const item of existing.items) {
          const updated = await Product.findOneAndUpdate(
            { _id: item.productId, stock: { $gte: item.quantity } },
            { $inc: { stock: -item.quantity, soldCount: item.quantity } },
            { new: true }
          );
          if (!updated) {
            throw Object.assign(
              new Error(`Not enough stock to reactivate "${item.title}" (need ${item.quantity})`),
              { status: 409 }
            );
          }
          reserved.push(item);
        }
      } catch (error) {
        for (const item of reserved) {
          await Product.updateOne(
            { _id: item.productId },
            { $inc: { stock: item.quantity, soldCount: -item.quantity } }
          ).catch(() => {});
        }
        return jsonError(error.message, error.status || 409);
      }
      update.inventoryRestored = false;
    }

    if (statusChanged) {
      mongoUpdate.$push = {
        statusHistory: {
          status: update.status,
          note: String(body.statusNote || "").trim(),
          changedBy: req.admin?.email || "admin",
          at: new Date(),
        },
      };
    }

    const order = await Order.findOneAndUpdate({ _id: id, isDeleted: false }, mongoUpdate, {
      new: true,
      runValidators: true,
    })
      .populate("customerId", "email name phone")
      .lean();

    if (!order) return jsonError("Order not found", 404);

    if (statusChanged) {
      sendOrderStatusUpdate(order, existing.status).catch((error) =>
        console.error("Status email failed:", error)
      );
    }

    return jsonOk({ order });
  } catch (error) {
    return handleApiError(error, "PATCH /api/admin/orders/[id]");
  }
});
