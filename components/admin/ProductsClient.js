"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/components/admin/adminFetch";
import {
  Badge,
  EmptyState,
  ErrorBanner,
  PageHeader,
  Spinner,
  buttonPrimary,
  buttonSecondary,
  inputClass,
} from "@/components/admin/ui";
import { formatPrice } from "@/lib/format";

const SORT_OPTIONS = [
  ["newest", "Newest"],
  ["oldest", "Oldest"],
  ["name", "Name A–Z"],
  ["price_asc", "Price low → high"],
  ["price_desc", "Price high → low"],
  ["stock_asc", "Stock low → high"],
  ["stock_desc", "Stock high → low"],
];

export default function ProductsClient() {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  const [filters, setFilters] = useState({
    search: "",
    isActive: "",
    isFeatured: "",
    lowStock: "",
    sort: "newest",
    page: 1,
  });

  const load = useCallback(async (nextFilters = filters) => {
    setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams();
      Object.entries(nextFilters).forEach(([key, value]) => {
        if (value !== "" && value != null) query.set(key, String(value));
      });
      const data = await adminFetch(`/api/admin/products?${query.toString()}`);
      setProducts(data.products || []);
      setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value, page: key === "page" ? value : 1 }));
  };

  const toggleField = async (product, field) => {
    setBusyId(product._id);
    setError("");
    try {
      const data = await adminFetch(`/api/admin/products/${product._id}`, {
        method: "PATCH",
        body: JSON.stringify({ [field]: !product[field] }),
      });
      setProducts((current) =>
        current.map((item) => (item._id === product._id ? { ...item, ...data.product } : item))
      );
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyId("");
    }
  };

  const removeProduct = async (product) => {
    if (!window.confirm(`Delete “${product.name}”? It will be hidden from the store but order history is kept.`)) {
      return;
    }

    setBusyId(product._id);
    setError("");
    try {
      await adminFetch(`/api/admin/products/${product._id}`, { method: "DELETE" });
      setProducts((current) => current.filter((item) => item._id !== product._id));
      setPagination((current) => ({ ...current, total: Math.max(0, current.total - 1) }));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Products" description="Add, edit, feature and retire products. Deleted products are soft-deleted so order history stays intact.">
        <Link href="/admin/products/new" className={buttonPrimary}>
          + Add product
        </Link>
      </PageHeader>

      <ErrorBanner message={error} onRetry={() => load(filters)} />

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <input
            value={filters.search}
            onChange={(event) => updateFilter("search", event.target.value)}
            placeholder="Search name, SKU, slug…"
            className={inputClass}
          />
          <select value={filters.isActive} onChange={(event) => updateFilter("isActive", event.target.value)} className={inputClass}>
            <option value="">All statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <select value={filters.isFeatured} onChange={(event) => updateFilter("isFeatured", event.target.value)} className={inputClass}>
            <option value="">Featured: any</option>
            <option value="true">Featured only</option>
            <option value="false">Not featured</option>
          </select>
          <select value={filters.lowStock} onChange={(event) => updateFilter("lowStock", event.target.value)} className={inputClass}>
            <option value="">Stock: any</option>
            <option value="true">Low stock only</option>
          </select>
          <select value={filters.sort} onChange={(event) => updateFilter("sort", event.target.value)} className={inputClass}>
            {SORT_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <p className="mt-3 text-xs text-slate-400">
          {pagination.total} product{pagination.total === 1 ? "" : "s"} found
        </p>
      </div>

      {loading ? (
        <Spinner label="Loading products…" />
      ) : products.length === 0 ? (
        <EmptyState
          icon="🏷️"
          title="No products match these filters"
          description="Try clearing the filters or add your first product."
        >
          <Link href="/admin/products/new" className={buttonPrimary}>
            Add product
          </Link>
        </EmptyState>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-bold">Product</th>
                  <th className="px-4 py-3 font-bold">Price</th>
                  <th className="px-4 py-3 font-bold">Stock</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                  <th className="px-4 py-3 font-bold">Featured</th>
                  <th className="px-4 py-3 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const stock = Number(product.stock) || 0;
                  const low = stock <= (Number(product.lowStockThreshold) || 5);
                  const image = product.images?.[0]?.url;

                  return (
                    <tr key={product._id} className="border-t border-slate-100 align-middle">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                            {image ? (
                              <Image src={image} alt={product.name} fill sizes="48px" className="object-cover" />
                            ) : (
                              <div className="grid h-full place-items-center text-lg">🧸</div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <Link href={`/admin/products/${product._id}/edit`} className="block truncate font-bold text-ink-900 hover:text-brand-700">
                              {product.name}
                            </Link>
                            <p className="truncate text-xs text-slate-400">
                              {product.sku ? `SKU ${product.sku}` : product.slug}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <p className="font-bold text-ink-900">{formatPrice(product.price)}</p>
                        {product.salePrice != null && (
                          <p className="text-xs font-semibold text-rose-600">
                            Sale {formatPrice(product.salePrice)}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <Badge tone={stock === 0 ? "danger" : low ? "warning" : "success"}>
                          {stock === 0 ? "Out of stock" : `${stock} in stock`}
                        </Badge>
                        {stock > 0 && low && (
                          <p className="mt-1 text-[11px] text-amber-700">At or below alert level</p>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <Badge tone={product.isActive ? "success" : "slate"}>
                          {product.isActive ? "Active" : "Hidden"}
                        </Badge>
                      </td>

                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => toggleField(product, "isFeatured")}
                          disabled={busyId === product._id}
                          className={`relative h-6 w-11 rounded-full transition ${
                            product.isFeatured ? "bg-brand-500" : "bg-slate-200"
                          } disabled:opacity-50`}
                          aria-label={product.isFeatured ? "Remove featured" : "Mark featured"}
                        >
                          <span
                            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                              product.isFeatured ? "left-[22px]" : "left-0.5"
                            }`}
                          />
                        </button>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => toggleField(product, "isActive")}
                            disabled={busyId === product._id}
                            className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:border-slate-300 disabled:opacity-50"
                          >
                            {product.isActive ? "Hide" : "Publish"}
                          </button>
                          <Link
                            href={`/admin/products/${product._id}/edit`}
                            className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-ink-700 hover:border-slate-300"
                          >
                            Edit
                          </Link>
                          <button
                            type="button"
                            onClick={() => removeProduct(product)}
                            disabled={busyId === product._id}
                            className="rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-4 py-3 text-sm">
            <p className="text-xs text-slate-400">
              Page {pagination.page} of {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => updateFilter("page", Math.max(1, pagination.page - 1))}
                disabled={pagination.page <= 1}
                className={buttonSecondary}
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => updateFilter("page", Math.min(pagination.totalPages, pagination.page + 1))}
                disabled={pagination.page >= pagination.totalPages}
                className={buttonSecondary}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
