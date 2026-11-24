// app/api/admin/messages/[id]/route.js

import { connect } from "@/lib/mongoose";
import Message from "@/lib/models/Message";
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
    if (!id) return jsonError("Invalid message ID", 400);

    const message = await Message.findOne({ _id: id, isDeleted: false }).lean();
    if (!message) return jsonError("Message not found", 404);

    if (!message.isRead) {
      await Message.updateOne({ _id: id }, { $set: { isRead: true } });
      message.isRead = true;
    }

    return jsonOk({ message });
  } catch (error) {
    return handleApiError(error, "GET /api/admin/messages/[id]");
  }
});

export const PATCH = withAdminAuth(async (req, context) => {
  try {
    await connect();
    const id = await resolveId(context);
    if (!id) return jsonError("Invalid message ID", 400);

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return jsonError("Invalid request body", 400);
    if (body.isRead === undefined) return jsonError("No updatable fields provided", 400);

    const message = await Message.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: { isRead: Boolean(body.isRead) } },
      { new: true }
    ).lean();

    if (!message) return jsonError("Message not found", 404);
    return jsonOk({ message });
  } catch (error) {
    return handleApiError(error, "PATCH /api/admin/messages/[id]");
  }
});

export const DELETE = withAdminAuth(async (req, context) => {
  try {
    await connect();
    const id = await resolveId(context);
    if (!id) return jsonError("Invalid message ID", 400);

    const message = await Message.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: { isDeleted: true } },
      { new: true }
    );

    if (!message) return jsonError("Message not found", 404);
    return jsonOk({ message: "Message deleted" });
  } catch (error) {
    return handleApiError(error, "DELETE /api/admin/messages/[id]");
  }
});
