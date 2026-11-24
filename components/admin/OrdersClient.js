"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/components/admin/adminFetch";
import {
  Badge,
  EmptyState,
  ErrorBanner,
  PageHeader,
  Spinner,
  buttonSecondary,
  inputClass,
} from "@/components/admin/ui";
import { formatDate, formatPrice } from "@/lib/format";
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

export default function OrdersClient({ initialStatus = "" }) {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    search: "",
    status: ORDER_STATUSES.includes(initialStatus) ? initialStatus : "",
    paymentStatus: "",
    sort: "newest",
    page: 1,
  });

  const load = useCallback(async (nextFilters) => {
    setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams();
      Object.entries(nextFilters).forEach(([key, value]) => {
        if (value !== "" && value != null) query.set(key, String(value));
      });
      const data = await adminFetch(`/api/admin/orders?${query.toString()}`);
      setOrders(data.orders || []);
      setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value, page: key === "page" ? value : 1 }));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        description="Review every order with its permanent product and shipping snapshots. Orders cannot be deleted, only updated."
      />

      <ErrorBanner message={error} onRetry={() => load(filters)} />

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <input
            value={filters.search}
            onChange={(event) => updateFilter("search", event.target.value)}
            placeholder="Search order #, customer, phone…"
            className={inputClass}
          />
          <select value={filters.status} onChange={(event) => updateFilter("status", event.target.value)} className={inputClass}>
            <option value="">All statuses</option>
            {ORDER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {ORDER_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
          <select value={filters.paymentStatus} onChange={(event) => updateFilter("paymentStatus", event.target.value)} className={inputClass}>
            <option value="">All payments</option>
            {PAYMENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <select value={filters.sort} onChange={(event) => updateFilter("sort", event.target.value)} className={inputClass}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="total_desc">Highest total</option>
            <option value="total_asc">Lowest total</option>
          </select>
        </div>
        <p className="mt-3 text-xs text-slate-400">
          {pagination.total} order{pagination.total === 1 ? "" : "s"} found
        </p>
      </div>

      {loading ? (
        <Spinner label="Loading orders…" />
      ) : orders.length === 0 ? (
        <EmptyState icon="🧾" title="No orders match these filters" description="Try a different status or search term." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-bold">Order</th>
                  <th className="px-4 py-3 font-bold">Customer</th>
                  <th className="px-4 py-3 font-bold">Placed</th>
                  <th className="px-4 py-3 font-bold">Items</th>
                  <th className="px-4 py-3 font-bold">Payment</th>
                  <th className="px-4 py-3 font-bold">Fulfilment</th>
                  <th className="px-4 py-3 text-right font-bold">Total</th>
                  <th className="px-4 py-3 text-right font-bold">Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      <Link href={`/admin/orders/${order._id}`} className="font-bold text-ink-900 hover:text-brand-700">
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-700">{order.shippingAddress?.fullName}</p>
                      <p className="text-xs text-slate-400">{order.shippingAddress?.email}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(order.createdAt)}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {order.items?.reduce((sum, item) => sum + item.quantity, 0)} units
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={order.paymentStatus === "paid" ? "success" : order.paymentStatus === "refunded" ? "danger" : "slate"}>
                        {order.paymentStatus}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={statusTone(order.status)}>
                        {ORDER_STATUS_LABELS[order.status] || order.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-ink-900">
                      {formatPrice(order.totalAmount)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/orders/${order._id}`} className="text-xs font-bold text-brand-700 hover:text-brand-800">
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))}
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
