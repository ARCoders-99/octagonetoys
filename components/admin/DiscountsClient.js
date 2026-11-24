"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/components/admin/adminFetch";
import {
  Badge,
  Card,
  EmptyState,
  ErrorBanner,
  Field,
  PageHeader,
  Spinner,
  buttonPrimary,
  buttonSecondary,
  inputClass,
} from "@/components/admin/ui";
import { formatDate, formatPrice } from "@/lib/format";

const EMPTY_FORM = {
  code: "",
  description: "",
  discountType: "percentage",
  discountValue: "",
  minSubtotal: "",
  startsAt: "",
  endsAt: "",
  usageLimit: "",
  isActive: true,
};

function toDateInput(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export default function DiscountsClient() {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busyId, setBusyId] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await adminFetch("/api/admin/discounts?limit=100");
      setDiscounts(data.discounts || []);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const update = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : name === "code" ? value.toUpperCase() : value,
    }));
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const startEdit = (discount) => {
    setEditingId(discount._id);
    setShowForm(true);
    setForm({
      code: discount.code,
      description: discount.description || "",
      discountType: discount.discountType,
      discountValue:
        discount.discountType === "fixed"
          ? String(Number(discount.discountValue) / 100)
          : String(discount.discountValue),
      minSubtotal: discount.minSubtotal ? String(Number(discount.minSubtotal) / 100) : "",
      startsAt: toDateInput(discount.startsAt),
      endsAt: toDateInput(discount.endsAt),
      usageLimit: discount.usageLimit == null ? "" : String(discount.usageLimit),
      isActive: discount.isActive !== false,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.code.trim()) {
      setError("Discount code is required.");
      return;
    }

    const value = Number(form.discountValue);
    if (!Number.isFinite(value) || value <= 0) {
      setError("Enter a valid discount value.");
      return;
    }
    if (form.discountType === "percentage" && value > 100) {
      setError("Percentage discount cannot exceed 100%.");
      return;
    }

    const payload = {
      code: form.code.trim().toUpperCase(),
      description: form.description.trim(),
      discountType: form.discountType,
      discountValue:
        form.discountType === "percentage" ? Math.round(value) : Math.round(value * 100),
      minSubtotal: form.minSubtotal ? Math.round(Number(form.minSubtotal) * 100) : 0,
      startsAt: form.startsAt || null,
      endsAt: form.endsAt || null,
      usageLimit: form.usageLimit === "" ? null : Math.max(0, Math.round(Number(form.usageLimit))),
      isActive: form.isActive,
    };

    setSaving(true);
    try {
      const data = await adminFetch(
        editingId ? `/api/admin/discounts/${editingId}` : "/api/admin/discounts",
        {
          method: editingId ? "PUT" : "POST",
          body: JSON.stringify(payload),
        }
      );

      if (editingId) {
        setDiscounts((current) =>
          current.map((item) => (item._id === editingId ? data.discount : item))
        );
      } else {
        setDiscounts((current) => [data.discount, ...current]);
      }

      setSuccess(editingId ? "Discount updated." : "Discount created.");
      setShowForm(false);
      resetForm();
      window.setTimeout(() => setSuccess(""), 3000);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (discount) => {
    setBusyId(discount._id);
    setError("");
    try {
      const data = await adminFetch(`/api/admin/discounts/${discount._id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !discount.isActive }),
      });
      setDiscounts((current) =>
        current.map((item) => (item._id === discount._id ? { ...item, ...data.discount } : item))
      );
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyId("");
    }
  };

  const removeDiscount = async (discount) => {
    if (!window.confirm(`Delete discount “${discount.code}”? Past orders keep their discount snapshot.`)) {
      return;
    }

    setBusyId(discount._id);
    setError("");
    try {
      await adminFetch(`/api/admin/discounts/${discount._id}`, { method: "DELETE" });
      setDiscounts((current) => current.filter((item) => item._id !== discount._id));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Discounts"
        description="Create promo codes for percentage or fixed-amount savings. Checkout always recalculates the amount on the server."
      >
        <button
          type="button"
          onClick={() => {
            if (showForm) {
              setShowForm(false);
              resetForm();
            } else {
              resetForm();
              setShowForm(true);
            }
          }}
          className={buttonPrimary}
        >
          {showForm ? "Close form" : "+ New discount"}
        </button>
      </PageHeader>

      <ErrorBanner message={error} onRetry={load} />
      {success && (
        <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {success}
        </div>
      )}

      {showForm && (
        <Card>
          <h2 className="text-lg font-black text-ink-900">
            {editingId ? "Edit discount" : "Create a discount"}
          </h2>

          <form onSubmit={submit} className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Code *">
                <input name="code" value={form.code} onChange={update} className={`${inputClass} uppercase`} placeholder="WELCOME10" />
              </Field>
              <Field label="Type">
                <select name="discountType" value={form.discountType} onChange={update} className={inputClass}>
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed amount (Rs)</option>
                </select>
              </Field>
              <Field label={form.discountType === "percentage" ? "Percent off *" : "Amount off (Rs) *"}>
                <input
                  name="discountValue"
                  type="number"
                  min="0"
                  step={form.discountType === "percentage" ? "1" : "0.01"}
                  value={form.discountValue}
                  onChange={update}
                  className={inputClass}
                  placeholder={form.discountType === "percentage" ? "10" : "250"}
                />
              </Field>
              <Field label="Minimum spend (Rs)" hint="0 means no minimum.">
                <input name="minSubtotal" type="number" min="0" step="0.01" value={form.minSubtotal} onChange={update} className={inputClass} placeholder="0" />
              </Field>
            </div>

            <Field label="Description" hint="Shown internally; may be shown in future promotions.">
              <input name="description" value={form.description} onChange={update} className={inputClass} placeholder="10% off first order" />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Starts">
                <input name="startsAt" type="date" value={form.startsAt} onChange={update} className={inputClass} />
              </Field>
              <Field label="Ends">
                <input name="endsAt" type="date" value={form.endsAt} onChange={update} className={inputClass} />
              </Field>
              <Field label="Usage limit" hint="Blank = unlimited.">
                <input name="usageLimit" type="number" min="0" step="1" value={form.usageLimit} onChange={update} className={inputClass} placeholder="Unlimited" />
              </Field>
              <label className="flex items-center gap-2 self-end rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700">
                <input type="checkbox" name="isActive" checked={form.isActive} onChange={update} className="h-4 w-4 rounded text-brand-600" />
                Active
              </label>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className={buttonSecondary}
              >
                Cancel
              </button>
              <button type="submit" disabled={saving} className={buttonPrimary}>
                {saving ? "Saving…" : editingId ? "Save changes" : "Create discount"}
              </button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <Spinner label="Loading discounts…" />
      ) : discounts.length === 0 ? (
        <EmptyState
          icon="🎯"
          title="No discounts yet"
          description="Create a promo code to drive your first sale."
        >
          <button
            type="button"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className={buttonPrimary}
          >
            New discount
          </button>
        </EmptyState>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-bold">Code</th>
                  <th className="px-4 py-3 font-bold">Value</th>
                  <th className="px-4 py-3 font-bold">Min spend</th>
                  <th className="px-4 py-3 font-bold">Usage</th>
                  <th className="px-4 py-3 font-bold">Valid</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                  <th className="px-4 py-3 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {discounts.map((discount) => (
                  <tr key={discount._id} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      <p className="font-black text-ink-900">{discount.code}</p>
                      {discount.description && (
                        <p className="text-xs text-slate-400">{discount.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 font-bold text-ink-900">
                      {discount.discountType === "percentage"
                        ? `${discount.discountValue}% off`
                        : `${formatPrice(discount.discountValue)} off`}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {discount.minSubtotal ? formatPrice(discount.minSubtotal) : "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {discount.usedCount || 0}
                      {discount.usageLimit != null ? ` / ${discount.usageLimit}` : ""}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {discount.startsAt ? formatDate(discount.startsAt) : "Any time"}
                      <br />
                      {discount.endsAt ? `until ${formatDate(discount.endsAt)}` : "no end date"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={discount.isActive ? "success" : "slate"}>
                        {discount.isActive ? "Active" : "Paused"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(discount)}
                          className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-ink-700 hover:border-slate-300"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleActive(discount)}
                          disabled={busyId === discount._id}
                          className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:border-slate-300 disabled:opacity-50"
                        >
                          {discount.isActive ? "Pause" : "Activate"}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeDiscount(discount)}
                          disabled={busyId === discount._id}
                          className="rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
