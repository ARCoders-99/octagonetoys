// app/api/account/addresses/[index]/route.js
// Update, delete or promote an address by its position in the address book.

import { connect } from "@/lib/mongoose";
import User from "@/lib/models/User";
import { withCustomerAuth } from "@/lib/middleware/withCustomerAuth";
import { jsonOk, jsonError, handleApiError } from "@/lib/server/api";
import { isValidAddressIndex, validateAddress } from "@/lib/server/account";

export const dynamic = "force-dynamic";

async function resolveIndex(context, length) {
  const { index } = await context.params;
  return isValidAddressIndex(index, length) ? Number(index) : null;
}

/** Work on plain objects so index assignments always persist. */
function plainAddresses(user) {
  return (user.addressBook || []).map((item) =>
    typeof item.toObject === "function" ? item.toObject() : item
  );
}

export const PATCH = withCustomerAuth(async (req, context) => {
  try {
    await connect();

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return jsonError("Invalid request body", 400);

    const user = await User.findOne({ _id: req.customer.id, isDeleted: false }).select(
      "addressBook"
    );
    if (!user) return jsonError("Account not found", 404);

    const addresses = plainAddresses(user);
    const index = await resolveIndex(context, addresses.length);
    if (index === null) return jsonError("Address not found", 404);

    if (body.makeDefault === true) {
      if (index === 0) return jsonOk({ addresses, message: "This is already the default address." });
      const [address] = addresses.splice(index, 1);
      addresses.unshift(address);
      user.addressBook = addresses;
      await user.save();
      return jsonOk({ addresses: user.addressBook, message: "Default address updated." });
    }

    const validated = validateAddress({ ...addresses[index], ...body });
    if (validated.error) return jsonError(validated.error, 400);

    addresses[index] = validated.value;
    user.addressBook = addresses;
    await user.save();

    return jsonOk({ addresses: user.addressBook, message: "Address updated." });
  } catch (error) {
    return handleApiError(error, "PATCH /api/account/addresses/[index]");
  }
});

export const DELETE = withCustomerAuth(async (req, context) => {
  try {
    await connect();

    const user = await User.findOne({ _id: req.customer.id, isDeleted: false }).select(
      "addressBook"
    );
    if (!user) return jsonError("Account not found", 404);

    const addresses = plainAddresses(user);
    const index = await resolveIndex(context, addresses.length);
    if (index === null) return jsonError("Address not found", 404);

    addresses.splice(index, 1);
    user.addressBook = addresses;
    await user.save();

    return jsonOk({ addresses: user.addressBook, message: "Address removed." });
  } catch (error) {
    return handleApiError(error, "DELETE /api/account/addresses/[index]");
  }
});
