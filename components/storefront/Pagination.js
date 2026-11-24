import Link from "next/link";

function buildHref(basePath, params, page) {
  const query = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  });
  if (page > 1) query.set("page", String(page));
  const qs = query.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export default function Pagination({ page = 1, totalPages = 1, basePath = "/shop", params = {} }) {
  if (!totalPages || totalPages <= 1) return null;

  const current = Math.min(Math.max(1, page), totalPages);
  const pages = [];
  const start = Math.max(1, current - 2);
  const end = Math.min(totalPages, current + 2);

  for (let index = start; index <= end; index += 1) pages.push(index);

  return (
    <nav className="mt-10 flex flex-wrap items-center justify-center gap-2" aria-label="Pagination">
      {current > 1 && (
        <Link
          href={buildHref(basePath, params, current - 1)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-ink-700 hover:border-brand-400"
        >
          Previous
        </Link>
      )}

      {start > 1 && (
        <>
          <Link
            href={buildHref(basePath, params, 1)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-ink-700 hover:border-brand-400"
          >
            1
          </Link>
          {start > 2 && <span className="px-1 text-slate-400">…</span>}
        </>
      )}

      {pages.map((item) => (
        <Link
          key={item}
          href={buildHref(basePath, params, item)}
          aria-current={item === current ? "page" : undefined}
          className={`rounded-lg px-3.5 py-2 text-sm font-bold ${
            item === current
              ? "bg-ink-900 text-white"
              : "border border-slate-200 bg-white text-ink-700 hover:border-brand-400"
          }`}
        >
          {item}
        </Link>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="px-1 text-slate-400">…</span>}
          <Link
            href={buildHref(basePath, params, totalPages)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-ink-700 hover:border-brand-400"
          >
            {totalPages}
          </Link>
        </>
      )}

      {current < totalPages && (
        <Link
          href={buildHref(basePath, params, current + 1)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-ink-700 hover:border-brand-400"
        >
          Next
        </Link>
      )}
    </nav>
  );
}
