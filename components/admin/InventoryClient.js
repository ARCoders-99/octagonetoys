"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { adminFetch } from "@/components/admin/adminFetch";
import {
  Badge,
  EmptyState,
  ErrorBanner,
  PageHeader,
  Spinner,
  buttonPrimary,
  inputClass,
} from "@/components/admin/ui";
import { formatPrice } from "@/lib/format";

export default function InventoryClient() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [drafts, setDrafts] = useState({});
  const [busyId, setBusyId] = useState("");

  const load = useCallback(async (term = "", lowOnly = false) => {
    setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams({ limit: "100", sort: "stock_asc" });
      if (term.trim()) query.set("search", term.trim());
      if (lowOnly) query.set("lowStock", "true");
      const data = await adminFetch(`/api/admin/products?${query.toString()}`);
      const list = data.products || [];
      setProducts(list);
      setDrafts(
        Object.fromEntries(list.map((product) => [product._id, String(product.stock ?? 0)]))
      );
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load("", false);
  }, [load]);

  const summary = useMemo(() => {
    const out = products.filter((product) => Number(product.stock) <= 0).length;
    const low = products.filter(
      (product) =>
        Number(product.stock) > 0 &&
        Number(product.stock) <= (Number(product.lowStockThreshold) || 5)
    ).length;
    const units = products.reduce((sum, product) => sum + (Number(product.stock) || 0), 0);
    return { out, low, units };
  }, [products]);

  const adjust = (product, delta) => {
    setDrafts((current) => {
      const next = Math.max(0, Math.round(Number(current[product._id] ?? product.stock) + delta));
      return { ...current, [product._id]: String(next) };
    });
  };

  const saveStock = async (product) => {
    const value = Math.max(0, Math.round(Number(drafts[product._id]) || 0));
    setBusyId(product._id);
    setError("");
    setSuccess("");
    try {
      const data = await adminFetch(`/api/admin/products/${product._id}`, {
        method: "PATCH",
        body: JSON.stringify({ stock: value }),
      });
      setProducts((current) =>
        current.map((item) => (item._id === product._id ? { ...item, ...data.product } : item))
      );
      setSuccess(`Stock updated for “${product.name}”.`);
      window.setTimeout(() => setSuccess(""), 2500);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        description="Real-time stock levels. Products at or below their alert threshold are highlighted."
      >
        <Link href="/admin/products" className={buttonPrimary}>
          Manage products
        </Link>
      </PageHeader>

      <ErrorBanner message={error} onRetry={() => load(search, lowStockOnly)} />
      {success && (
        <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {success}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Units in stock</p>
          <p className="mt-1 text-2xl font-black text-ink-900">{summary.units}</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Low stock</p>
          <p className="mt-1 text-2xl font-black text-ink-900">{summary.low}</p>
        </div>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-rose-700">Out of stock</p>
          <p className="mt-1 text-2xl font-black text-ink-900">{summary.out}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            load(search, lowStockOnly);
          }}
          className="flex flex-wrap items-center gap-3"
        >
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search products…"
            className={`${inputClass} max-w-sm`}
          />
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(event) => {
                setLowStockOnly(event.target.checked);
                load(search, event.target.checked);
              }}
              className="h-4 w-4 rounded text-brand-600"
            />
            Low stock only
          </label>
          <button type="submit" className="rounded-xl bg-ink-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-ink-800">
            Search
          </button>
        </form>
      </div>

      {loading ? (
        <Spinner label="Loading inventory…" />
      ) : products.length === 0 ? (
        <EmptyState icon="📦" title="No products found" description="Add products to start tracking stock." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-bold">Product</th>
                  <th className="px-4 py-3 font-bold">Price</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                  <th className="px-4 py-3 font-bold">Stock</th>
                  <th className="px-4 py-3 text-right font-bold">Update</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const stock = Number(product.stock) || 0;
                  const threshold = Number(product.lowStockThreshold) || 5;
                  const low = stock > 0 && stock <= threshold;
                  const out = stock <= 0;

                  return (
                    <tr key={product._id} className="border-t border-slate-100">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                            {product.images?.[0]?.url ? (
                              <Image src={product.images[0].url} alt={product.name} fill sizes="44px" className="object-cover" />
                            ) : (
                              <div className="grid h-full place-items-center text-base">🧸</div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <Link href={`/admin/products/${product._id}/edit`} className="block truncate font-bold text-ink-900 hover:text-brand-700">
                              {product.name}
                            </Link>
                            <p className="text-xs text-slate-400">
                              Alert at {threshold} · {product.sku || product.slug}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-bold text-ink-900">{formatPrice(product.price)}</td>
                      <td className="px-4 py-3">
                        <Badge tone={out ? "danger" : low ? "warning" : "success"}>
                          {out ? "Out of stock" : low ? "Low stock" : "Healthy"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => adjust(product, -1)}
                            disabled={Number(drafts[product._id]) <= 0}
                            className="h-8 w-8 rounded-lg border border-slate-200 text-base font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={drafts[product._id] ?? String(stock)}
                            onChange={(event) =>
                              setDrafts((current) => ({ ...current, [product._id]: event.target.value }))
                            }
                            className="w-20 rounded-lg border border-slate-200 px-2 py-1.5 text-center text-sm font-bold outline-none focus:border-brand-500"
                          />
                          <button
                            type="button"
                            onClick={() => adjust(product, 1)}
                            className="h-8 w-8 rounded-lg border border-slate-200 text-base font-bold text-slate-600 hover:bg-slate-50"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => saveStock(product)}
                          disabled={busyId === product._id || String(stock) === String(drafts[product._id])}
                          className="rounded-lg bg-ink-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-ink-800 disabled:opacity-40"
                        >
                          {busyId === product._id ? "Saving…" : "Save"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-xs text-slate-400">
        Low-stock alerts use each product&apos;s own threshold. You can change the threshold while editing a product.
      </p>
    </div>
  );
}
