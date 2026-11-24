"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/components/providers/CartProvider";
import { useSettings } from "@/components/providers/SettingsProvider";
import { formatPrice } from "@/lib/format";

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden="true">
      <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function CartDrawer() {
  const { items, ready, subtotal, drawerOpen, closeCart, updateQuantity, removeItem } = useCart();
  const settings = useSettings();
  const pathname = usePathname();
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (drawerOpen) closeButtonRef.current?.focus();
  }, [drawerOpen]);

  useEffect(() => {
    if (!drawerOpen) return undefined;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event) => {
      if (event.key === "Escape") closeCart();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [drawerOpen, closeCart]);

  useEffect(() => {
    closeCart();
  }, [pathname, closeCart]);

  const threshold = Math.max(0, Math.round(Number(settings.freeShippingThreshold) || 0));
  const shippingFee = Math.max(0, Math.round(Number(settings.shippingFee) || 0));
  const remaining = Math.max(0, threshold - subtotal);
  const unlocked = threshold === 0 || subtotal >= threshold;
  const progress = threshold > 0 ? Math.min(100, Math.round((subtotal / threshold) * 100)) : 100;
  const shipping = unlocked ? 0 : shippingFee;
  const total = subtotal + shipping;

  return (
    <div
      className={`fixed inset-0 z-[80] ${drawerOpen ? "" : "pointer-events-none"}`}
      aria-hidden={!drawerOpen}
    >
      <button
        type="button"
        onClick={closeCart}
        aria-label="Close cart"
        tabIndex={drawerOpen ? 0 : -1}
        className={`absolute inset-0 z-0 bg-slate-950/45 backdrop-blur-[2px] transition-opacity duration-300 ${
          drawerOpen ? "opacity-100" : "opacity-0"
        }`}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
        className={`absolute right-0 top-0 z-10 flex h-full w-full max-w-[430px] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-600">Your bag</p>
            <h2 id="cart-drawer-title" className="text-xl font-black text-slate-900">
              Shopping cart
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={closeCart}
            aria-label="Close cart"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <CloseIcon />
          </button>
        </header>

        <div className="border-b border-slate-100 bg-amber-50/60 px-5 py-4">
          {unlocked ? (
            <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-3 py-2.5 text-sm font-bold text-emerald-700 ring-1 ring-emerald-200">
              <span aria-hidden="true">🎉</span>
              You&apos;ve unlocked free shipping!
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3 text-xs font-bold text-slate-700">
                <span>Add {formatPrice(remaining)} more for free shipping</span>
                <span className="shrink-0 text-amber-600">{progress}%</span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-toy-yellow transition-[width] duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {!ready ? (
            <p className="py-16 text-center text-sm text-slate-500">Loading your cart…</p>
          ) : items.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-amber-100 text-3xl">🛒</div>
              <h3 className="mt-4 text-lg font-black text-slate-900">Your cart is empty</h3>
              <p className="mt-1 text-sm text-slate-500">Find a toy your kid will love.</p>
              <Link
                href="/shop"
                onClick={closeCart}
                className="mt-5 inline-flex rounded-full bg-toy-purple px-5 py-2.5 text-xs font-black uppercase tracking-wide text-white transition hover:bg-[#5f24bd]"
              >
                Start shopping
              </Link>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li
                  key={item.productId}
                  className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
                >
                  <Link
                    href={`/product/${item.slug}`}
                    onClick={closeCart}
                    className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-amber-50"
                  >
                    {item.image ? (
                      <Image src={item.image} alt={item.name} fill sizes="80px" className="object-cover" />
                    ) : (
                      <span className="grid h-full place-items-center text-3xl">🧸</span>
                    )}
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/product/${item.slug}`}
                        onClick={closeCart}
                        className="line-clamp-2 text-sm font-bold leading-snug text-slate-900 transition hover:text-toy-purple"
                      >
                        {item.name}
                      </Link>
                      <button
                        type="button"
                        onClick={() => removeItem(item.productId)}
                        aria-label={`Remove ${item.name}`}
                        className="shrink-0 rounded-full p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                      >
                        <TrashIcon />
                      </button>
                    </div>

                    <p className="mt-0.5 text-xs font-bold text-red-600">{formatPrice(item.price)} each</p>

                    <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                      <div className="flex items-center rounded-full border border-slate-200">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          aria-label={`Decrease ${item.name} quantity`}
                          className="px-2.5 py-1 text-sm font-bold text-slate-500 transition hover:text-toy-purple"
                        >
                          −
                        </button>
                        <span className="min-w-7 text-center text-xs font-black text-slate-900">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          aria-label={`Increase ${item.name} quantity`}
                          className="px-2.5 py-1 text-sm font-bold text-slate-500 transition hover:text-toy-purple"
                        >
                          +
                        </button>
                      </div>
                      <p className="text-sm font-black text-slate-900">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {ready && items.length > 0 && (
          <footer className="border-t border-slate-200 bg-white px-5 py-4">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <dt>Subtotal</dt>
                <dd className="font-bold text-slate-900">{formatPrice(subtotal)}</dd>
              </div>
              <div className="flex justify-between text-slate-600">
                <dt>Shipping</dt>
                <dd className={unlocked ? "font-bold text-emerald-600" : "font-bold text-slate-900"}>
                  {unlocked ? "Free" : formatPrice(shipping)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-black text-slate-900">
                <dt>Total</dt>
                <dd>{formatPrice(total)}</dd>
              </div>
            </dl>

            <div className="mt-4 grid gap-2">
              <Link
                href="/checkout"
                onClick={closeCart}
                className="flex w-full items-center justify-center rounded-full bg-toy-purple px-5 py-3 text-xs font-black uppercase tracking-wide text-white shadow-md transition hover:bg-[#5f24bd] active:scale-[0.99]"
              >
                Checkout
              </Link>
              <Link
                href="/cart"
                onClick={closeCart}
                className="flex w-full items-center justify-center rounded-full border-2 border-slate-200 px-5 py-2.5 text-xs font-black uppercase tracking-wide text-slate-700 transition hover:border-toy-purple hover:text-toy-purple"
              >
                View cart
              </Link>
              <button
                type="button"
                onClick={closeCart}
                className="py-1.5 text-xs font-bold text-slate-500 transition hover:text-toy-purple"
              >
                Continue shopping
              </button>
            </div>
          </footer>
        )}
      </aside>
    </div>
  );
}
