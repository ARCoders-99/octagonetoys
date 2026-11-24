"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/storefront/AuthShell";

export default function LoginForm({ nextPath = "/account" }) {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not sign you in");

      router.push(nextPath);
      router.refresh();
    } catch (requestError) {
      setError(requestError.message);
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in"
      subtitle="Track orders, save your details and check out faster."
      perks={[
        {
          icon: "📦",
          title: "Track every order",
          body: "Follow your parcel from confirmation to delivery.",
        },
        {
          icon: "⚡",
          title: "Faster checkout",
          body: "Your address and details stay saved for next time.",
        },
        {
          icon: "🎁",
          title: "Members-first drops",
          body: "Early access to new toys and seasonal offers.",
        },
      ]}
      footer={
        <div className="mt-5 space-y-2 text-center">
          <p className="text-sm text-slate-500">
            New here?{" "}
            <Link href="/register" className="font-bold text-toy-purple hover:text-violet-700">
              Create an account
            </Link>
          </p>
          <p className="text-xs text-slate-400">
            Store staff can sign in at{" "}
            <Link
              href="/admin/login"
              className="font-semibold text-slate-500 underline hover:text-slate-700"
            >
              the admin panel
            </Link>
            .
          </p>
        </div>
      }
    >
      {error && (
        <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 ring-1 ring-rose-100">
          {error}
        </div>
      )}

      <form onSubmit={submit} className="mt-5 space-y-4">
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
            className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm outline-none transition focus:border-toy-orange focus:bg-white focus:ring-4 focus:ring-amber-100"
            placeholder="you@example.com"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 flex items-center justify-between gap-3 text-xs font-black uppercase tracking-wide text-slate-500">
            <span>Password</span>
            <Link
              href="/forgot-password"
              className="font-bold normal-case tracking-normal text-toy-purple hover:text-violet-700"
            >
              Forgot password?
            </Link>
          </span>
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={update}
            required
            autoComplete="current-password"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm outline-none transition focus:border-toy-orange focus:bg-white focus:ring-4 focus:ring-amber-100"
            placeholder="••••••••"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-toy-orange px-5 py-3.5 text-xs font-black uppercase tracking-wide text-white shadow-md shadow-amber-200 transition hover:bg-amber-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthShell>
  );
}
