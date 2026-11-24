"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/components/admin/adminFetch";
import {
  Card,
  ErrorBanner,
  Field,
  PageHeader,
  Spinner,
  buttonPrimary,
  inputClass,
} from "@/components/admin/ui";

const SOCIAL_FIELDS = [
  { name: "instagram", label: "Instagram" },
  { name: "facebook", label: "Facebook" },
  { name: "youtube", label: "YouTube" },
  { name: "tiktok", label: "TikTok" },
];

const EMPTY = {
  storeName: "",
  storeEmail: "",
  storePhone: "",
  whatsappNumber: "",
  storeAddress: "",
  shippingFeeRupees: "",
  freeShippingThresholdRupees: "",
  socialLinks: { instagram: "", facebook: "", youtube: "", tiktok: "" },
};

const rupees = (paisa) => String(Math.round(Number(paisa) || 0) / 100);
const paisa = (value) => Math.max(0, Math.round((Number(value) || 0) * 100));

export default function SettingsForm() {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const data = await adminFetch("/api/admin/settings");
        if (!active) return;
        const settings = data.settings || {};
        setForm({
          storeName: settings.storeName || "",
          storeEmail: settings.storeEmail || "",
          storePhone: settings.storePhone || "",
          whatsappNumber: settings.whatsappNumber || "",
          storeAddress: settings.storeAddress || "",
          shippingFeeRupees: rupees(settings.shippingFee),
          freeShippingThresholdRupees: rupees(settings.freeShippingThreshold),
          socialLinks: {
            instagram: settings.socialLinks?.instagram || "",
            facebook: settings.socialLinks?.facebook || "",
            youtube: settings.socialLinks?.youtube || "",
            tiktok: settings.socialLinks?.tiktok || "",
          },
        });
      } catch (requestError) {
        if (active) setError(requestError.message);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const update = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const updateSocial = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      socialLinks: { ...current.socialLinks, [name]: value },
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const data = await adminFetch("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify({
          storeName: form.storeName,
          storeEmail: form.storeEmail,
          storePhone: form.storePhone,
          whatsappNumber: form.whatsappNumber,
          storeAddress: form.storeAddress,
          shippingFee: paisa(form.shippingFeeRupees),
          freeShippingThreshold: paisa(form.freeShippingThresholdRupees),
          socialLinks: form.socialLinks,
        }),
      });

      const settings = data.settings || {};
      setForm((current) => ({
        ...current,
        shippingFeeRupees: rupees(settings.shippingFee),
        freeShippingThresholdRupees: rupees(settings.freeShippingThreshold),
      }));
      setSuccess("Settings saved. Storefront pages will use the new values on the next request.");
      window.setTimeout(() => setSuccess(""), 4000);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner label="Loading settings…" />;

  return (
    <form onSubmit={submit} className="space-y-6">
      <PageHeader
        title="Store settings"
        description="Brand contact details, shipping charges and social profiles. Changes apply to the storefront immediately."
      />

      <ErrorBanner message={error} />
      {success && (
        <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {success}
        </div>
      )}

      <Card>
        <h2 className="text-sm font-black uppercase tracking-wide text-ink-900">
          Brand &amp; contact
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Store name">
            <input name="storeName" value={form.storeName} onChange={update} className={inputClass} required />
          </Field>
          <Field label="Support email">
            <input
              name="storeEmail"
              type="email"
              value={form.storeEmail}
              onChange={update}
              className={inputClass}
              required
            />
          </Field>
          <Field label="Phone">
            <input name="storePhone" value={form.storePhone} onChange={update} className={inputClass} />
          </Field>
          <Field label="WhatsApp number" hint="Digits and + only. Used by the floating chat button.">
            <input
              name="whatsappNumber"
              value={form.whatsappNumber}
              onChange={update}
              className={inputClass}
              placeholder="+92 300 0000000"
            />
          </Field>
          <Field label="Address" className="sm:col-span-2">
            <input name="storeAddress" value={form.storeAddress} onChange={update} className={inputClass} />
          </Field>
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-black uppercase tracking-wide text-ink-900">Shipping</h2>
        <p className="mt-1 text-xs text-slate-500">
          Enter amounts in rupees. They are stored as integer paisa.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Flat shipping fee (Rs)">
            <input
              name="shippingFeeRupees"
              type="number"
              min="0"
              step="1"
              value={form.shippingFeeRupees}
              onChange={update}
              className={inputClass}
              required
            />
          </Field>
          <Field label="Free shipping from (Rs)">
            <input
              name="freeShippingThresholdRupees"
              type="number"
              min="0"
              step="1"
              value={form.freeShippingThresholdRupees}
              onChange={update}
              className={inputClass}
              required
            />
          </Field>
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-black uppercase tracking-wide text-ink-900">Social profiles</h2>
        <p className="mt-1 text-xs text-slate-500">
          Leave a field empty to hide that icon in the footer.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {SOCIAL_FIELDS.map((network) => (
            <Field key={network.name} label={network.label}>
              <input
                name={network.name}
                value={form.socialLinks[network.name]}
                onChange={updateSocial}
                className={inputClass}
                placeholder={`https://${network.name}.com/…`}
              />
            </Field>
          ))}
        </div>
      </Card>

      <div className="flex justify-end">
        <button type="submit" disabled={saving} className={buttonPrimary}>
          {saving ? "Saving…" : "Save settings"}
        </button>
      </div>
    </form>
  );
}
