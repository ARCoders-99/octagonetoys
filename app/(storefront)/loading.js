export default function StorefrontLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="h-3 w-24 animate-pulse rounded-full bg-slate-200" />
      <div className="mt-4 h-9 w-64 animate-pulse rounded-xl bg-slate-200" />
      <div className="mt-3 h-4 w-96 max-w-full animate-pulse rounded-full bg-slate-100" />

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-3xl border border-slate-200 bg-white"
          >
            <div className="aspect-square animate-pulse bg-slate-100" />
            <div className="space-y-2 p-4">
              <div className="h-4 w-4/5 animate-pulse rounded-full bg-slate-200" />
              <div className="h-3 w-1/2 animate-pulse rounded-full bg-slate-100" />
              <div className="h-5 w-24 animate-pulse rounded-full bg-slate-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
