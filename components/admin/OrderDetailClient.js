"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { adminFetch } from "@/components/admin/adminFetch";
import {
  Badge,
  Card,
  ErrorBanner,
  PageHeader,
  Spinner,
  buttonPrimary,
  buttonSecondary,
  inputClass,
  labelClass,
} from "@/components/admin/ui";
import { formatDateTime, formatPrice } from "@/lib/format";
import { ORDER_STATUSES, ORDER_STATUS_LABELS, PAYMENT_STATUSES } from "@/lib/constants";

function statusTone(status) {
  switch (status) {
    case "delivered":
      return "success";
    case "shipped":
      return "info";
    case "processing":
      return "brand";
    case "cancelled":
      return "danger";
    default:
      return "warning";
  }
}

export default function OrderDetailClient({ orderId }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    status: "",
    paymentStatus: "",
    trackingNumber: "",
    carrier: "",
    adminNotes: "",
    statusNote: "",
  });

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const data = await adminFetch(`/api/admin/orders/${orderId}`);
        if (!active) return;
        setOrder(data.order);
        setForm({
          status: data.order.status,
          paymentStatus: data.order.paymentStatus,
          trackingNumber: data.order.trackingNumber || "",
          carrier: data.order.carrier || "",
          adminNotes: data.order.adminNotes || "",
          statusNote: "",
        });
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
  }, [orderId]);

  const update = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const data = await adminFetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: form.status,
          paymentStatus: form.paymentStatus,
          trackingNumber: form.trackingNumber,
          carrier: form.carrier,
          adminNotes: form.adminNotes,
          statusNote: form.statusNote,
        }),
      });
      setOrder(data.order);
      setForm((current) => ({ ...current, statusNote: "" }));
      setSuccess("Order updated. A status email is sent automatically when email is configured.");
      window.setTimeout(() => setSuccess(""), 4000);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner label="Loading order…" />;
  if (!order) {
    return (
      <div className="space-y-4">
        <ErrorBanner message={error || "Order not found."} />
        <Link href="/admin/orders" className={buttonSecondary}>
          Back to orders
        </Link>
      </div>
    );
  }

  const customer = order.customerId && typeof order.customerId === "object" ? order.customerId : null;
  const history = [...(order.statusHistory || [])].reverse();

  return (
    <form onSubmit={save} className="space-y-6">
      <PageHeader title={`Order ${order.orderNumber}`} description={`Placed ${formatDateTime(order.createdAt)}`}>
        <Link href="/admin/orders" className={buttonSecondary}>
          ← All orders
        </Link>
        <button type="button" onClick={() => window.print()} className={buttonSecondary}>
          Print
        </button>
        <button type="submit" disabled={saving} className={buttonPrimary}>
          {saving ? "Saving…" : "Save changes"}
        </button>
      </PageHeader>

      <ErrorBanner message={error} onRetry={() => window.location.reload()} />
      {success && (
        <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {success}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Card className="p-0">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <h2 className="text-lg font-black text-ink-900">Items</h2>
              <div className="flex items-center gap-2">
                <Badge tone={statusTone(order.status)}>
                  {ORDER_STATUS_LABELS[order.status] || order.status}
                </Badge>
                <Badge tone={order.paymentStatus === "paid" ? "success" : "slate"}>
                  {order.paymentStatus}
                </Badge>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {order.items.map((item, index) => (
                <div key={`${item.productId}-${index}`} className="flex items-center gap-4 px-5 py-4">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                    {item.image ? (
                      <Image src={item.image} alt={item.title} fill sizes="64px" className="object-cover" />
                    ) : (
                      <div className="grid h-full place-items-center text-2xl">🧸</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-ink-900">{item.title}</p>
                    <p className="text-xs text-slate-500">
                      {item.sku ? `SKU ${item.sku} · ` : ""}
                      {formatPrice(item.price)} × {item.quantity}
                    </p>
                  </div>
                  <p className="font-black text-ink-900">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>

            <dl className="space-y-2 border-t border-slate-100 px-5 py-4 text-sm">
              <div className="flex justify-between text-slate-600">
                <dt>Subtotal</dt>
                <dd className="font-semibold text-ink-900">{formatPrice(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between text-slate-600">
                <dt>Shipping</dt>
                <dd className="font-semibold text-ink-900">
                  {order.shippingFee === 0 ? "Free" : formatPrice(order.shippingFee)}
                </dd>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <dt>Discount {order.discountCode ? `(${order.discountCode})` : ""}</dt>
                  <dd className="font-semibold">−{formatPrice(order.discountAmount)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-black text-ink-900">
                <dt>Total</dt>
                <dd>{formatPrice(order.totalAmount)}</dd>
              </div>
            </dl>
          </Card>

          <div className="grid gap-6 sm:grid-cols-2">
            <Card>
              <h2 className="text-sm font-black uppercase tracking-wide text-ink-900">Shipping snapshot</h2>
              <address className="mt-3 text-sm not-italic leading-6 text-slate-600">
                <span className="font-bold text-ink-900">{order.shippingAddress.fullName}</span>
                <br />
                {order.shippingAddress.addressLine1}
                {order.shippingAddress.addressLine2 ? (
                  <>
                    <br />
                    {order.shippingAddress.addressLine2}
                  </>
                ) : null}
                <br />
                {order.shippingAddress.city}
                {order.shippingAddress.state ? `, ${order.shippingAddress.state}` : ""}
                {order.shippingAddress.postalCode ? ` ${order.shippingAddress.postalCode}` : ""}
                <br />
                {order.shippingAddress.country}
              </address>
              <p className="mt-3 border-t border-slate-100 pt-3 text-sm text-slate-600">
                {order.shippingAddress.phone}
                <br />
                <span className="text-xs">{order.shippingAddress.email}</span>
              </p>
            </Card>

            <Card>
              <h2 className="text-sm font-black uppercase tracking-wide text-ink-900">Customer</h2>
              {customer ? (
                <div className="mt-3 text-sm text-slate-600">
                  <p className="font-bold text-ink-900">{customer.name || order.shippingAddress.fullName}</p>
                  <p>{customer.email}</p>
                  {customer.phone && <p>{customer.phone}</p>}
                  <Link href={`/admin/customers?search=${encodeURIComponent(customer.email)}`} className="mt-3 inline-block text-xs font-bold text-brand-700 hover:text-brand-800">
                    View customer →
                  </Link>
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-500">
                  Guest checkout. Contact details are stored in the shipping snapshot.
                </p>
              )}

              <h3 className="mt-4 border-t border-slate-100 pt-4 text-sm font-black uppercase tracking-wide text-ink-900">
                Notes
              </h3>
              <p className="mt-2 whitespace-pre-line text-sm text-slate-600">
                {order.customerNotes || "No customer notes."}
              </p>
            </Card>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="text-lg font-black text-ink-900">Fulfilment</h2>

            <div className="mt-4 space-y-4">
              <label className="block">
                <span className={labelClass}>Order status</span>
                <select name="status" value={form.status} onChange={update} className={inputClass}>
                  {ORDER_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {ORDER_STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className={labelClass}>Payment status</span>
                <select name="paymentStatus" value={form.paymentStatus} onChange={update} className={inputClass}>
                  {PAYMENT_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className={labelClass}>Carrier</span>
                  <input name="carrier" value={form.carrier} onChange={update} className={inputClass} placeholder="TCS, Leopards…" />
                </label>
                <label className="block">
                  <span className={labelClass}>Tracking #</span>
                  <input name="trackingNumber" value={form.trackingNumber} onChange={update} className={inputClass} placeholder="Tracking number" />
                </label>
              </div>

              <label className="block">
                <span className={labelClass}>Status note (internal / email)</span>
                <input name="statusNote" value={form.statusNote} onChange={update} className={inputClass} placeholder="Optional note for this status change" />
              </label>

              <label className="block">
                <span className={labelClass}>Admin notes</span>
                <textarea name="adminNotes" value={form.adminNotes} onChange={update} rows={4} className={inputClass} placeholder="Internal notes — never shown to the customer" />
              </label>

              <button type="submit" disabled={saving} className={`${buttonPrimary} w-full`}>
                {saving ? "Saving…" : "Update order"}
              </button>
              <p className="text-[11px] leading-5 text-slate-400">
                Changing the order status sends a customer email when RESEND_API_KEY is configured.
                Otherwise it is logged on the server.
              </p>
            </div>
          </Card>

          <Card>
            <h2 className="text-sm font-black uppercase tracking-wide text-ink-900">Status history</h2>
            <ol className="mt-3 space-y-4">
              {history.length === 0 && (
                <li className="text-sm text-slate-500">No status changes recorded yet.</li>
              )}
              {history.map((entry, index) => (
                <li key={`${entry.status}-${index}`} className="relative border-l-2 border-slate-200 pl-4">
                  <span className="absolute -left-[7px] top-1 h-3 w-3 rounded-full bg-brand-500" />
                  <p className="text-sm font-bold text-ink-900">
                    {ORDER_STATUS_LABELS[entry.status] || entry.status}
                  </p>
                  <p className="text-xs text-slate-400">{formatDateTime(entry.at)}</p>
                  {entry.note && <p className="mt-1 text-xs text-slate-600">{entry.note}</p>}
                  <p className="text-[11px] text-slate-400">by {entry.changedBy || "system"}</p>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </form>
  );
}
