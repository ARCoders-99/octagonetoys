"use client";

import Link from "next/link";
import { useState } from "react";
import AuthShell from "@/components/storefront/AuthShell";

const inputClass =
  "w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm outline-none transition focus:border-toy-orange focus:bg-white focus:ring-4 focus:ring-amber-100";

export default function ResetPasswordForm({ token = "" }) {
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const update = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, ...form }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not reset your password");
      setDone(true);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const footer = (
    <p className="mt-5 text-center text-sm text-slate-500">
      <Link href="/login" className="font-bold text-toy-purple hover:text-violet-700">
        Back to sign in
      </Link>
    </p>
  );

  if (!token) {
    return (
      <AuthShell
        eyebrow="Account help"
        title="Reset link missing"
        subtitle="This page needs the secure link from your email. Request a fresh one and try again."
        footer={footer}
      >
        <Link
          href="/forgot-password"
          className="mt-5 block w-full rounded-full bg-toy-orange px-5 py-3.5 text-center text-xs font-black uppercase tracking-wide text-white shadow-md shadow-amber-200 transition hover:bg-amber-600"
        >
          Request a new link
        </Link>
      </AuthShell>
    );
  }

  if (done) {
    return (
      <AuthShell
        eyebrow="Account help"
        title="Password updated"
        subtitle="Your password has been changed. Sign in with your new password to continue."
        footer={footer}
      >
        <Link
          href="/login"
          className="mt-5 block w-full rounded-full bg-emerald-600 px-5 py-3.5 text-center text-xs font-black uppercase tracking-wide text-white shadow-md shadow-emerald-200 transition hover:bg-emerald-700"
        >
          Go to sign in
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Account help"
      title="Choose a new password"
      subtitle="Use at least 8 characters, including a letter and a number."
      perks={[
        {
          icon: "🔐",
          title: "One-time link",
          body: "This link stops working as soon as you save a new password.",
        },
      ]}
      footer={footer}
    >
      {error && (
        <div
          role="alert"
          className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 ring-1 ring-rose-100"
        >
          {error}
        </div>
      )}

      <form onSubmit={submit} className="mt-5 space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">
            New password
          </span>
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={update}
            required
            minLength={8}
            autoComplete="new-password"
            className={inputClass}
            placeholder="••••••••"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">
            Confirm new password
          </span>
          <input
            name="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={update}
            required
            minLength={8}
            autoComplete="new-password"
            className={inputClass}
            placeholder="••••••••"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-toy-orange px-5 py-3.5 text-xs font-black uppercase tracking-wide text-white shadow-md shadow-amber-200 transition hover:bg-amber-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Saving…" : "Save new password"}
        </button>
      </form>
    </AuthShell>
  );
}
