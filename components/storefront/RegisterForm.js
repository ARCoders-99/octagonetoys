"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/storefront/AuthShell";

export default function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
  });
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
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not create your account");

      router.push("/account");
      router.refresh();
    } catch (requestError) {
      setError(requestError.message);
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Join the fun"
      title="Create an account"
      subtitle="Faster checkout, order history and early access to new toys."
      perks={[
        {
          icon: "🚚",
          title: "Free delivery over Rs. 3,999",
          body: "Nationwide shipping with cash on delivery.",
        },
        {
          icon: "🧸",
          title: "Save your favourites",
          body: "Keep a wishlist and reorder gifts in seconds.",
        },
        {
          icon: "🔒",
          title: "Safe, secure checkout",
          body: "Your details are encrypted and never shared.",
        },
      ]}
      footer={
        <p className="mt-5 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-toy-purple hover:text-violet-700">
            Sign in
          </Link>
        </p>
      }
    >
      {error && (
        <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 ring-1 ring-rose-100">
          {error}
        </div>
      )}

      <form onSubmit={submit} className="mt-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">
              First name
            </span>
            <input
              name="firstName"
              value={form.firstName}
              onChange={update}
              autoComplete="given-name"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm outline-none transition focus:border-toy-orange focus:bg-white focus:ring-4 focus:ring-amber-100"
              placeholder="Ayesha"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">
              Last name
            </span>
            <input
              name="lastName"
              value={form.lastName}
              onChange={update}
              autoComplete="family-name"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm outline-none transition focus:border-toy-orange focus:bg-white focus:ring-4 focus:ring-amber-100"
              placeholder="Khan"
            />
          </label>
        </div>

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
          <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">
            Phone <span className="font-semibold normal-case tracking-normal text-slate-400">(optional)</span>
          </span>
          <input
            name="phone"
            value={form.phone}
            onChange={update}
            autoComplete="tel"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm outline-none transition focus:border-toy-orange focus:bg-white focus:ring-4 focus:ring-amber-100"
            placeholder="03xx xxxxxxx"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">
            Password
          </span>
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={update}
            required
            minLength={6}
            autoComplete="new-password"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm outline-none transition focus:border-toy-orange focus:bg-white focus:ring-4 focus:ring-amber-100"
            placeholder="At least 6 characters"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-toy-orange px-5 py-3.5 text-xs font-black uppercase tracking-wide text-white shadow-md shadow-amber-200 transition hover:bg-amber-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>
    </AuthShell>
  );
}
