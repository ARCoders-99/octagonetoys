"use client";

import { useState } from "react";

const EMPTY = { name: "", email: "", phone: "", subject: "", message: "" };

const inputClass =
  "w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm outline-none transition focus:border-toy-orange focus:bg-white focus:ring-4 focus:ring-amber-100";

export default function ContactForm() {
  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState({ type: "", text: "" });
  const [sending, setSending] = useState(false);

  const update = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setSending(true);
    setStatus({ type: "", text: "" });

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not send your message");

      setForm(EMPTY);
      setStatus({
        type: "success",
        text: data.message || "Thanks! Your message has been sent.",
      });
    } catch (requestError) {
      setStatus({ type: "error", text: requestError.message });
    } finally {
      setSending(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
    >
      <h2 className="text-xl font-black tracking-tight text-slate-900">Send us a message</h2>
      <p className="mt-1 text-sm text-slate-500">
        Fill in the form and our team will reply within one working day.
      </p>

      {status.text && (
        <div
          role="status"
          className={`mt-4 rounded-2xl px-4 py-3 text-sm font-semibold ring-1 ${
            status.type === "success"
              ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
              : "bg-rose-50 text-rose-700 ring-rose-100"
          }`}
        >
          {status.text}
        </div>
      )}

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">
            Your name
          </span>
          <input
            name="name"
            value={form.name}
            onChange={update}
            required
            autoComplete="name"
            className={inputClass}
            placeholder="Ayesha Khan"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">
            Email
          </span>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={update}
            required
            autoComplete="email"
            className={inputClass}
            placeholder="you@example.com"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">
            Phone <span className="font-semibold normal-case tracking-normal text-slate-400">(optional)</span>
          </span>
          <input
            name="phone"
            value={form.phone}
            onChange={update}
            autoComplete="tel"
            className={inputClass}
            placeholder="03xx xxxxxxx"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">
            Subject <span className="font-semibold normal-case tracking-normal text-slate-400">(optional)</span>
          </span>
          <input
            name="subject"
            value={form.subject}
            onChange={update}
            className={inputClass}
            placeholder="Order, return or gift question"
          />
        </label>
      </div>

      <label className="mt-4 block">
        <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">
          Message
        </span>
        <textarea
          name="message"
          value={form.message}
          onChange={update}
          required
          minLength={10}
          rows={5}
          className={inputClass}
          placeholder="Tell us how we can help…"
        />
      </label>

      <button
        type="submit"
        disabled={sending}
        className="mt-5 w-full rounded-full bg-toy-orange px-6 py-3.5 text-xs font-black uppercase tracking-wide text-white shadow-md shadow-amber-200 transition hover:bg-amber-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {sending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
