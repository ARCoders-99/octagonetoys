// app/api/admin/settings/route.js
// Read and update the store-wide settings singleton.

import { withAdminAuth } from "@/lib/middleware/withAdminAuth";
import { jsonOk, jsonError, handleApiError, toInt } from "@/lib/server/api";
import { getSettings, saveSettings } from "@/lib/server/settings";

export const dynamic = "force-dynamic";

function isHttpUrl(value) {
  try {
    const url = new URL(String(value));
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export const GET = withAdminAuth(async () => {
  try {
    const settings = await getSettings();
    return jsonOk({ settings });
  } catch (error) {
    return handleApiError(error, "GET /api/admin/settings");
  }
});

export const PUT = withAdminAuth(async (req) => {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return jsonError("Invalid request body", 400);

    const storeName = String(body.storeName || "").trim();
    if (!storeName) return jsonError("Store name is required", 400);

    const storeEmail = String(body.storeEmail || "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(storeEmail)) {
      return jsonError("Please enter a valid store email address", 400);
    }

    const shippingFee = toInt(body.shippingFee, NaN);
    if (!Number.isFinite(shippingFee) || shippingFee < 0) {
      return jsonError("Shipping fee must be a valid amount in paisa", 400);
    }

    const freeShippingThreshold = toInt(body.freeShippingThreshold, NaN);
    if (!Number.isFinite(freeShippingThreshold) || freeShippingThreshold < 0) {
      return jsonError("Free shipping threshold must be a valid amount in paisa", 400);
    }

    const incomingSocial = body.socialLinks && typeof body.socialLinks === "object"
      ? body.socialLinks
      : {};

    const socialLinks = {};
    for (const network of ["instagram", "youtube", "facebook", "tiktok"]) {
      const value = String(incomingSocial[network] || "").trim();
      if (value && !isHttpUrl(value)) {
        return jsonError(`${network} link must start with http:// or https://`, 400);
      }
      socialLinks[network] = value;
    }

    const settings = await saveSettings(
      {
        storeName,
        storeEmail,
        storePhone: body.storePhone,
        whatsappNumber: body.whatsappNumber,
        storeAddress: body.storeAddress,
        shippingFee,
        freeShippingThreshold,
        socialLinks,
      },
      req.admin?.email || ""
    );

    return jsonOk({ settings });
  } catch (error) {
    return handleApiError(error, "PUT /api/admin/settings");
  }
});

export const PATCH = PUT;
