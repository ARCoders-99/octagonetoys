"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "octagonetoys-cart-v1";
const CartContext = createContext(null);

function cleanItem(item) {
  if (!item?.productId) return null;
  return {
    productId: String(item.productId),
    slug: String(item.slug || ""),
    name: String(item.name || "Product"),
    price: Math.max(0, Math.round(Number(item.price) || 0)),
    image: String(item.image || ""),
    stock: Math.max(0, Math.round(Number(item.stock) || 0)),
    quantity: Math.max(1, Math.min(99, Math.round(Number(item.quantity) || 1))),
  };
}

export default function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [ready, setReady] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
      if (Array.isArray(stored)) {
        setItems(stored.map(cleanItem).filter(Boolean));
      }
    } catch {
      setItems([]);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage can be unavailable in private mode. The cart still works for the session.
    }
  }, [items, ready]);

  const addItem = (product, quantity = 1) => {
    const incoming = cleanItem({
      productId: product.productId || product._id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      image: product.image || product.images?.[0]?.url || "",
      stock: product.stock,
      quantity,
    });
    if (!incoming) return;

    setItems((current) => {
      const existing = current.find((item) => item.productId === incoming.productId);
      if (!existing) return [...current, incoming];

      return current.map((item) => {
        if (item.productId !== incoming.productId) return item;
        const max = Math.max(1, incoming.stock || item.stock || 99);
        return {
          ...item,
          ...incoming,
          quantity: Math.min(max, item.quantity + incoming.quantity),
        };
      });
    });
  };

  const removeItem = (productId) => {
    setItems((current) => current.filter((item) => item.productId !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    setItems((current) =>
      current
        .map((item) => {
          if (item.productId !== productId) return item;
          const max = Math.max(1, item.stock || 99);
          const next = Math.max(0, Math.min(max, Math.round(Number(quantity) || 0)));
          return { ...item, quantity: next };
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const clearCart = () => setItems([]);

  const openCart = useCallback(() => setDrawerOpen(true), []);
  const closeCart = useCallback(() => setDrawerOpen(false), []);

  const count = useMemo(
    () => items.reduce((total, item) => total + item.quantity, 0),
    [items]
  );

  const subtotal = useMemo(
    () => items.reduce((total, item) => total + item.price * item.quantity, 0),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      ready,
      count,
      subtotal,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      drawerOpen,
      openCart,
      closeCart,
      isInCart: (productId) => items.some((item) => item.productId === String(productId)),
    }),
    [items, ready, count, subtotal, drawerOpen, openCart, closeCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }
  return context;
}
