"use client";

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
import { formatDate, formatPrice, initials } from "@/lib/format";

export default function CustomersClient({ initialSearch = "" }) {
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [search, setSearch] = useState(initialSearch);
  const [page, setPage] = useState(1);

  const load = useCallback(async (term = "", nextPage = 1) => {
    setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams({ page: String(nextPage), limit: "20" });
      if (term.trim()) query.set("search", term.trim());
      const data = await adminFetch(`/api/admin/customers?${query.toString()}`);
      setCustomers(data.customers || []);
      setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(initialSearch, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  const toggleActive = async (customer) => {
    setBusyId(customer._id);
    setError("");
    try {
      const data = await adminFetch(`/api/admin/customers/${customer._id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !customer.isActive }),
      });
      setCustomers((current) =>
        current.map((item) => (item._id === customer._id ? { ...item, ...data.customer } : item))
      );
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyId("");
    }
  };

  const removeCustomer = async (customer) => {
    if (
      !window.confirm(
        `Delete “${customer.email}”? This is a soft delete; their past orders are kept for records.`
      )
    ) {
      return;
    }

    setBusyId(customer._id);
    setError("");
    try {
      await adminFetch(`/api/admin/customers/${customer._id}`, { method: "DELETE" });
      setCustomers((current) => current.filter((item) => item._id !== customer._id));
      setPagination((current) => ({ ...current, total: Math.max(0, current.total - 1) }));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="Registered customers with lifetime order counts and spend. Guest orders appear under Orders only."
      />

      <ErrorBanner message={error} onRetry={() => load(search, page)} />

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setPage(1);
            load(search, 1);
          }}
          className="flex flex-wrap gap-2"
        >
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, email, phone…"
            className={`${inputClass} max-w-sm`}
          />
          <button type="submit" className="rounded-xl bg-ink-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-ink-800">
            Search
          </button>
        </form>
        <p className="mt-3 text-xs text-slate-400">
          {pagination.total} customer{pagination.total === 1 ? "" : "s"} found
        </p>
      </div>

      {loading ? (
        <Spinner label="Loading customers…" />
      ) : customers.length === 0 ? (
        <EmptyState
          icon="👥"
          title="No customers found"
          description="Customers appear here after they create an account or place a signed-in order."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-bold">Customer</th>
                  <th className="px-4 py-3 font-bold">Joined</th>
                  <th className="px-4 py-3 font-bold">Orders</th>
                  <th className="px-4 py-3 font-bold">Total spent</th>
                  <th className="px-4 py-3 font-bold">Last order</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                  <th className="px-4 py-3 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer._id} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-100 text-xs font-black text-brand-800">
                          {initials(customer.name || customer.email)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-bold text-ink-900">
                            {customer.name ||
                              `${customer.firstName || ""} ${customer.lastName || ""}`.trim() ||
                              "Customer"}
                          </p>
                          <p className="truncate text-xs text-slate-400">{customer.email}</p>
                          {customer.phone && <p className="text-xs text-slate-400">{customer.phone}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(customer.createdAt)}</td>
                    <td className="px-4 py-3 font-semibold text-slate-700">{customer.orderCount || 0}</td>
                    <td className="px-4 py-3 font-bold text-ink-900">{formatPrice(customer.totalSpent || 0)}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {customer.lastOrderAt ? formatDate(customer.lastOrderAt) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={customer.isActive ? "success" : "slate"}>
                        {customer.isActive ? "Active" : "Disabled"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => toggleActive(customer)}
                          disabled={busyId === customer._id}
                          className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:border-slate-300 disabled:opacity-50"
                        >
                          {customer.isActive ? "Disable" : "Enable"}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeCustomer(customer)}
                          disabled={busyId === customer._id}
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

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-4 py-3 text-sm">
            <p className="text-xs text-slate-400">
              Page {pagination.page} of {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const next = Math.max(1, page - 1);
                  setPage(next);
                  load(search, next);
                }}
                disabled={pagination.page <= 1}
                className={buttonSecondary}
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => {
                  const next = Math.min(pagination.totalPages, page + 1);
                  setPage(next);
                  load(search, next);
                }}
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
