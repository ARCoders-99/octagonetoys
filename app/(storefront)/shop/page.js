import Link from "next/link";
import ProductCard from "@/components/storefront/ProductCard";
import Pagination from "@/components/storefront/Pagination";
import {
  AGE_BUCKET_LABELS,
  getActiveCollections,
  getStorefrontProducts,
} from "@/lib/server/data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Shop all toys",
  description:
    "Browse every toy in the Octagonetoys store. Filter by collection, price, availability and rating.",
};

const SORT_OPTIONS = [
  ["featured", "Featured"],
  ["newest", "Newest first"],
  ["price_asc", "Price: low to high"],
  ["price_desc", "Price: high to low"],
  ["rating", "Top rated"],
  ["name", "Name A–Z"],
];

export default async function ShopPage({ searchParams }) {
  const params = await searchParams;

  const q = typeof params.q === "string" ? params.q : "";
  const collection = typeof params.collection === "string" ? params.collection : "";
  const sort = typeof params.sort === "string" ? params.sort : "featured";
  const inStock = params.inStock === "true";
  const age = typeof params.age === "string" ? params.age : "";
  const minPriceRupees = params.minPrice ? Number(params.minPrice) : null;
  const maxPriceRupees = params.maxPrice ? Number(params.maxPrice) : null;
  const page = Math.max(1, Number(params.page) || 1);

  let result = { products: [], total: 0, totalPages: 1, page: 1 };
  let collections = [];

  try {
    [result, collections] = await Promise.all([
      getStorefrontProducts({
        q,
        collection,
        sort,
        inStock,
        age,
        minPrice: Number.isFinite(minPriceRupees) ? Math.round(minPriceRupees * 100) : null,
        maxPrice: Number.isFinite(maxPriceRupees) ? Math.round(maxPriceRupees * 100) : null,
        page,
        limit: 12,
      }),
      getActiveCollections({ limit: 30 }),
    ]);
  } catch (error) {
    console.error("Shop page data error:", error.message);
  }

  const baseParams = {
    q,
    collection,
    sort,
    age,
    inStock: inStock ? "true" : "",
    minPrice: minPriceRupees ? String(minPriceRupees) : "",
    maxPrice: maxPriceRupees ? String(maxPriceRupees) : "",
  };

  const activeFilters = [
    q && `“${q}”`,
    collection && "collection",
    age && AGE_BUCKET_LABELS[age],
    inStock && "in stock",
  ].filter(Boolean);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-700">Shop</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-ink-900 sm:text-4xl">
            All toys
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {result.total} {result.total === 1 ? "toy" : "toys"} found
            {activeFilters.length ? ` · ${activeFilters.join(" · ")}` : ""}
          </p>
        </div>

        <form method="get" className="flex items-center gap-2">
          {q && <input type="hidden" name="q" value={q} />}
          {collection && <input type="hidden" name="collection" value={collection} />}
          {age && <input type="hidden" name="age" value={age} />}
          {inStock && <input type="hidden" name="inStock" value="true" />}
          {baseParams.minPrice && <input type="hidden" name="minPrice" value={baseParams.minPrice} />}
          {baseParams.maxPrice && <input type="hidden" name="maxPrice" value={baseParams.maxPrice} />}
          <label className="text-sm font-semibold text-slate-500" htmlFor="sort">
            Sort
          </label>
          <select
            id="sort"
            name="sort"
            defaultValue={sort}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-ink-800 outline-none focus:border-brand-500"
          >
            {SORT_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-xl bg-ink-900 px-4 py-2 text-sm font-bold text-white hover:bg-ink-800"
          >
            Apply
          </button>
        </form>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-5 lg:sticky lg:top-28">
          <h2 className="text-sm font-black uppercase tracking-wide text-ink-900">Filters</h2>

          <form method="get" className="mt-4 space-y-5">
            <input type="hidden" name="sort" value={sort} />

            <div>
              <label htmlFor="filter-q" className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Search
              </label>
              <input
                id="filter-q"
                name="q"
                defaultValue={q}
                placeholder="Blocks, RC car…"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label htmlFor="filter-collection" className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Collection
              </label>
              <select
                id="filter-collection"
                name="collection"
                defaultValue={collection}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
              >
                <option value="">All collections</option>
                {collections.map((item) => (
                  <option key={item._id} value={item.slug}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="filter-age" className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Age
              </label>
              <select
                id="filter-age"
                name="age"
                defaultValue={age}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
              >
                <option value="">All ages</option>
                {Object.entries(AGE_BUCKET_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Price (Rs)
              </span>
              <div className="flex items-center gap-2">
                <input
                  name="minPrice"
                  type="number"
                  min="0"
                  step="50"
                  defaultValue={baseParams.minPrice}
                  placeholder="Min"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                />
                <span className="text-slate-400">—</span>
                <input
                  name="maxPrice"
                  type="number"
                  min="0"
                  step="50"
                  defaultValue={baseParams.maxPrice}
                  placeholder="Max"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm font-semibold text-ink-700">
              <input
                type="checkbox"
                name="inStock"
                value="true"
                defaultChecked={inStock}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              In stock only
            </label>

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-black text-ink-900 hover:bg-brand-400"
              >
                Apply filters
              </button>
              <Link
                href="/shop"
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:border-slate-300"
              >
                Reset
              </Link>
            </div>
          </form>
        </aside>

        <div>
          {result.products.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
              <div className="text-4xl">🔍</div>
              <h2 className="mt-3 text-xl font-black text-ink-900">No toys match those filters</h2>
              <p className="mt-1 text-sm text-slate-500">
                Try a different search, widen the price range, or reset the filters.
              </p>
              <Link
                href="/shop"
                className="mt-5 inline-flex rounded-xl bg-ink-900 px-5 py-3 text-sm font-bold text-white hover:bg-ink-800"
              >
                Clear filters
              </Link>
            </div>
          ) : (
            <>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {result.products.map((product, index) => (
                  <ProductCard key={product._id} product={product} priority={index < 3} />
                ))}
              </div>

              <Pagination
                page={result.page}
                totalPages={result.totalPages}
                basePath="/shop"
                params={baseParams}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
