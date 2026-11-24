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
  inputClass,
} from "@/components/admin/ui";

export default function CollectionsClient() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState("");

  const load = useCallback(async (term = "") => {
    setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams({ limit: "100" });
      if (term.trim()) query.set("search", term.trim());
      const data = await adminFetch(`/api/admin/collections?${query.toString()}`);
      setCollections(data.collections || []);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load("");
  }, [load]);

  const toggleField = async (collection, field) => {
    setBusyId(collection._id);
    setError("");
    try {
      const data = await adminFetch(`/api/admin/collections/${collection._id}`, {
        method: "PATCH",
        body: JSON.stringify({ [field]: !collection[field] }),
      });
      setCollections((current) =>
        current.map((item) =>
          item._id === collection._id ? { ...item, ...data.collection } : item
        )
      );
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyId("");
    }
  };

  const removeCollection = async (collection) => {
    if (!window.confirm(`Delete “${collection.name}”? Products stay in the catalogue but this collection will disappear.`)) {
      return;
    }

    setBusyId(collection._id);
    setError("");
    try {
      await adminFetch(`/api/admin/collections/${collection._id}`, { method: "DELETE" });
      setCollections((current) => current.filter((item) => item._id !== collection._id));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Collections" description="Group products into seasonal, age-based or themed collections. The order here sets the storefront navigation order.">
        <Link href="/admin/collections/new" className={buttonPrimary}>
          + New collection
        </Link>
      </PageHeader>

      <ErrorBanner message={error} onRetry={() => load(search)} />

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            load(search);
          }}
          className="flex flex-wrap gap-2"
        >
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search collections…"
            className={`${inputClass} max-w-sm`}
          />
          <button type="submit" className="rounded-xl bg-ink-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-ink-800">
            Search
          </button>
        </form>
      </div>

      {loading ? (
        <Spinner label="Loading collections…" />
      ) : collections.length === 0 ? (
        <EmptyState
          icon="🗂️"
          title="No collections yet"
          description="Create your first collection to organise the storefront."
        >
          <Link href="/admin/collections/new" className={buttonPrimary}>
            New collection
          </Link>
        </EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {collections.map((collection) => (
            <div key={collection._id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="relative aspect-[16/9] bg-brand-100">
                {collection.image ? (
                  <Image src={collection.image} alt={collection.name} fill sizes="(max-width: 768px) 90vw, 33vw" className="object-cover" />
                ) : (
                  <div className="grid h-full place-items-center text-5xl">🗂️</div>
                )}
                <div className="absolute left-3 top-3 flex gap-2">
                  <Badge tone={collection.isActive ? "success" : "slate"}>
                    {collection.isActive ? "Active" : "Hidden"}
                  </Badge>
                  {collection.isFeatured && <Badge tone="brand">Featured</Badge>}
                </div>
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-black text-ink-900">{collection.name}</h2>
                    <p className="truncate text-xs text-slate-400">/collections/{collection.slug}</p>
                  </div>
                  <Badge tone="info">{collection.productCount ?? 0} products</Badge>
                </div>

                <p className="mt-2 line-clamp-2 min-h-10 text-xs leading-5 text-slate-500">
                  {collection.description || "No description yet."}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Link
                    href={`/admin/collections/${collection._id}/edit`}
                    className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-ink-700 hover:border-slate-300"
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    onClick={() => toggleField(collection, "isActive")}
                    disabled={busyId === collection._id}
                    className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:border-slate-300 disabled:opacity-50"
                  >
                    {collection.isActive ? "Hide" : "Publish"}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleField(collection, "isFeatured")}
                    disabled={busyId === collection._id}
                    className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:border-slate-300 disabled:opacity-50"
                  >
                    {collection.isFeatured ? "Unfeature" : "Feature"}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeCollection(collection)}
                    disabled={busyId === collection._id}
                    className="ml-auto rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
