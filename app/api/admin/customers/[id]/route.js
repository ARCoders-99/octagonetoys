// app/api/admin/customers/[id]/route.js

import { connect } from "@/lib/mongoose";
import User from "@/lib/models/User";
import Order from "@/lib/models/Order";
import { withAdminAuth } from "@/lib/middleware/withAdminAuth";
import { jsonOk, jsonError, handleApiError, isValidObjectId } from "@/lib/server/api";

export const dynamic = "force-dynamic";

async function resolveId(context) {
  const { id } = await context.params;
  return isValidObjectId(id) ? id : null;
}

export const GET = withAdminAuth(async (req, context) => {
  try {
    await connect();
    const id = await resolveId(context);
    if (!id) return jsonError("Invalid customer ID", 400);

    const customer = await User.findOne({ _id: id, isDeleted: false })
      .select("-passwordHash")
      .lean();
    if (!customer) return jsonError("Customer not found", 404);

    const orders = await Order.find({ customerId: id, isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return jsonOk({ customer, orders });
  } catch (error) {
    return handleApiError(error, "GET /api/admin/customers/[id]");
  }
});

export const PATCH = withAdminAuth(async (req, context) => {
  try {
    await connect();
    const id = await resolveId(context);
    if (!id) return jsonError("Invalid customer ID", 400);

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return jsonError("Invalid request body", 400);

    const updates = {};
    if (body.firstName !== undefined) updates.firstName = String(body.firstName || "").trim();
    if (body.lastName !== undefined) updates.lastName = String(body.lastName || "").trim();
    if (body.name !== undefined) updates.name = String(body.name || "").trim();
    if (body.phone !== undefined) updates.phone = String(body.phone || "").trim();
    if (body.isActive !== undefined) updates.isActive = Boolean(body.isActive);
    if (body.addressBook !== undefined && Array.isArray(body.addressBook)) {
      updates.addressBook = body.addressBook;
    }

    if (!Object.keys(updates).length) return jsonError("No updatable fields provided", 400);

    const customer = await User.findOneAndUpdate(
      { _id: id, role: "customer", isDeleted: false },
      { $set: updates },
      { new: true, runValidators: true }
    )
      .select("-passwordHash")
      .lean();

    if (!customer) return jsonError("Customer not found", 404);
    return jsonOk({ customer });
  } catch (error) {
    return handleApiError(error, "PATCH /api/admin/customers/[id]");
  }
});

export const DELETE = withAdminAuth(async (req, context) => {
  try {
    await connect();
    const id = await resolveId(context);
    if (!id) return jsonError("Invalid customer ID", 400);

    const customer = await User.findOneAndUpdate(
      { _id: id, role: "customer", isDeleted: false },
      { $set: { isDeleted: true, isActive: false } },
      { new: true }
    ).select("-passwordHash");

    if (!customer) return jsonError("Customer not found", 404);
    return jsonOk({ message: "Customer deleted" });
  } catch (error) {
    return handleApiError(error, "DELETE /api/admin/customers/[id]");
  }
});
