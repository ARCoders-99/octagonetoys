import Image from "next/image";
import Link from "next/link";
import { getOrderForCustomer } from "@/lib/server/data";
import { formatDateTime, formatPrice } from "@/lib/format";
import { ORDER_STATUS_LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Order confirmation",
};

const STATUS_STEPS = ["pending", "confirmed", "processing", "shipped", "delivered"];

export default async function OrderConfirmationPage({ params, searchParams }) {
  const { orderNumber } = await params;
  const query = await searchParams;
  const token = typeof query.token === "string" ? query.token : "";

  let order = null;
  try {
    order = await getOrderForCustomer(orderNumber, token);
  } catch (error) {
    console.error("Order confirmation data error:", error.message);
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-amber-100 text-4xl">
          🔒
        </div>
        <h1 className="mt-5 text-3xl font-black tracking-tight text-ink-900">Order not available</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          This order link is invalid or has expired. If you just placed an order, check the
          confirmation email for the correct link, or contact support.
        </p>
        <Link
          href="/shop"
          className="mt-6 inline-flex rounded-full bg-toy-orange px-6 py-3 text-xs font-black uppercase tracking-wide text-white shadow-md shadow-amber-200 transition hover:bg-amber-600"
        >
          Back to shop
        </Link>
      </div>
    );
  }

  const currentIndex = STATUS_STEPS.indexOf(order.status);
  const isCancelled = order.status === "cancelled";

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-[2rem] border border-emerald-200 bg-emerald-50/50 p-6 text-center shadow-sm sm:p-8">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-toy-green text-3xl text-white shadow-lg shadow-emerald-200">
          ✓
        </div>
        <h1 className="mt-4 text-3xl font-black tracking-tight text-ink-900">
          Thank you for your order!
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Order{" "}
          <span className="inline-flex rounded-full bg-white px-2.5 py-0.5 font-black text-emerald-700 ring-1 ring-emerald-200">
            {order.orderNumber}
          </span>{" "}
          was placed on {formatDateTime(order.createdAt)}.
        </p>
        <p className="mt-1 text-sm text-slate-600">
          A confirmation has been sent to{" "}
          <span className="font-semibold">{order.shippingAddress.email}</span>.
        </p>
        <p className="mx-auto mt-4 max-w-lg rounded-2xl bg-white/80 px-4 py-2 text-xs text-slate-500 ring-1 ring-emerald-100">
          Bookmark this page — it is your private order tracking link. Do not share it publicly.
        </p>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <section className="rounded-[1.8rem] border border-slate-200 bg-white p-5 sm:p-6">
            <h2 className="text-lg font-black text-ink-900">Order status</h2>

            {isCancelled ? (
              <p className="mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 ring-1 ring-rose-100">
                This order was cancelled. Contact us if you need help placing a new order.
              </p>
            ) : (
              <ol className="mt-5 space-y-3">
                {STATUS_STEPS.map((status, index) => {
                  const done = index <= currentIndex;
                  const active = index === currentIndex;
                  return (
                    <li key={status} className="flex items-center gap-3">
                      <span
                        className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-black transition ${
                          done
                            ? "bg-toy-green text-white shadow-sm shadow-emerald-200"
                            : "bg-slate-100 text-slate-400"
                        } ${active ? "ring-4 ring-emerald-100" : ""}`}
                      >
                        {done ? "✓" : index + 1}
                      </span>
                      <div>
                        <p className={`text-sm font-bold ${active ? "text-ink-900" : done ? "text-slate-700" : "text-slate-400"}`}>
                          {ORDER_STATUS_LABELS[status] || status}
                        </p>
                        {active && (
                          <p className="text-xs text-slate-500">Your order is currently at this stage.</p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}

            {order.trackingNumber && (
              <p className="mt-4 rounded-2xl bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-amber-200">
                Tracking: <span className="font-bold text-ink-900">{order.trackingNumber}</span>
                {order.carrier ? ` (${order.carrier})` : ""}
              </p>
            )}
          </section>

          <section className="rounded-[1.8rem] border border-slate-200 bg-white p-5 sm:p-6">
            <h2 className="text-lg font-black text-ink-900">Items</h2>
            <ul className="mt-4 divide-y divide-slate-100">
              {order.items.map((item, index) => (
                <li key={`${item.productId}-${index}`} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-amber-50 ring-1 ring-amber-100">
                    {item.image ? (
                      <Image src={item.image} alt={item.title} fill sizes="64px" className="object-cover" />
                    ) : (
                      <div className="grid h-full place-items-center text-2xl">🧸</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-ink-900">{item.title}</p>
                    <p className="text-xs text-slate-500">
                      {formatPrice(item.price)} × {item.quantity}
                    </p>
                  </div>
                  <p className="font-black text-ink-900">{formatPrice(item.price * item.quantity)}</p>
                </li>
              ))}
            </ul>

            <dl className="mt-4 space-y-2 rounded-2xl bg-amber-50/50 p-4 text-sm ring-1 ring-amber-100">
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
              <div className="flex justify-between border-t border-amber-200 pt-3 text-base font-black text-ink-900">
                <dt>Total</dt>
                <dd>{formatPrice(order.totalAmount)}</dd>
              </div>
            </dl>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-[1.8rem] border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-black uppercase tracking-wide text-ink-900">Shipping to</h2>
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
              <br />
              {order.shippingAddress.phone}
            </address>
          </section>

          <section className="rounded-[1.8rem] border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-black uppercase tracking-wide text-ink-900">Payment</h2>
            <p className="mt-2 text-sm text-slate-600">
              Method: <span className="font-bold text-ink-900">{order.paymentMethod}</span>
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Status: <span className="font-bold text-ink-900">{order.paymentStatus}</span>
            </p>
            {order.customerNotes && (
              <>
                <h3 className="mt-4 text-sm font-black uppercase tracking-wide text-ink-900">Notes</h3>
                <p className="mt-1 text-sm text-slate-600">{order.customerNotes}</p>
              </>
            )}
          </section>

          <Link
            href="/shop"
            className="block rounded-full bg-toy-orange px-4 py-3 text-center text-xs font-black uppercase tracking-wide text-white shadow-md shadow-amber-200 transition hover:bg-amber-600"
          >
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
