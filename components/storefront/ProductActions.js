"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/providers/CartProvider";
import { effectivePrice } from "@/lib/format";
import { CartIcon } from "./AddToCartButton";

function Spinner() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 animate-spin" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export default function ProductActions({ product }) {
  const { addItem, openCart } = useCart();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [loading, setLoading] = useState(false);
  const timers = useRef([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const stock = Number(product?.stock) || 0;
  const outOfStock = stock <= 0;
  const max = Math.max(1, Math.min(stock || 1, 99));

  const add = (thenCheckout = false) => {
    if (outOfStock || loading) return;

    const cartProduct = { ...product, price: effectivePrice(product) };

    if (thenCheckout) {
      addItem(cartProduct, quantity);
      router.push("/checkout");
      return;
    }

    timers.current.forEach(clearTimeout);
    timers.current = [];

    setAdded(false);
    setLoading(true);
    addItem(cartProduct, quantity);

    timers.current.push(
      setTimeout(() => {
        setLoading(false);
        setAdded(true);
        openCart();
      }, 450)
    );
    timers.current.push(setTimeout(() => setAdded(false), 2200));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center rounded-full border border-slate-200 bg-white">
          <button
            type="button"
            onClick={() => setQuantity((value) => Math.max(1, value - 1))}
            disabled={outOfStock}
            className="px-3.5 py-2.5 text-lg font-bold text-slate-500 hover:text-amber-600 disabled:opacity-40"
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="min-w-10 text-center text-sm font-bold">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((value) => Math.min(max, value + 1))}
            disabled={outOfStock}
            className="px-3.5 py-2.5 text-lg font-bold text-slate-500 hover:text-amber-600 disabled:opacity-40"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
        <span className="text-xs font-medium text-slate-500">
          {outOfStock ? "Currently unavailable" : `${stock} available`}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => add(false)}
          disabled={outOfStock || loading}
          aria-busy={loading}
          className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-3.5 text-xs font-black uppercase tracking-wide transition ${
            outOfStock
              ? "cursor-not-allowed bg-slate-100 text-slate-400"
              : added
                ? "bg-emerald-600 text-white"
                : "bg-toy-purple text-white shadow-[0_8px_20px_-10px_rgba(114,50,220,0.8)] hover:bg-[#5f24bd] active:scale-[0.99] disabled:cursor-wait disabled:hover:bg-toy-purple disabled:active:scale-100"
          }`}
        >
          {loading ? (
            <>
              <Spinner />
              Adding...
            </>
          ) : (
            <>
              <CartIcon />
              {outOfStock ? "Sold out" : added ? "Added to cart ✓" : "Add to cart"}
            </>
          )}
        </button>
        <button
          type="button"
          onClick={() => add(true)}
          disabled={outOfStock || loading}
          className="rounded-full border-2 border-toy-purple bg-purple-50 px-5 py-3.5 text-xs font-black uppercase tracking-wide text-toy-purple transition hover:bg-purple-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400"
        >
          Buy it now
        </button>
      </div>
    </div>
  );
}
