"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function StorefrontError({ error, reset }) {
  useEffect(() => {
    console.error("Storefront error:", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-rose-100 text-5xl">
        🛠️
      </div>
      <p className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-rose-600">
        Something went wrong
      </p>
      <h1 className="mt-2 text-3xl font-black tracking-tight text-ink-900 sm:text-4xl">
        That page hit a snag
      </h1>
      <p className="mt-3 text-sm leading-6 text-slate-500">
        We&apos;ve logged the problem. You can try again, or keep browsing while we fix it.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-xl bg-ink-900 px-6 py-3 text-sm font-black text-white transition hover:bg-ink-800"
        >
          Try again
        </button>
        <Link
          href="/shop"
          className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-ink-700 transition hover:border-brand-400 hover:text-brand-700"
        >
          Back to shop
        </Link>
      </div>
    </div>
  );
}
