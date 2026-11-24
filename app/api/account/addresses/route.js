// app/api/account/addresses/route.js
// Address book for the signed-in customer. The first entry is the default.

import { connect } from "@/lib/mongoose";
import User from "@/lib/models/User";
import { withCustomerAuth } from "@/lib/middleware/withCustomerAuth";
import { jsonOk, jsonError, handleApiError } from "@/lib/server/api";
import { MAX_ADDRESSES, validateAddress } from "@/lib/server/account";

export const dynamic = "force-dynamic";

export const GET = withCustomerAuth(async (req) => {
  try {
    await connect();
    const user = await User.findOne({ _id: req.customer.id, isDeleted: false })
      .select("addressBook")
      .lean();
    if (!user) return jsonError("Account not found", 404);

    return jsonOk({ addresses: user.addressBook || [] });
  } catch (error) {
    return handleApiError(error, "GET /api/account/addresses");
  }
});

export const POST = withCustomerAuth(async (req) => {
  try {
    await connect();

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return jsonError("Invalid request body", 400);

    const validated = validateAddress(body);
    if (validated.error) return jsonError(validated.error, 400);

    const user = await User.findOne({ _id: req.customer.id, isDeleted: false }).select(
      "addressBook"
    );
    if (!user) return jsonError("Account not found", 404);

    const addresses = (user.addressBook || []).map((item) =>
      typeof item.toObject === "function" ? item.toObject() : item
    );
    if (addresses.length >= MAX_ADDRESSES) {
      return jsonError(`You can save up to ${MAX_ADDRESSES} addresses`, 400);
    }

    if (body.makeDefault === true || addresses.length === 0) {
      addresses.unshift(validated.value);
    } else {
      addresses.push(validated.value);
    }

    user.addressBook = addresses;
    await user.save();

    return jsonOk(
      { addresses: user.addressBook, message: "Address saved." },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error, "POST /api/account/addresses");
  }
});
