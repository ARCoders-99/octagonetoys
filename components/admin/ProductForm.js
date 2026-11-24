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
  sku: "",
  shortDescription: "",
  description: "",
  priceRupees: "",
  salePriceRupees: "",
  saleStart: "",
  saleEnd: "",
  stock: "0",
  lowStockThreshold: "5",
  isActive: true,
  isFeatured: false,
  position: "0",
  tags: "",
  collectionIds: [],
  images: [],
  metaTitle: "",
  metaDescription: "",
  metaKeywords: "",
};

function slugify(value = "") {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toDateInput(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export default function ProductForm({ productId = null }) {
  const isEdit = Boolean(productId);
  const router = useRouter();

  const [form, setForm] = useState(EMPTY_FORM);
  const [slugTouched, setSlugTouched] = useState(false);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const collectionsData = await adminFetch("/api/admin/collections?limit=100");
        if (!active) return;
        setCollections(collectionsData.collections || []);

        if (isEdit) {
          const data = await adminFetch(`/api/admin/products/${productId}`);
          if (!active) return;
          const product = data.product;

          setForm({
            name: product.name || "",
            slug: product.slug || "",
            sku: product.sku || "",
            shortDescription: product.shortDescription || "",
            description: product.description || "",
            priceRupees: String((Number(product.price) || 0) / 100),
            salePriceRupees:
              product.salePrice != null ? String(Number(product.salePrice) / 100) : "",
            saleStart: toDateInput(product.saleStart),
            saleEnd: toDateInput(product.saleEnd),
            stock: String(product.stock ?? 0),
            lowStockThreshold: String(product.lowStockThreshold ?? 5),
            isActive: product.isActive !== false,
            isFeatured: Boolean(product.isFeatured),
            position: String(product.position ?? 0),
            tags: (product.tags || []).join(", "),
            collectionIds: (product.collectionIds || []).map((item) => item._id || item),
            images: (product.images || []).map((image) => ({
              url: image.url,
              alt: image.alt || "",
              publicId: image.publicId || "",
            })),
            metaTitle: product.metaTitle || "",
            metaDescription: product.metaDescription || "",
            metaKeywords: (product.metaKeywords || []).join(", "),
          });
          setSlugTouched(true);
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
  }, [isEdit, productId]);

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

  const toggleCollection = (id) => {
    setForm((current) => ({
      ...current,
      collectionIds: current.collectionIds.includes(id)
        ? current.collectionIds.filter((item) => item !== id)
        : [...current.collectionIds, id],
    }));
  };

  const uploadImages = async (event) => {
    const files = [...(event.target.files || [])];
    event.target.value = "";
    if (!files.length) return;

    setUploading(true);
    setError("");
    try {
      const body = new FormData();
      files.forEach((file) => body.append("files", file));
      const data = await adminFetch("/api/admin/upload", { method: "POST", body });
      setForm((current) => ({
        ...current,
        images: [...current.images, ...(data.images || [])],
      }));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setUploading(false);
    }
  };

  const addImageUrl = () => {
    const url = imageUrl.trim();
    if (!url) return;
    setForm((current) => ({
      ...current,
      images: [...current.images, { url, alt: current.name || "", publicId: "" }],
    }));
    setImageUrl("");
  };

  const removeImage = (index) => {
    setForm((current) => ({
      ...current,
      images: current.images.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const moveImage = (index, direction) => {
    setForm((current) => {
      const images = [...current.images];
      const target = index + direction;
      if (target < 0 || target >= images.length) return current;
      [images[index], images[target]] = [images[target], images[index]];
      return { ...current, images };
    });
  };

  const updateImageAlt = (index, value) => {
    setForm((current) => ({
      ...current,
      images: current.images.map((image, itemIndex) =>
        itemIndex === index ? { ...image, alt: value } : image
      ),
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("Product name is required.");
      return;
    }

    const price = Number(form.priceRupees);
    if (!Number.isFinite(price) || price < 0) {
      setError("Enter a valid regular price.");
      return;
    }

    let salePrice = null;
    if (form.salePriceRupees !== "") {
      const parsed = Number(form.salePriceRupees);
      if (!Number.isFinite(parsed) || parsed < 0) {
        setError("Enter a valid sale price or leave it blank.");
        return;
      }
      if (parsed >= price) {
        setError("Sale price must be lower than the regular price.");
        return;
      }
      salePrice = Math.round(parsed * 100);
    }

    const payload = {
      name: form.name.trim(),
      slug: form.slug || slugify(form.name),
      sku: form.sku.trim(),
      shortDescription: form.shortDescription.trim(),
      description: form.description.trim(),
      price: Math.round(price * 100),
      salePrice,
      saleStart: form.saleStart || null,
      saleEnd: form.saleEnd || null,
      stock: Math.max(0, Math.round(Number(form.stock) || 0)),
      lowStockThreshold: Math.max(0, Math.round(Number(form.lowStockThreshold) || 0)),
      isActive: form.isActive,
      isFeatured: form.isFeatured,
      position: Math.round(Number(form.position) || 0),
      tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      collectionIds: form.collectionIds,
      images: form.images,
      metaTitle: form.metaTitle.trim(),
      metaDescription: form.metaDescription.trim(),
      metaKeywords: form.metaKeywords.split(",").map((keyword) => keyword.trim()).filter(Boolean),
    };

    setSaving(true);
    try {
      await adminFetch(isEdit ? `/api/admin/products/${productId}` : "/api/admin/products", {
        method: isEdit ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      router.push("/admin/products");
      router.refresh();
    } catch (requestError) {
      setError(requestError.message);
      setSaving(false);
    }
  };

  const previewPrice = useMemo(() => {
    const price = Number(form.priceRupees) || 0;
    const sale = form.salePriceRupees === "" ? 0 : Number(form.salePriceRupees) || 0;
    return Math.round((sale > 0 && sale < price ? sale : price) * 100);
  }, [form.priceRupees, form.salePriceRupees]);

  if (loading) return <Spinner label="Loading product…" />;

  return (
    <form onSubmit={submit} className="space-y-6">
      <PageHeader
        title={isEdit ? "Edit product" : "Add product"}
        description="Prices are entered in rupees and stored safely as integer paisa."
      >
        <Link href="/admin/products" className={buttonSecondary}>
          Cancel
        </Link>
        <button type="submit" disabled={saving} className={buttonPrimary}>
          {saving ? "Saving…" : isEdit ? "Save changes" : "Create product"}
        </button>
      </PageHeader>

      <ErrorBanner message={error} />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card>
            <h2 className="text-lg font-black text-ink-900">Basics</h2>
            <div className="mt-4 space-y-4">
              <Field label="Product name *">
                <input name="name" value={form.name} onChange={updateName} className={inputClass} placeholder="Rainbow wooden blocks" />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Slug" hint="Used in the product URL.">
                  <input
                    name="slug"
                    value={form.slug}
                    onChange={(event) => {
                      setSlugTouched(true);
                      update(event);
                    }}
                    className={inputClass}
                    placeholder="rainbow-wooden-blocks"
                  />
                </Field>
                <Field label="SKU" hint="Optional internal code.">
                  <input name="sku" value={form.sku} onChange={update} className={inputClass} placeholder="TOY-1042" />
                </Field>
              </div>

              <Field label="Short description" hint="Shown on product cards and in search results.">
                <textarea name="shortDescription" value={form.shortDescription} onChange={update} rows={2} className={inputClass} placeholder="A bright 40-piece set for early builders." />
              </Field>

              <Field label="Full description">
                <textarea name="description" value={form.description} onChange={update} rows={7} className={inputClass} placeholder="Materials, age range, safety details, what's in the box…" />
              </Field>
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-black text-ink-900">Pricing</h2>
            <p className="mt-1 text-xs text-slate-500">Enter amounts in rupees (Rs). Sale price is optional.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Regular price (Rs) *">
                <input name="priceRupees" type="number" min="0" step="0.01" value={form.priceRupees} onChange={update} className={inputClass} placeholder="2500" />
              </Field>
              <Field label="Sale price (Rs)" hint="Must be lower than the regular price.">
                <input name="salePriceRupees" type="number" min="0" step="0.01" value={form.salePriceRupees} onChange={update} className={inputClass} placeholder="1999" />
              </Field>
              <Field label="Sale starts">
                <input name="saleStart" type="date" value={form.saleStart} onChange={update} className={inputClass} />
              </Field>
              <Field label="Sale ends">
                <input name="saleEnd" type="date" value={form.saleEnd} onChange={update} className={inputClass} />
              </Field>
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-black text-ink-900">Inventory</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <Field label="Stock quantity">
                <input name="stock" type="number" min="0" step="1" value={form.stock} onChange={update} className={inputClass} />
              </Field>
              <Field label="Low-stock alert at" hint="Alert when stock reaches this number.">
                <input name="lowStockThreshold" type="number" min="0" step="1" value={form.lowStockThreshold} onChange={update} className={inputClass} />
              </Field>
              <Field label="Sort position" hint="Lower numbers appear first.">
                <input name="position" type="number" step="1" value={form.position} onChange={update} className={inputClass} />
              </Field>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-black text-ink-900">Images</h2>
                <p className="text-xs text-slate-500">Upload from your device or paste an image URL. First image is the cover.</p>
              </div>
              <label className={`${buttonSecondary} cursor-pointer`}>
                {uploading ? "Uploading…" : "Upload images"}
                <input type="file" accept="image/*" multiple onChange={uploadImages} className="hidden" disabled={uploading} />
              </label>
            </div>

            <div className="mt-4 flex gap-2">
              <input
                value={imageUrl}
                onChange={(event) => setImageUrl(event.target.value)}
                placeholder="https://… image URL"
                className={inputClass}
              />
              <button type="button" onClick={addImageUrl} className={buttonSecondary}>
                Add URL
              </button>
            </div>

            {form.images.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-400">
                No images yet. Upload at least one so customers can see the toy.
              </div>
            ) : (
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {form.images.map((image, index) => (
                  <li key={`${image.url}-${index}`} className="rounded-xl border border-slate-200 p-3">
                    <div className="flex gap-3">
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                        <Image src={image.url} alt={image.alt || "Product image"} fill sizes="80px" className="object-cover" />
                        {index === 0 && (
                          <span className="absolute left-1 top-1 rounded bg-ink-900 px-1.5 py-0.5 text-[9px] font-bold text-white">
                            Cover
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <input
                          value={image.alt}
                          onChange={(event) => updateImageAlt(index, event.target.value)}
                          placeholder="Alt text"
                          className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-brand-500"
                        />
                        <p className="mt-1 truncate text-[10px] text-slate-400">{image.url}</p>
                        <div className="mt-2 flex gap-1">
                          <button type="button" onClick={() => moveImage(index, -1)} disabled={index === 0} className="rounded border border-slate-200 px-2 py-1 text-[11px] font-bold text-slate-600 disabled:opacity-40">
                            ↑
                          </button>
                          <button type="button" onClick={() => moveImage(index, 1)} disabled={index === form.images.length - 1} className="rounded border border-slate-200 px-2 py-1 text-[11px] font-bold text-slate-600 disabled:opacity-40">
                            ↓
                          </button>
                          <button type="button" onClick={() => removeImage(index)} className="ml-auto rounded border border-rose-200 px-2 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50">
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <h2 className="text-lg font-black text-ink-900">SEO</h2>
            <div className="mt-4 space-y-4">
              <Field label="Meta title" hint="Leave blank to use the product name.">
                <input name="metaTitle" value={form.metaTitle} onChange={update} className={inputClass} />
              </Field>
              <Field label="Meta description">
                <textarea name="metaDescription" value={form.metaDescription} onChange={update} rows={2} className={inputClass} />
              </Field>
              <Field label="Meta keywords" hint="Comma separated.">
                <input name="metaKeywords" value={form.metaKeywords} onChange={update} className={inputClass} />
              </Field>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="text-lg font-black text-ink-900">Visibility</h2>
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
                  <span className="block text-xs text-slate-500">Show in featured sections.</span>
                </span>
                <input type="checkbox" name="isFeatured" checked={form.isFeatured} onChange={update} className="h-4 w-4 rounded text-brand-600" />
              </label>
            </div>

            {form.slug && (
              <p className="mt-3 break-all rounded-lg bg-slate-50 px-2.5 py-2 text-[11px] text-slate-500">
                /product/{form.slug}
              </p>
            )}
          </Card>

          <Card>
            <h2 className="text-lg font-black text-ink-900">Preview</h2>
            <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200">
              <div className="relative aspect-square bg-slate-100">
                {form.images[0]?.url ? (
                  <Image src={form.images[0].url} alt={form.images[0].alt || form.name || "Preview"} fill sizes="300px" className="object-cover" />
                ) : (
                  <div className="grid h-full place-items-center text-5xl">🧸</div>
                )}
              </div>
              <div className="p-3">
                <p className="line-clamp-2 text-sm font-bold text-ink-900">{form.name || "Product name"}</p>
                <p className="mt-1 text-base font-black text-ink-900">{formatPrice(previewPrice)}</p>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-black text-ink-900">Collections</h2>
            <p className="text-xs text-slate-500">Choose where this product appears.</p>
            <div className="mt-3 max-h-64 space-y-1.5 overflow-auto pr-1">
              {collections.length === 0 && (
                <p className="text-xs text-slate-400">No collections yet.</p>
              )}
              {collections.map((collection) => (
                <label key={collection._id} className="flex items-center gap-2 rounded-lg px-1 py-1.5 text-sm hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={form.collectionIds.includes(collection._id)}
                    onChange={() => toggleCollection(collection._id)}
                    className="h-4 w-4 rounded text-brand-600"
                  />
                  <span className="font-semibold text-slate-700">{collection.name}</span>
                  <span className="ml-auto text-[10px] text-slate-400">{collection.productCount ?? 0}</span>
                </label>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-black text-ink-900">Tags</h2>
            <p className="text-xs text-slate-500">Comma separated, used for search.</p>
            <textarea name="tags" value={form.tags} onChange={update} rows={3} className={`${inputClass} mt-3`} placeholder="wooden, ages 3-5, gift" />
          </Card>

          <button type="submit" disabled={saving} className={`${buttonPrimary} w-full`}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Create product"}
          </button>
        </div>
      </div>
    </form>
  );
}
