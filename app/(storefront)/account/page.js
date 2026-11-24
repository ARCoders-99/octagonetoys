import Link from "next/link";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/storefront/LogoutButton";
import AccountSettings from "@/components/storefront/AccountSettings";
import { requireUser } from "@/lib/server/session";
import { getAccountData } from "@/lib/server/data";
import { formatDate, formatPrice, initials } from "@/lib/format";
import { ORDER_STATUS_LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata = { title: "My account" };

export default async function AccountPage() {
  const session = await requireUser("/account");
  if (session.role === "admin") redirect("/admin");

  let account = null;
  try {
    account = await getAccountData(session.id);
  } catch (error) {
    console.error("Account page data error:", error.message);
  }

  if (!account) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-amber-100 text-4xl">👋</div>
        <h1 className="mt-5 text-3xl font-black text-ink-900">We couldn&apos;t load your profile</h1>
        <p className="mt-2 text-sm text-slate-500">
          Your session may be old. Please sign out and sign in again.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <LogoutButton redirectTo="/login" />
        </div>
      </div>
    );
  }

  const { user, orders } = account;
  const totalSpent = orders
    .filter((order) => order.status !== "cancelled")
    .reduce((sum, order) => sum + order.totalAmount, 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-[1.4rem] bg-toy-purple text-xl font-black text-white shadow-lg shadow-violet-200">
            {initials(user.name || session.name || user.email)}
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-600">
              My account
            </p>
            <h1 className="text-2xl font-black text-ink-900">
              {user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Welcome"}
            </h1>
            <p className="text-sm text-slate-500">{user.email}</p>
          </div>
        </div>
        <LogoutButton />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-[1.6rem] border border-amber-200 bg-amber-50/50 p-5">
          <p className="text-[11px] font-black uppercase tracking-wide text-amber-700">Orders</p>
          <p className="mt-1 text-2xl font-black text-ink-900">{orders.length}</p>
        </div>
        <div className="rounded-[1.6rem] border border-violet-200 bg-[#f8f6ff] p-5">
          <p className="text-[11px] font-black uppercase tracking-wide text-toy-purple">Total spent</p>
          <p className="mt-1 text-2xl font-black text-ink-900">{formatPrice(totalSpent)}</p>
        </div>
        <div className="rounded-[1.6rem] border border-emerald-200 bg-emerald-50/50 p-5">
          <p className="text-[11px] font-black uppercase tracking-wide text-emerald-700">Member since</p>
          <p className="mt-1 text-lg font-black text-ink-900">{formatDate(user.createdAt)}</p>
        </div>
      </div>

      <section className="mt-8">
        <div className="flex items-end justify-between gap-3">
          <h2 className="text-xl font-black text-ink-900">Order history</h2>
          <Link href="/shop" className="text-sm font-bold text-toy-purple hover:text-violet-700">
            Shop again →
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="mt-4 rounded-[2rem] border border-dashed border-amber-300 bg-white px-6 py-14 text-center">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-amber-100 text-4xl">
              🎁
            </div>
            <h3 className="mt-4 text-lg font-black text-ink-900">No orders yet</h3>
            <p className="mt-1 text-sm text-slate-500">Your future favourites are waiting in the shop.</p>
            <Link
              href="/shop"
              className="mt-5 inline-flex rounded-full bg-toy-orange px-6 py-3 text-xs font-black uppercase tracking-wide text-white shadow-md shadow-amber-200 transition hover:bg-amber-600"
            >
              Find a toy
            </Link>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {orders.map((order) => (
              <div
                key={order._id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-[1.6rem] border border-slate-200 bg-white p-5 transition hover:border-amber-200 hover:shadow-md hover:shadow-amber-100/50"
              >
                <div>
                  <p className="font-black text-ink-900">{order.orderNumber}</p>
                  <p className="text-xs text-slate-500">
                    {formatDate(order.createdAt)} · {order.items.length}{" "}
                    {order.items.length === 1 ? "item" : "items"}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    order.status === "delivered"
                      ? "bg-emerald-100 text-emerald-700"
                      : order.status === "cancelled"
                        ? "bg-rose-100 text-rose-700"
                        : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {ORDER_STATUS_LABELS[order.status] || order.status}
                </span>
                <p className="text-lg font-black text-ink-900">{formatPrice(order.totalAmount)}</p>
                <Link
                  href={`/order/${order.orderNumber}?token=${order.accessToken}`}
                  className="rounded-full border border-slate-200 px-4 py-2 text-xs font-black uppercase tracking-wide text-ink-700 transition hover:border-toy-purple hover:text-toy-purple"
                >
                  View order
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      <AccountSettings user={user} initialAddresses={user.addressBook || []} />
    </div>
  );
}
