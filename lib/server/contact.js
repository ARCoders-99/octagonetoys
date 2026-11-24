// lib/server/contact.js
// Pure validation for the public contact form, kept separate from the route
// so it can be unit tested.

export function validateContactMessage(body = {}) {
  const name = String(body.name || "").trim().slice(0, 80);
  const email = String(body.email || "").trim().toLowerCase().slice(0, 160);
  const phone = String(body.phone || "").trim().slice(0, 40);
  const subject = String(body.subject || "").trim().slice(0, 120);
  const message = String(body.message || "").trim().slice(0, 2000);

  if (!name) return { error: "Please enter your name" };
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Please enter a valid email address" };
  }
  if (message.length < 10) {
    return { error: "Please write a message of at least 10 characters" };
  }

  return { value: { name, email, phone, subject, message } };
}
