// app/api/contact/route.js
// Public contact form. Stores the message and emails the store inbox when
// email delivery is configured.

import { connect } from "@/lib/mongoose";
import Message from "@/lib/models/Message";
import { jsonOk, jsonError, handleApiError } from "@/lib/server/api";
import { enforceRateLimit } from "@/lib/server/rateLimit";
import { validateContactMessage } from "@/lib/server/contact";
import { getSettings } from "@/lib/server/settings";
import { sendContactNotification } from "@/lib/server/email";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const limited = enforceRateLimit(request, {
    bucket: "contact",
    limit: 5,
    windowMs: 10 * 60 * 1000,
  });
  if (limited) return limited;

  try {
    await connect();

    const body = await request.json().catch(() => null);
    if (!body) return jsonError("Invalid request body", 400);

    const validated = validateContactMessage(body);
    if (validated.error) return jsonError(validated.error, 400);

    const message = await Message.create(validated.value);

    try {
      const settings = await getSettings();
      const emailResult = await sendContactNotification(message, settings.storeEmail);
      if (emailResult.sent) {
        await Message.updateOne({ _id: message._id }, { $set: { emailSentAt: new Date() } });
      }
    } catch (error) {
      // The message is already saved, so a mail failure must not fail the form.
      console.error("Contact notification email failed:", error);
    }

    return jsonOk(
      { message: "Thanks! Your message has been sent. We reply within one working day." },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error, "POST /api/contact");
  }
}
