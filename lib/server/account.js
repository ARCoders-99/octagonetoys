// lib/server/account.js
// Pure validation for customer profile edits and the address book.

export const MAX_ADDRESSES = 10;

const PHONE_PATTERN = /^\+?[\d\s()-]{7,20}$/;

function text(value, max) {
  return String(value ?? "").trim().slice(0, max);
}

/** Normalise a phone number, allowing an empty value. */
export function isValidPhone(value) {
  const phone = String(value ?? "").trim();
  if (!phone) return true;
  return PHONE_PATTERN.test(phone);
}

/** Validate a name/phone profile update. */
export function validateProfile(body = {}) {
  const firstName = text(body.firstName, 60);
  const lastName = text(body.lastName, 60);
  const phone = text(body.phone, 30);
  const name = `${firstName} ${lastName}`.trim();

  if (!name) return { error: "Please enter your name" };
  if (!isValidPhone(phone)) return { error: "Please enter a valid phone number" };

  return { value: { firstName, lastName, phone, name } };
}

/** Validate one address-book entry. */
export function validateAddress(body = {}) {
  const value = {
    label: text(body.label, 40) || "Home",
    fullName: text(body.fullName, 80),
    phone: text(body.phone, 30),
    line1: text(body.line1, 160),
    line2: text(body.line2, 160),
    city: text(body.city, 80),
    state: text(body.state, 80),
    zip: text(body.zip, 20),
    country: text(body.country, 80) || "Pakistan",
  };

  if (!value.fullName) return { error: "Please enter the recipient's full name" };
  if (!value.line1) return { error: "Please enter the street address" };
  if (!value.city) return { error: "Please enter the city" };
  if (!isValidPhone(value.phone)) return { error: "Please enter a valid phone number" };

  return { value };
}

/** True when an address index is a valid position in the array. */
export function isValidAddressIndex(index, length) {
  const position = Number(index);
  return Number.isInteger(position) && position >= 0 && position < Number(length || 0);
}
