"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { adminFetch } from "@/components/admin/adminFetch";
import {
  Card,
  ErrorBanner,
  Field,
  PageHeader,
  Spinner,
  buttonPrimary,
  buttonSecondary,
  inputClass,
} from "@/components/admin/ui";
import { formatPrice } from "@/lib/format";

const EMPTY_FORM = {
  name: "",
  slug: "",
  description: "",
  image: "",
  isActive: true,
  isFeatured: false,
  position: "0",
};

function slugify(value = "") {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function CollectionForm({ collectionId = null }) {
  const isEdit = Boolean(collectionId);
  const router = useRouter();

  const [form, setForm] = useState(EMPTY_FORM);
  const [slugTouched, setSlugTouched] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const productsData = await adminFetch("/api/admin/products?limit=100&sort=name");
        if (!active) return;
        const catalogue = productsData.products || [];
        setProducts(catalogue);

        if (isEdit) {
          const data = await adminFetch(`/api/admin/collections/${collectionId}`);
          if (!active) return;
          const collection = data.collection;

          setForm({
            name: collection.name || "",
            slug: collection.slug || "",
            description: collection.description || "",
            image: collection.image || "",
            isActive: collection.isActive !== false,
            isFeatured: Boolean(collection.isFeatured),
            position: String(collection.position ?? 0),
          });
          setSlugTouched(true);

          const ids = (collection.products || [])
            .slice()
            .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
            .map((item) => String(item.productId?._id || item.productId))
            .filter(Boolean);

          const available = new Set(catalogue.map((product) => String(product._id)));
          setSelectedIds(ids.filter((id) => available.has(id)));
        }
      } catch (requestError) {
        if (active) setError(requestError.message);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [isEdit, collectionId]);

  const productMap = useMemo(() => {
    const map = new Map();
    products.forEach((product) => map.set(String(product._id), product));
    return map;
  }, [products]);

  const availableProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products
      .filter((product) => !selectedIds.includes(String(product._id)))
      .filter((product) =>
        term
          ? product.name.toLowerCase().includes(term) ||
            String(product.sku || "").toLowerCase().includes(term)
          : true
      )
      .slice(0, 40);
  }, [products, selectedIds, search]);

  const update = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  };

  const updateName = (event) => {
    const value = event.target.value;
    setForm((current) => ({
      ...current,
      name: value,
      slug: slugTouched ? current.slug : slugify(value),
    }));
  };

  const addProduct = (id) => setSelectedIds((current) => [...current, id]);
  const removeProduct = (id) => setSelectedIds((current) => current.filter((item) => item !== id));

  const moveProduct = (index, direction) => {
    setSelectedIds((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const uploadImage = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploading(true);
    setError("");
    try {
      const body = new FormData();
      body.append("files", file);
      const data = await adminFetch("/api/admin/upload", { method: "POST", body });
      setForm((current) => ({ ...current, image: data.images?.[0]?.url || "" }));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setUploading(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("Collection name is required.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      slug: form.slug || slugify(form.name),
      description: form.description.trim(),
      image: form.image,
      isActive: form.isActive,
      isFeatured: form.isFeatured,
      position: Math.round(Number(form.position) || 0),
      products: selectedIds.map((id, index) => ({ productId: id, position: index })),
    };

    setSaving(true);
    try {
      await adminFetch(
        isEdit ? `/api/admin/collections/${collectionId}` : "/api/admin/collections",
        {
          method: isEdit ? "PUT" : "POST",
          body: JSON.stringify(payload),
        }
      );
      router.push("/admin/collections");
      router.refresh();
    } catch (requestError) {
      setError(requestError.message);
      setSaving(false);
    }
  };

  if (loading) return <Spinner label="Loading collection…" />;

  return (
    <form onSubmit={submit} className="space-y-6">
      <PageHeader
        title={isEdit ? "Edit collection" : "New collection"}
        description="Collections power the storefront navigation and curated landing pages."
      >
        <Link href="/admin/collections" className={buttonSecondary}>
          Cancel
        </Link>
        <button type="submit" disabled={saving} className={buttonPrimary}>
          {saving ? "Saving…" : isEdit ? "Save changes" : "Create collection"}
        </button>
      </PageHeader>

      <ErrorBanner message={error} />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card>
            <h2 className="text-lg font-black text-ink-900">Details</h2>
            <div className="mt-4 space-y-4">
              <Field label="Collection name *">
                <input name="name" value={form.name} onChange={updateName} className={inputClass} placeholder="Building blocks" />
              </Field>
              <Field label="Slug" hint="Used in the collection URL.">
                <input
                  name="slug"
                  value={form.slug}
                  onChange={(event) => {
                    setSlugTouched(true);
                    update(event);
                  }}
                  className={inputClass}
                />
              </Field>
              <Field label="Description">
                <textarea name="description" value={form.description} onChange={update} rows={4} className={inputClass} placeholder="Describe what makes this collection special." />
              </Field>
            </div>
          </Card>

          <Card>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-black text-ink-900">Products in this collection</h2>
                <p className="text-xs text-slate-500">Drag-free ordering: use the arrows to control display position.</p>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                {selectedIds.length} selected
              </span>
            </div>

            {selectedIds.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-400">
                No products selected yet. Add products from the catalogue below.
              </div>
            ) : (
              <ol className="mt-4 space-y-2">
                {selectedIds.map((id, index) => {
                  const product = productMap.get(id);
                  return (
                    <li key={id} className="flex items-center gap-3 rounded-xl border border-slate-200 p-2.5">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-xs font-black text-slate-500">
                        {index + 1}
                      </span>
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                        {product?.images?.[0]?.url ? (
                          <Image src={product.images[0].url} alt={product.name} fill sizes="40px" className="object-cover" />
                        ) : (
                          <div className="grid h-full place-items-center text-sm">🧸</div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-ink-900">
                          {product?.name || "Product unavailable"}
                        </p>
                        {product && (
                          <p className="text-xs text-slate-400">
                            {formatPrice(product.salePrice ?? product.price)}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <button type="button" onClick={() => moveProduct(index, -1)} disabled={index === 0} className="rounded border border-slate-200 px-2 py-1 text-xs font-bold text-slate-600 disabled:opacity-40">
                          ↑
                        </button>
                        <button type="button" onClick={() => moveProduct(index, 1)} disabled={index === selectedIds.length - 1} className="rounded border border-slate-200 px-2 py-1 text-xs font-bold text-slate-600 disabled:opacity-40">
                          ↓
                        </button>
                        <button type="button" onClick={() => removeProduct(id)} className="rounded border border-rose-200 px-2 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50">
                          Remove
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </Card>

          <Card>
            <h2 className="text-lg font-black text-ink-900">Add products</h2>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search the catalogue…"
              className={`${inputClass} mt-3`}
            />
            <ul className="mt-3 max-h-80 space-y-1 overflow-auto pr-1">
              {availableProducts.length === 0 && (
                <li className="rounded-lg bg-slate-50 px-3 py-4 text-center text-xs text-slate-400">
                  No more products match your search.
                </li>
              )}
              {availableProducts.map((product) => (
                <li key={product._id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50">
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-700">
                    {product.name}
                  </span>
                  <span className="text-xs text-slate-400">{formatPrice(product.price)}</span>
                  <button
                    type="button"
                    onClick={() => addProduct(String(product._id))}
                    className="rounded-lg bg-ink-900 px-2.5 py-1 text-xs font-bold text-white hover:bg-ink-800"
                  >
                    Add
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="text-lg font-black text-ink-900">Cover image</h2>
            <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
              <div className="relative aspect-[16/9] bg-slate-100">
                {form.image ? (
                  <Image src={form.image} alt={form.name || "Collection cover"} fill sizes="340px" className="object-cover" />
                ) : (
                  <div className="grid h-full place-items-center text-4xl">🗂️</div>
                )}
              </div>
            </div>

            <div className="mt-3 flex gap-2">
              <label className={`${buttonSecondary} flex-1 cursor-pointer justify-center`}>
                {uploading ? "Uploading…" : "Upload"}
                <input type="file" accept="image/*" onChange={uploadImage} className="hidden" disabled={uploading} />
              </label>
              {form.image && (
                <button type="button" onClick={() => setForm((current) => ({ ...current, image: "" }))} className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50">
                  Remove
                </button>
              )}
            </div>

            <input
              value={form.image}
              onChange={(event) => setForm((current) => ({ ...current, image: event.target.value }))}
              placeholder="Or paste an image URL"
              className={`${inputClass} mt-2`}
            />
          </Card>

          <Card>
            <h2 className="text-lg font-black text-ink-900">Publishing</h2>
            <div className="mt-4 space-y-3">
              <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2.5">
                <span>
                  <span className="block text-sm font-bold text-ink-900">Active</span>
                  <span className="block text-xs text-slate-500">Visible on the storefront.</span>
                </span>
                <input type="checkbox" name="isActive" checked={form.isActive} onChange={update} className="h-4 w-4 rounded text-brand-600" />
              </label>
              <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2.5">
                <span>
                  <span className="block text-sm font-bold text-ink-900">Featured</span>
                  <span className="block text-xs text-slate-500">Highlight in home page collections.</span>
                </span>
                <input type="checkbox" name="isFeatured" checked={form.isFeatured} onChange={update} className="h-4 w-4 rounded text-brand-600" />
              </label>
              <Field label="Navigation order" hint="Lower numbers appear first.">
                <input name="position" type="number" step="1" value={form.position} onChange={update} className={inputClass} />
              </Field>
            </div>
          </Card>

          <button type="submit" disabled={saving} className={`${buttonPrimary} w-full`}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Create collection"}
          </button>
        </div>
      </div>
    </form>
  );
}
