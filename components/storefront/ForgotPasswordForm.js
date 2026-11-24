"use client";

import Link from "next/link";
import { useState } from "react";
import AuthShell from "@/components/storefront/AuthShell";

const inputClass =
  "w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm outline-none transition focus:border-toy-orange focus:bg-white focus:ring-4 focus:ring-amber-100";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not send the reset link");
      setMessage(data.message || "Check your inbox for the reset link.");
      setEmail("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Account help"
      title="Forgot password?"
      subtitle="Enter the email you used to sign up and we will send a secure link to choose a new password."
      perks={[
        {
          icon: "🔐",
          title: "Secure by design",
          body: "Reset links expire after 30 minutes and can only be used once.",
        },
        {
          icon: "📦",
          title: "Your orders are safe",
          body: "Your order history and saved addresses stay exactly as they were.",
        },
      ]}
      footer={
        <p className="mt-5 text-center text-sm text-slate-500">
          Remembered it?{" "}
          <Link href="/login" className="font-bold text-toy-purple hover:text-violet-700">
            Back to sign in
          </Link>
        </p>
      }
    >
      {error && (
        <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 ring-1 ring-rose-100">
          {error}
        </div>
      )}
      {message && (
        <div
          role="status"
          className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-100"
        >
          {message}
        </div>
      )}

      <form onSubmit={submit} className="mt-5 space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">
            Email
          </span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
            className={inputClass}
            placeholder="you@example.com"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-toy-orange px-5 py-3.5 text-xs font-black uppercase tracking-wide text-white shadow-md shadow-amber-200 transition hover:bg-amber-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Sending…" : "Send reset link"}
        </button>
      </form>
    </AuthShell>
  );
}
