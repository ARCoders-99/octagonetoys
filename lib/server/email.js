// lib/server/email.js
// Transactional email service. Uses Resend when RESEND_API_KEY is configured,
// otherwise logs the email to the server console so development is never blocked.

import { STORE_NAME, STORE_EMAIL } from "@/lib/constants";
import { formatPrice, formatDate } from "@/lib/format";

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function sendEmail({ to, subject, html, text }) {
  if (!to) {
    return { sent: false, reason: "missing-recipient" };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || `${STORE_NAME} <onboarding@resend.dev>`;

  if (!apiKey) {
    console.log(
      `\n[email:dev] To: ${to}\nSubject: ${subject}\n${text || "(html only)"}\n`
    );
    return { sent: false, reason: "email-not-configured" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: [to], subject, html, text }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || `Email provider error (${response.status})`);
    }

    return { sent: true, id: data.id };
  } catch (error) {
    console.error("[email] send failed:", error);
    return { sent: false, error: error.message };
  }
}

function emailShell(title, intro, bodyHtml) {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f6f4ef;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
    <div style="max-width:620px;margin:0 auto;padding:28px 16px;">
      <div style="background:#111827;border-radius:18px 18px 0 0;padding:22px 26px;">
        <div style="font-size:22px;font-weight:800;color:#fbbf24;letter-spacing:-0.5px;">${STORE_NAME}</div>
        <div style="color:#d1d5db;font-size:13px;margin-top:4px;">${escapeHtml(title)}</div>
      </div>
      <div style="background:#ffffff;padding:28px 26px;border-radius:0 0 18px 18px;">
        <h1 style="font-size:22px;margin:0 0 12px;">${escapeHtml(title)}</h1>
        <p style="font-size:15px;line-height:1.6;color:#4b5563;margin:0 0 18px;">${escapeHtml(intro)}</p>
        ${bodyHtml}
        <p style="font-size:13px;line-height:1.6;color:#6b7280;margin:24px 0 0;">
          Questions? Reply to this email or contact us at ${escapeHtml(STORE_EMAIL)}.
        </p>
      </div>
      <p style="text-align:center;font-size:12px;color:#9ca3af;margin:16px 0 0;">
        © ${new Date().getFullYear()} ${STORE_NAME}. All rights reserved.
      </p>
    </div>
  </body>
</html>`;
}

function orderItemsHtml(order) {
  const rows = (order.items || [])
    .map(
      (item) => `<tr>
        <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;font-size:14px;">
          ${escapeHtml(item.title)} <span style="color:#6b7280;">× ${item.quantity}</span>
        </td>
        <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;font-size:14px;text-align:right;">
          ${formatPrice(item.price * item.quantity)}
        </td>
      </tr>`
    )
    .join("");

  return `<table style="width:100%;border-collapse:collapse;margin:8px 0 16px;">
    <thead>
      <tr>
        <th style="text-align:left;padding:8px;font-size:12px;color:#6b7280;text-transform:uppercase;">Item</th>
        <th style="text-align:right;padding:8px;font-size:12px;color:#6b7280;text-transform:uppercase;">Total</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <table style="width:100%;font-size:14px;margin-bottom:18px;">
    <tr><td style="padding:4px 8px;color:#6b7280;">Subtotal</td><td style="padding:4px 8px;text-align:right;">${formatPrice(order.subtotal)}</td></tr>
    <tr><td style="padding:4px 8px;color:#6b7280;">Shipping</td><td style="padding:4px 8px;text-align:right;">${formatPrice(order.shippingFee)}</td></tr>
    ${order.discountAmount ? `<tr><td style="padding:4px 8px;color:#059669;">Discount ${order.discountCode ? `(${escapeHtml(order.discountCode)})` : ""}</td><td style="padding:4px 8px;text-align:right;color:#059669;">−${formatPrice(order.discountAmount)}</td></tr>` : ""}
    <tr><td style="padding:10px 8px;font-weight:700;border-top:1px solid #e5e7eb;">Total</td><td style="padding:10px 8px;text-align:right;font-weight:700;border-top:1px solid #e5e7eb;">${formatPrice(order.totalAmount)}</td></tr>
  </table>`;
}

export async function sendOrderConfirmation(order) {
  const to = order?.shippingAddress?.email;
  if (!to) return { sent: false, reason: "missing-email" };

  const html = emailShell(
    "Order confirmed",
    `Thank you, ${order.shippingAddress.fullName}! We received your order ${order.orderNumber} on ${formatDate(order.createdAt)}. We will update you when it ships.`,
    `${orderItemsHtml(order)}
     <div style="background:#f9fafb;border-radius:12px;padding:14px 16px;font-size:14px;line-height:1.6;color:#4b5563;">
       <strong style="color:#111827;">Shipping to</strong><br/>
       ${escapeHtml(order.shippingAddress.fullName)}<br/>
       ${escapeHtml(order.shippingAddress.addressLine1)}${order.shippingAddress.addressLine2 ? `, ${escapeHtml(order.shippingAddress.addressLine2)}` : ""}<br/>
       ${escapeHtml(order.shippingAddress.city)}${order.shippingAddress.state ? `, ${escapeHtml(order.shippingAddress.state)}` : ""}<br/>
       ${escapeHtml(order.shippingAddress.country)}
     </div>`
  );

  return sendEmail({
    to,
    subject: `Your ${STORE_NAME} order ${order.orderNumber} is confirmed`,
    html,
    text: `Order ${order.orderNumber} confirmed. Total: ${formatPrice(order.totalAmount)}.`,
  });
}

export async function sendOrderStatusUpdate(order, previousStatus) {
  const to = order?.shippingAddress?.email;
  if (!to) return { sent: false, reason: "missing-email" };

  const html = emailShell(
    `Order ${order.orderNumber} update`,
    `Your order status changed from ${previousStatus || "pending"} to ${order.status}.`,
    `${orderItemsHtml(order)}
     <p style="font-size:14px;color:#4b5563;">Total: <strong>${formatPrice(order.totalAmount)}</strong></p>
     ${order.trackingNumber ? `<p style="font-size:14px;color:#4b5563;">Tracking: <strong>${escapeHtml(order.trackingNumber)}</strong>${order.carrier ? ` (${escapeHtml(order.carrier)})` : ""}</p>` : ""}`
  );

  return sendEmail({
    to,
    subject: `Your ${STORE_NAME} order ${order.orderNumber} is now ${order.status}`,
    html,
    text: `Order ${order.orderNumber} is now ${order.status}.`,
  });
}

export async function sendContactNotification(message, to = STORE_EMAIL) {
  if (!to) return { sent: false, reason: "missing-recipient" };

  const html = emailShell(
    "New contact message",
    `${message.name} sent a message through the storefront contact form.`,
    `<table style="width:100%;font-size:14px;line-height:1.7;color:#4b5563;">
       <tr><td style="padding:4px 0;color:#6b7280;width:90px;">Name</td><td>${escapeHtml(message.name)}</td></tr>
       <tr><td style="padding:4px 0;color:#6b7280;">Email</td><td>${escapeHtml(message.email)}</td></tr>
       <tr><td style="padding:4px 0;color:#6b7280;">Phone</td><td>${escapeHtml(message.phone || "—")}</td></tr>
       <tr><td style="padding:4px 0;color:#6b7280;">Subject</td><td>${escapeHtml(message.subject || "—")}</td></tr>
     </table>
     <div style="margin-top:14px;background:#f9fafb;border-radius:12px;padding:14px 16px;font-size:14px;line-height:1.7;color:#374151;white-space:pre-wrap;">${escapeHtml(message.message)}</div>`
  );

  return sendEmail({
    to,
    subject: `Contact form: ${message.subject || `Message from ${message.name}`}`,
    html,
    text: `${message.name} <${message.email}>\n${message.phone || ""}\n\n${message.message}`,
  });
}

export async function sendPasswordReset(to, resetUrl, name = "") {
  if (!to) return { sent: false, reason: "missing-recipient" };

  const greeting = name ? `Hi ${name},` : "Hi,";
  const html = emailShell(
    "Reset your password",
    `${greeting} we received a request to reset your ${STORE_NAME} password. This link is valid for 30 minutes.`,
    `<p style="margin:0 0 18px;">
       <a href="${escapeHtml(resetUrl)}"
          style="display:inline-block;background:#f59e0b;color:#ffffff;font-weight:700;font-size:14px;text-decoration:none;border-radius:999px;padding:13px 26px;">
         Choose a new password
       </a>
     </p>
     <p style="font-size:13px;line-height:1.7;color:#6b7280;margin:0;">
       If the button does not work, copy this link into your browser:<br/>
       <span style="word-break:break-all;color:#4b5563;">${escapeHtml(resetUrl)}</span>
     </p>
     <p style="font-size:13px;line-height:1.7;color:#9ca3af;margin:18px 0 0;">
       Didn&rsquo;t request this? You can safely ignore this email — your password will not change.
     </p>`
  );

  return sendEmail({
    to,
    subject: `Reset your ${STORE_NAME} password`,
    html,
    text: `${greeting}\n\nReset your password (valid 30 minutes): ${resetUrl}\n\nIf you did not request this, ignore this email.`,
  });
}

