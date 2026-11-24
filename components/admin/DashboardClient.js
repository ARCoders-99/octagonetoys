"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { adminFetch } from "@/components/admin/adminFetch";
import { Badge, Card, EmptyState, ErrorBanner, PageHeader, Spinner, StatCard } from "@/components/admin/ui";
import { formatDate, formatPrice } from "@/lib/format";
import { ORDER_STATUS_LABELS } from "@/lib/constants";

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

function SalesChart({ data = [] }) {
  const width = 720;
  const height = 220;
  const padding = { top: 16, right: 16, bottom: 30, left: 44 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const max = Math.max(1, ...data.map((point) => point.total));
  const step = data.length > 1 ? innerWidth / (data.length - 1) : innerWidth;

  const points = data.map((point, index) => {
    const x = padding.left + index * step;
    const y = padding.top + innerHeight - (point.total / max) * innerHeight;
    return { ...point, x, y };
  });

  const line = points.map((point) => `${point.x},${point.y}`).join(" ");
  const area = points.length
    ? `M ${points[0].x} ${padding.top + innerHeight} L ${points
        .map((point) => `${point.x} ${point.y}`)
        .join(" L ")} L ${points[points.length - 1].x} ${padding.top + innerHeight} Z`
    : "";

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-60 w-full min-w-[560px]" role="img" aria-label="Sales for the last 14 days">
        <defs>
          <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = padding.top + innerHeight * ratio;
          const value = max * (1 - ratio);
          return (
            <g key={ratio}>
              <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="#e2e8f0" strokeDasharray="4 4" />
              <text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#94a3b8">
                {Math.round(value / 1000)}k
              </text>
            </g>
          );
        })}

        {area && <path d={area} fill="url(#salesFill)" />}
        {line && <polyline points={line} fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />}

        {points.map((point, index) => (
          <g key={point.date}>
            <circle cx={point.x} cy={point.y} r="3.5" fill="#fff" stroke="#d97706" strokeWidth="2">
              <title>
                {point.label}: {formatPrice(point.total)} · {point.orders} orders
              </title>
            </circle>
            {(index === 0 || index === points.length - 1 || index % 3 === 0) && (
              <text x={point.x} y={height - 8} textAnchor="middle" fontSize="10" fill="#94a3b8">
                {point.label}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

export default function DashboardClient() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await adminFetch("/api/admin/stats");
      setData(result);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const stats = data?.stats;
  const totalStatus = useMemo(
    () => (data?.statusBreakdown || []).reduce((sum, item) => sum + item.count, 0),
    [data]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="A live snapshot of your store performance, orders and inventory."
      >
        <button
          type="button"
          onClick={load}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:border-slate-300"
        >
          Refresh
        </button>
        <Link href="/admin/products/new" className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-black text-ink-900 hover:bg-brand-400">
          Add product
        </Link>
      </PageHeader>

      <ErrorBanner message={error} onRetry={load} />

      {loading && !data ? (
        <Spinner label="Loading dashboard…" />
      ) : data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total revenue" value={formatPrice(stats.totalSales)} hint={`${stats.totalOrders} paid / valid orders`} icon="₨" tone="success" />
            <StatCard label="This month" value={formatPrice(stats.monthSales)} hint={`${stats.monthOrders} orders this month`} icon="📈" tone="brand" />
            <StatCard label="All orders" value={stats.ordersCount} hint={`${stats.pendingOrders} pending fulfilment`} icon="🧾" tone="info" />
            <StatCard label="Customers" value={stats.customersCount} hint={`${stats.productsCount} products in catalogue`} icon="👥" tone="slate" />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Link href="/admin/orders?status=pending" className="rounded-2xl border border-amber-200 bg-amber-50 p-5 transition hover:border-amber-300">
              <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Pending orders</p>
              <p className="mt-1 text-2xl font-black text-ink-900">{stats.pendingOrders}</p>
              <p className="mt-1 text-xs text-amber-700">Needs fulfilment →</p>
            </Link>
            <Link href="/admin/inventory" className="rounded-2xl border border-rose-200 bg-rose-50 p-5 transition hover:border-rose-300">
              <p className="text-xs font-bold uppercase tracking-wide text-rose-700">Low stock alerts</p>
              <p className="mt-1 text-2xl font-black text-ink-900">{stats.lowStockCount}</p>
              <p className="mt-1 text-xs text-rose-700">Restock soon →</p>
            </Link>
            <Link href="/admin/reviews?approved=false" className="rounded-2xl border border-sky-200 bg-sky-50 p-5 transition hover:border-sky-300">
              <p className="text-xs font-bold uppercase tracking-wide text-sky-700">Reviews awaiting approval</p>
              <p className="mt-1 text-2xl font-black text-ink-900">{stats.pendingReviews}</p>
              <p className="mt-1 text-xs text-sky-700">Moderate now →</p>
            </Link>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
            <Card className="min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-black text-ink-900">Sales trend</h2>
                  <p className="text-xs text-slate-500">Last 14 days · excluding cancelled orders</p>
                </div>
                <Badge tone="brand">{formatPrice((data.chart || []).reduce((sum, point) => sum + point.total, 0))} in 14 days</Badge>
              </div>
              <div className="mt-4">
                <SalesChart data={data.chart || []} />
              </div>
            </Card>

            <Card className="min-w-0">
              <h2 className="text-lg font-black text-ink-900">Order status</h2>
              <p className="text-xs text-slate-500">{totalStatus} total orders</p>

              <div className="mt-4 space-y-3">
                {(data.statusBreakdown || []).length === 0 && (
                  <p className="text-sm text-slate-500">No orders yet.</p>
                )}
                {(data.statusBreakdown || []).map((item) => {
                  const percent = totalStatus ? Math.round((item.count / totalStatus) * 100) : 0;
                  return (
                    <div key={item._id}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-600">
                          {ORDER_STATUS_LABELS[item._id] || item._id}
                        </span>
                        <span className="text-slate-400">
                          {item.count} · {percent}%
                        </span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-ink-900"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 border-t border-slate-100 pt-4">
                <h3 className="text-sm font-black text-ink-900">Top products</h3>
                <ul className="mt-2 space-y-2">
                  {(data.topProducts || []).length === 0 && (
                    <li className="text-xs text-slate-400">Sales will appear here.</li>
                  )}
                  {(data.topProducts || []).map((product, index) => (
                    <li key={String(product._id)} className="flex items-center gap-2 text-sm">
                      <span className="grid h-6 w-6 place-items-center rounded-lg bg-slate-100 text-[11px] font-black text-slate-500">
                        {index + 1}
                      </span>
                      <span className="min-w-0 flex-1 truncate font-semibold text-slate-700">
                        {product.title}
                      </span>
                      <span className="text-xs font-bold text-slate-400">{product.sold} sold</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          </div>

          <Card>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-black text-ink-900">Recent orders</h2>
              <Link href="/admin/orders" className="text-sm font-bold text-brand-700 hover:text-brand-800">
                View all orders →
              </Link>
            </div>

            {(data.recentOrders || []).length === 0 ? (
              <div className="mt-4">
                <EmptyState
                  icon="🧾"
                  title="No orders yet"
                  description="As soon as customers check out, their orders will appear here."
                />
              </div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                      <th className="py-2 pr-4 font-bold">Order</th>
                      <th className="py-2 pr-4 font-bold">Customer</th>
                      <th className="py-2 pr-4 font-bold">Date</th>
                      <th className="py-2 pr-4 font-bold">Status</th>
                      <th className="py-2 pr-4 text-right font-bold">Total</th>
                      <th className="py-2 font-bold" />
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentOrders.map((order) => (
                      <tr key={order._id} className="border-b border-slate-100 last:border-0">
                        <td className="py-3 pr-4 font-bold text-ink-900">{order.orderNumber}</td>
                        <td className="py-3 pr-4 text-slate-600">
                          <span className="block font-semibold text-slate-700">{order.shippingAddress?.fullName}</span>
                          <span className="text-xs text-slate-400">{order.shippingAddress?.email}</span>
                        </td>
                        <td className="py-3 pr-4 text-slate-500">{formatDate(order.createdAt)}</td>
                        <td className="py-3 pr-4">
                          <Badge tone={statusTone(order.status)}>
                            {ORDER_STATUS_LABELS[order.status] || order.status}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4 text-right font-bold text-ink-900">
                          {formatPrice(order.totalAmount)}
                        </td>
                        <td className="py-3 text-right">
                          <Link href={`/admin/orders/${order._id}`} className="text-xs font-bold text-brand-700 hover:text-brand-800">
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      ) : (
        <EmptyState icon="📊" title="Dashboard unavailable" description={error || "Try refreshing the page."} />
      )}
    </div>
  );
}
