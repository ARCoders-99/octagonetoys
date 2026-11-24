"use client";

import { useEffect, useRef, useState } from "react";
import { useCart } from "@/components/providers/CartProvider";
import { effectivePrice } from "@/lib/format";

export function CartIcon({ className = "h-4 w-4" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 8H6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="20" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="18" cy="20" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 animate-spin" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export default function AddToCartButton({ product, compact = false, className = "" }) {
  const { addItem, openCart } = useCart();
  const [added, setAdded] = useState(false);
  const [loading, setLoading] = useState(false);
  const timers = useRef([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const outOfStock = Number(product?.stock) <= 0;

  const handleClick = () => {
    if (outOfStock || loading) return;

    timers.current.forEach(clearTimeout);
    timers.current = [];

    setAdded(false);
    setLoading(true);
    addItem({ ...product, price: effectivePrice(product) }, 1);

    timers.current.push(
      setTimeout(() => {
        setLoading(false);
        setAdded(true);
        openCart();
      }, 450)
    );
    timers.current.push(setTimeout(() => setAdded(false), 2200));
  };

  const base = compact
    ? "inline-flex h-10 w-full items-center justify-center gap-2 whitespace-nowrap rounded-full px-3 text-[11px] font-black uppercase tracking-wide"
    : "inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-black uppercase tracking-wide";

  if (outOfStock) {
    return (
      <button
        type="button"
        disabled
        className={`${base} cursor-not-allowed bg-slate-100 text-slate-400 ${className}`}
      >
        <CartIcon />
        Sold out
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      aria-busy={loading}
      aria-label={`Add ${product?.name || "product"} to cart`}
      className={`${base} ${
        added
          ? "bg-emerald-600 text-white"
          : "bg-toy-purple text-white shadow-[0_6px_16px_-8px_rgba(114,50,220,0.8)] transition hover:bg-[#5f24bd] active:scale-[0.98] disabled:cursor-wait disabled:hover:bg-toy-purple disabled:active:scale-100"
      } ${className}`}
    >
      {loading ? (
        <>
          <Spinner />
          Adding...
        </>
      ) : (
        <>
          <CartIcon />
          {added ? "Added ✓" : "Add to cart"}
        </>
      )}
    </button>
  );
}
