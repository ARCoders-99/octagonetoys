"use client";

import { useState } from "react";

export default function ReviewForm({ productId }) {
  const [rating, setRating] = useState(5);
  const [form, setForm] = useState({ name: "", email: "", title: "", comment: "" });
  const [status, setStatus] = useState({ type: "", message: "" });
  const [saving, setSaving] = useState(false);

  const update = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setStatus({ type: "", message: "" });

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, rating, ...form }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Could not submit your review");

      setStatus({
        type: "success",
        message: data.message || "Thank you! Your review will appear after approval.",
      });
      setForm({ name: "", email: "", title: "", comment: "" });
      setRating(5);
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
      <h3 className="text-lg font-black text-ink-900">Write a review</h3>
      <p className="mt-1 text-sm text-slate-500">
        Share how the toy worked for your family. Reviews are published after moderation.
      </p>

      {status.message && (
        <div
          className={`mt-4 rounded-xl px-4 py-3 text-sm font-medium ${
            status.type === "success"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-rose-50 text-rose-700"
          }`}
        >
          {status.message}
        </div>
      )}

      <div className="mt-4">
        <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Your rating</span>
        <div className="mt-1 flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className={`text-2xl transition ${star <= rating ? "text-toy-orange" : "text-slate-200 hover:text-amber-300"}`}
              aria-label={`${star} star${star > 1 ? "s" : ""}`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-semibold text-slate-700">Name</span>
          <input
            name="name"
            value={form.name}
            onChange={update}
            required
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-toy-orange"
            placeholder="Your name"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-semibold text-slate-700">Email (optional)</span>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={update}
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-toy-orange"
            placeholder="you@example.com"
          />
        </label>
      </div>

      <label className="mt-3 block text-sm">
        <span className="mb-1 block font-semibold text-slate-700">Title (optional)</span>
        <input
          name="title"
          value={form.title}
          onChange={update}
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-toy-orange"
          placeholder="Great gift for a 5-year-old"
        />
      </label>

      <label className="mt-3 block text-sm">
        <span className="mb-1 block font-semibold text-slate-700">Review</span>
        <textarea
          name="comment"
          value={form.comment}
          onChange={update}
          rows={4}
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-toy-orange"
          placeholder="What did you like? Was it durable and safe?"
        />
      </label>

      <button
        type="submit"
        disabled={saving}
        className="mt-4 rounded-full bg-toy-orange px-6 py-3 text-xs font-black uppercase tracking-wide text-white shadow-md shadow-amber-200 transition hover:bg-amber-600 disabled:opacity-60"
      >
        {saving ? "Submitting…" : "Submit review"}
      </button>
    </form>
  );
}
