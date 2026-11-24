// app/api/admin/messages/route.js
// Admin inbox for contact-form messages.

import { connect } from "@/lib/mongoose";
import Message from "@/lib/models/Message";
import { withAdminAuth } from "@/lib/middleware/withAdminAuth";
import {
  jsonOk,
  handleApiError,
  escapeRegex,
  parsePagination,
  buildPagination,
} from "@/lib/server/api";

export const dynamic = "force-dynamic";

export const GET = withAdminAuth(async (req) => {
  try {
    await connect();
    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = parsePagination(searchParams, { defaultLimit: 30 });

    const query = { isDeleted: false };
    const search = searchParams.get("search")?.trim();
    const unread = searchParams.get("unread");

    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      query.$or = [{ name: regex }, { email: regex }, { subject: regex }, { message: regex }];
    }
    if (unread === "true") query.isRead = false;

    const [messages, total, unreadCount] = await Promise.all([
      Message.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Message.countDocuments(query),
      Message.countDocuments({ isDeleted: false, isRead: false }),
    ]);

    return jsonOk({
      messages,
      unreadCount,
      pagination: buildPagination(total, page, limit),
    });
  } catch (error) {
    return handleApiError(error, "GET /api/admin/messages");
  }
});
