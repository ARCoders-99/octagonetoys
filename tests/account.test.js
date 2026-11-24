// tests/account.test.js
// Profile and address-book validation rules.

import test from "node:test";
import assert from "node:assert/strict";

import {
  MAX_ADDRESSES,
  isValidAddressIndex,
  isValidPhone,
  validateAddress,
  validateProfile,
} from "../lib/server/account.js";

test("validateProfile trims fields and builds a display name", () => {
  const result = validateProfile({
    firstName: "  Ayesha ",
    lastName: " Khan  ",
    phone: " +92 300 1234567 ",
  });

  assert.deepEqual(result, {
    value: {
      firstName: "Ayesha",
      lastName: "Khan",
      phone: "+92 300 1234567",
      name: "Ayesha Khan",
    },
  });
});

test("validateProfile requires a name and a sane phone", () => {
  assert.equal(validateProfile({ firstName: "  ", lastName: "" }).error, "Please enter your name");
  assert.equal(validatePhoneError("abc"), "Please enter a valid phone number");
  assert.equal(validatePhoneError("12"), "Please enter a valid phone number");
  assert.equal(validatePhoneError(""), "");
});

function validatePhoneError(phone) {
  const result = validateProfile({ firstName: "Ayesha", phone });
  return result.error || "";
}

test("isValidPhone accepts common Pakistani formats", () => {
  assert.equal(isValidPhone("03001234567"), true);
  assert.equal(isValidPhone("+92 300 1234567"), true);
  assert.equal(isValidPhone("(021) 123-4567"), true);
  assert.equal(isValidPhone(""), true);
  assert.equal(isValidPhone("call me"), false);
});

test("validateAddress applies defaults and requires the essentials", () => {
  const result = validateAddress({
    fullName: " Ayesha Khan ",
    line1: "House 12, Street 4",
    city: "Karachi",
  });

  assert.equal(result.error, undefined);
  assert.deepEqual(result.value, {
    label: "Home",
    fullName: "Ayesha Khan",
    phone: "",
    line1: "House 12, Street 4",
    line2: "",
    city: "Karachi",
    state: "",
    zip: "",
    country: "Pakistan",
  });
});

test("validateAddress reports each missing required field", () => {
  const base = { fullName: "Ayesha", line1: "House 1", city: "Karachi" };

  assert.equal(validateAddress({ ...base, fullName: "" }).error, "Please enter the recipient's full name");
  assert.equal(validateAddress({ ...base, line1: " " }).error, "Please enter the street address");
  assert.equal(validateAddress({ ...base, city: "" }).error, "Please enter the city");
  assert.equal(validateAddress({ ...base, phone: "nope" }).error, "Please enter a valid phone number");
});

test("validateAddress truncates oversized values", () => {
  const result = validateAddress({
    fullName: "A".repeat(100),
    line1: "B".repeat(300),
    city: "Karachi",
  });

  assert.equal(result.value.fullName.length, 80);
  assert.equal(result.value.line1.length, 160);
});

test("isValidAddressIndex checks array bounds", () => {
  assert.equal(isValidAddressIndex(0, 3), true);
  assert.equal(isValidAddressIndex(2, 3), true);
  assert.equal(isValidAddressIndex(3, 3), false);
  assert.equal(isValidAddressIndex(-1, 3), false);
  assert.equal(isValidAddressIndex("1", 3), true);
  assert.equal(isValidAddressIndex("x", 3), false);
  assert.equal(isValidAddressIndex(0, 0), false);
  assert.equal(MAX_ADDRESSES, 10);
});
