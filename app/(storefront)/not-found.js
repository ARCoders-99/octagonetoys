import Link from "next/link";

export const metadata = {
  title: "Page not found",
};

export default function StorefrontNotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-brand-100 text-5xl">
        🧩
      </div>
      <p className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-brand-700">
        Error 404
      </p>
      <h1 className="mt-2 text-3xl font-black tracking-tight text-ink-900 sm:text-4xl">
        We couldn&apos;t find that page
      </h1>
      <p className="mt-3 text-sm leading-6 text-slate-500">
        The link may be outdated, or the toy may have been retired. Try the shop — there are
        plenty more to discover.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link
          href="/shop"
          className="rounded-xl bg-ink-900 px-6 py-3 text-sm font-black text-white transition hover:bg-ink-800"
        >
          Browse all toys
        </Link>
        <Link
          href="/"
          className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-ink-700 transition hover:border-brand-400 hover:text-brand-700"
        >
          Back home
        </Link>
      </div>
    </div>
  );
}
