// tests/contact.test.js
// Public contact-form validation.

import test from "node:test";
import assert from "node:assert/strict";

import { validateContactMessage } from "../lib/server/contact.js";

test("validateContactMessage accepts and normalises a good message", () => {
  const result = validateContactMessage({
    name: "  Ayesha Khan ",
    email: "  AYESHA@Example.com ",
    phone: " 03001234567 ",
    subject: " Order help ",
    message: "  Where is my order please?  ",
  });

  assert.equal(result.error, undefined);
  assert.deepEqual(result.value, {
    name: "Ayesha Khan",
    email: "ayesha@example.com",
    phone: "03001234567",
    subject: "Order help",
    message: "Where is my order please?",
  });
});

test("validateContactMessage rejects missing or malformed input", () => {
  assert.equal(validateContactMessage({}).error, "Please enter your name");
  assert.equal(
    validateContactMessage({ name: "A", email: "not-an-email", message: "Hello there friend" }).error,
    "Please enter a valid email address"
  );
  assert.equal(
    validateContactMessage({ name: "A", email: "a@b.com", message: "too short" }).error,
    "Please write a message of at least 10 characters"
  );
});

test("validateContactMessage trims long fields to storage limits", () => {
  const result = validateContactMessage({
    name: "A".repeat(100),
    email: "a@b.com",
    subject: "S".repeat(200),
    message: "M".repeat(3000),
  });

  assert.equal(result.value.name.length, 80);
  assert.equal(result.value.subject.length, 120);
  assert.equal(result.value.message.length, 2000);
});
