"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/providers/CartProvider";
import { useSettings } from "@/components/providers/SettingsProvider";
import { formatPrice } from "@/lib/format";

export default function CartView() {
  const { items, ready, subtotal, updateQuantity, removeItem, clearCart } = useCart();
  const settings = useSettings();

  if (!ready) {
    return <div className="mx-auto max-w-7xl px-4 py-20 text-center text-sm text-slate-500">Loading your cart…</div>;
  }

  if (!items.length) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-amber-100 text-4xl">🛒</div>
        <h1 className="mt-5 text-3xl font-black text-slate-900">Your cart is empty</h1>
        <p className="mt-2 text-slate-500">Let&apos;s find a toy that sparks something great.</p>
        <Link href="/shop" className="mt-6 inline-flex rounded-full bg-toy-orange px-6 py-3 text-xs font-black uppercase tracking-wide text-white shadow-md shadow-amber-200 transition hover:bg-amber-600">
          Start shopping
        </Link>
      </div>
    );
  }

  const shipping = subtotal >= settings.freeShippingThreshold ? 0 : settings.shippingFee;
  const total = subtotal + shipping;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-amber-600">Your bag</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Shopping cart</h1>
        </div>
        <button type="button" onClick={clearCart} className="text-sm font-semibold text-slate-500 underline-offset-4 transition hover:text-rose-600 hover:underline">
          Clear cart
        </button>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.productId} className="flex gap-4 rounded-3xl border border-slate-200 bg-white p-4 transition hover:border-amber-200 hover:shadow-sm">
              <Link href={`/product/${item.slug}`} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-slate-100 bg-amber-50 sm:h-28 sm:w-28">
                {item.image ? (
                  <Image src={item.image} alt={item.name} fill sizes="112px" className="object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-3xl">🧸</div>
                )}
              </Link>

              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link href={`/product/${item.slug}`} className="line-clamp-2 font-bold text-slate-900 hover:text-amber-600">
                      {item.name}
                    </Link>
                    <p className="mt-1 text-sm text-slate-500">{formatPrice(item.price)} each</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.productId)}
                    className="rounded-full p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                    aria-label={`Remove ${item.name}`}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                      <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>

                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
                  <div className="flex items-center rounded-full border border-slate-200 bg-white">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="px-3 py-1.5 text-slate-500 transition hover:text-amber-600"
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="min-w-8 text-center text-sm font-bold">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="px-3 py-1.5 text-slate-500 transition hover:text-amber-600"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-base font-black text-slate-900">{formatPrice(item.price * item.quantity)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <aside className="h-fit rounded-3xl border border-amber-200 bg-amber-50/50 p-6 lg:sticky lg:top-28">
          <h2 className="text-lg font-black text-slate-900">Order summary</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between text-slate-600">
              <dt>Subtotal</dt>
              <dd className="font-semibold text-slate-900">{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between text-slate-600">
              <dt>Shipping</dt>
              <dd className="font-semibold text-slate-900">{shipping === 0 ? "Free" : formatPrice(shipping)}</dd>
            </div>
            {shipping > 0 && (
              <p className="rounded-2xl bg-white px-3 py-2 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                Add {formatPrice(settings.freeShippingThreshold - subtotal)} more for free delivery.
              </p>
            )}
            <div className="flex justify-between border-t border-amber-200/70 pt-3 text-base font-black text-slate-900">
              <dt>Total</dt>
              <dd>{formatPrice(total)}</dd>
            </div>
          </dl>

          <Link href="/checkout" className="mt-5 flex w-full items-center justify-center rounded-full bg-toy-orange px-5 py-3.5 text-xs font-black uppercase tracking-wide text-white shadow-md shadow-amber-200 transition hover:bg-amber-600 active:scale-[0.99]">
            Continue to checkout
          </Link>
          <Link href="/shop" className="mt-3 block text-center text-sm font-semibold text-slate-600 transition hover:text-toy-purple">
            Continue shopping
          </Link>

          <div className="mt-5 space-y-2 border-t border-amber-200/70 pt-4 text-xs font-semibold text-slate-500">
            <p className="flex items-center gap-2"><span className="text-toy-green">✓</span> Secure checkout</p>
            <p className="flex items-center gap-2"><span className="text-toy-green">✓</span> Cash on delivery available</p>
            <p className="flex items-center gap-2"><span className="text-toy-green">✓</span> 7-day easy returns</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
