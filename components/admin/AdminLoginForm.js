"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginForm() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
        body: JSON.stringify({ ...form, mode: "admin" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not sign you in");

      router.push("/admin");
      router.refresh();
    } catch (requestError) {
      setError(requestError.message);
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden bg-ink-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-2">
          <Image
            src="/brand/logo.png"
            alt="Octagonetoys"
            width={640}
            height={643}
            sizes="140px"
            className="h-14 w-auto object-contain"
          />
        </div>

        <div className="max-w-md">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-300">
            Store management
          </p>
          <h1 className="mt-3 text-4xl font-black leading-tight">
            Everything your store needs, in one place.
          </h1>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            Track sales, manage inventory, moderate reviews and fulfil orders — without touching a
            single line of code.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-slate-300">
            {[
              "Live sales dashboard and 14-day trends",
              "Product uploads with images and collections",
              "Order statuses, tracking and customer snapshots",
              "Review moderation with automatic rating updates",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-500/20 text-[11px] text-emerald-300">
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-slate-500">© {new Date().getFullYear()} Octagonetoys</p>
      </div>

      <div className="flex items-center justify-center bg-slate-50 px-4 py-14">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
          <div className="flex items-center gap-2 lg:hidden">
            <Image
              src="/brand/logo.png"
              alt="Octagonetoys"
              width={640}
              height={643}
              sizes="120px"
              className="h-12 w-auto object-contain"
            />
          </div>

          <p className="mt-4 text-xs font-black uppercase tracking-[0.18em] text-brand-700 lg:mt-0">
            Admin access
          </p>
          <h2 className="mt-1 text-3xl font-black text-ink-900">Sign in</h2>
          <p className="mt-2 text-sm text-slate-500">Use your store admin account to continue.</p>

          {error && (
            <div className="mt-4 rounded-xl bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-700">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="mt-5 space-y-4">
            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-slate-700">Email</span>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={update}
                required
                autoComplete="email"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand-500"
                placeholder="admin@store.com"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-slate-700">Password</span>
              <span className="relative block">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={update}
                  required
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-3 pr-11 outline-none focus:border-brand-500"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  {showPassword ? (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      className="h-5 w-5"
                      aria-hidden="true"
                    >
                      <path d="M3 3l18 18" strokeLinecap="round" />
                      <path d="M10.6 6.2A9.7 9.7 0 0 1 12 6c5 0 8.5 4.5 9.5 6a13.7 13.7 0 0 1-3.3 3.8M6.4 6.5A14.6 14.6 0 0 0 2.5 12c1 1.5 4.5 6 9.5 6a9.7 9.7 0 0 0 3.7-.7" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      className="h-5 w-5"
                      aria-hidden="true"
                    >
                      <path d="M2.5 12S6 6 12 6s9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-ink-900 px-5 py-3 text-sm font-black text-white transition hover:bg-ink-800 disabled:opacity-60"
            >
              {loading ? "Signing in…" : "Enter admin panel"}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-slate-400">
            Not staff?{" "}
            <Link href="/" className="font-semibold underline hover:text-ink-900">
              Back to the store
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
