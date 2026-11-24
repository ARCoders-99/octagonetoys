"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/components/providers/CartProvider";

function BrandMark({ className = "", priority = false }) {
  return (
    <Image
      src="/brand/logo.png"
      alt="Octagonetoys"
      width={640}
      height={643}
      priority={priority}
      sizes="96px"
      className={`w-auto object-contain ${className}`}
    />
  );
}

function IconSearch() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" strokeLinecap="round" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.5 20c.8-3.6 3.9-5.6 7.5-5.6s6.7 2 7.5 5.6" strokeLinecap="round" />
    </svg>
  );
}

function IconBag() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
      <path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 8Z" strokeLinejoin="round" />
      <path d="M9 8V6.5a3 3 0 0 1 6 0V8" strokeLinecap="round" />
    </svg>
  );
}

function IconMenu() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-6 w-6">
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-5 w-5">
      <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
    </svg>
  );
}

const MENU_LINKS = [
  { href: "/shop", label: "Shop all toys" },
  { href: "/collections", label: "Collections" },
  { href: "/shop?sort=newest", label: "New arrivals" },
  { href: "/cart", label: "Cart" },
  { href: "/account", label: "My account" },
];

const DESKTOP_LINKS = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop all toys" },
  { href: "/collections", label: "Collections" },
  { href: "/shop?sort=newest", label: "New arrivals" },
  { href: "/contact", label: "Contact" },
];

const AGE_LINKS = [
  { href: "/shop?age=0-1", label: "0 – 1 year", color: "#f59e0b" },
  { href: "/shop?age=1-3", label: "1 – 3 years", color: "#3b82f6" },
  { href: "/shop?age=3-6", label: "3 – 6 years", color: "#22c55e" },
  { href: "/shop?age=6-plus", label: "6+ years", color: "#a855f7" },
];

export default function Header({ collections = [] }) {
  const { count, openCart } = useCart();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const featuredCollections = collections.slice(0, 8);

  // Close the drawer whenever the route changes.
  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    if (!mobileOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [mobileOpen]);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white">
        {/* Announcement bar */}
        <div className="bg-toy-purple text-white">
          <div className="mx-auto flex h-9 max-w-[1400px] items-center justify-center gap-8 px-4 text-[11px] font-semibold tracking-wide sm:justify-between sm:px-6 lg:px-8">
            <p className="truncate">Free Delivery on Orders Above Rs. 3,999</p>
            <p className="hidden md:block">Trusted by Thousands of Pakistani Families</p>
            <p className="hidden lg:block">Easy Return &amp; Exchange</p>
          </div>
        </div>

        {/* Main header */}
        <div className="border-b border-slate-200">
          <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-4 sm:h-[72px] sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-slate-800 transition hover:bg-slate-100 lg:hidden"
              aria-label="Open menu"
              aria-expanded={mobileOpen}
            >
              <IconMenu />
            </button>

            <Link href="/" className="shrink-0" aria-label="Octagonetoys home">
              <BrandMark className="h-14" priority />
            </Link>

            <nav
              aria-label="Main navigation"
              className="hidden flex-1 items-center justify-center gap-1 lg:flex"
            >
              {DESKTOP_LINKS.map((link) => {
                const active =
                  link.href === "/"
                    ? pathname === "/"
                    : !link.href.includes("?") && pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`rounded-full px-3.5 py-2 text-[16px] font-bold transition ${
                      active
                        ? "bg-amber-50 text-toy-orange"
                        : "text-slate-700 hover:bg-slate-50 hover:text-toy-orange"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
              <button
                type="button"
                onClick={() => setSearchOpen((open) => !open)}
                className="grid h-10 w-10 place-items-center rounded-full text-slate-800 transition hover:bg-slate-100"
                aria-label="Search products"
                aria-expanded={searchOpen}
              >
                <IconSearch />
              </button>

              <Link
                href="/account"
                className="grid h-10 w-10 place-items-center rounded-full text-slate-800 transition hover:bg-slate-100"
                aria-label="My account"
              >
                <IconUser />
              </Link>

              <button
                type="button"
                onClick={openCart}
                className="relative grid h-10 w-10 place-items-center rounded-full text-slate-800 transition hover:bg-slate-100"
                aria-label={`Open cart, ${count} items`}
              >
                <IconBag />
                <span className="absolute right-0.5 top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-toy-orange px-1 text-[10px] font-black leading-none text-white">
                  {count > 99 ? "99+" : count}
                </span>
              </button>
            </div>
          </div>

          {/* Expanding search panel */}
          {searchOpen && (
            <div className="border-t border-slate-100 bg-white">
              <form
                action="/shop"
                method="get"
                className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3 sm:px-6 lg:px-8"
              >
                <IconSearch />
                <input
                  name="q"
                  autoFocus
                  placeholder="Search toys, blocks, RC cars…"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  className="rounded-full bg-toy-orange px-5 py-2 text-xs font-black uppercase tracking-wide text-white transition hover:bg-amber-600"
                >
                  Search
                </button>
              </form>
            </div>
          )}
        </div>
      </header>

      {/* Slide-out menu */}
      <div
        className={`fixed inset-0 z-50 ${mobileOpen ? "" : "pointer-events-none"}`}
        aria-hidden={!mobileOpen}
      >
        <button
          type="button"
          tabIndex={mobileOpen ? 0 : -1}
          onClick={() => setMobileOpen(false)}
          className={`absolute inset-0 bg-slate-900/50 transition-opacity duration-300 ${
            mobileOpen ? "opacity-100" : "opacity-0"
          }`}
          aria-label="Close menu"
        />
        <aside
          className={`absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col bg-white shadow-2xl transition-transform duration-300 ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <Link href="/" onClick={() => setMobileOpen(false)} aria-label="Octagonetoys home">
              <BrandMark className="h-10" />
            </Link>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="grid h-9 w-9 place-items-center rounded-full text-slate-700 hover:bg-slate-100"
              aria-label="Close menu"
            >
              <IconClose />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-5 py-5">
            <ul className="space-y-1">
              {MENU_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-xl px-3 py-2.5 text-[15px] font-bold text-slate-800 transition hover:bg-amber-50 hover:text-amber-700"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <p className="mt-6 px-3 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
              Shop by age
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {AGE_LINKS.map((age) => (
                <Link
                  key={age.href}
                  href={age.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: age.color }}
                    aria-hidden="true"
                  />
                  {age.label}
                </Link>
              ))}
            </div>

            {featuredCollections.length > 0 && (
              <>
                <p className="mt-6 px-3 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                  Collections
                </p>
                <ul className="mt-2 space-y-1">
                  {featuredCollections.map((collection) => (
                    <li key={collection._id}>
                      <Link
                        href={`/collections/${collection.slug}`}
                        onClick={() => setMobileOpen(false)}
                        className="block rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                      >
                        {collection.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}

            <div className="mt-8 rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-black text-slate-900">Need a hand?</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                We help you pick the perfect gift by age and interest.
              </p>
              <Link
                href="/shop"
                onClick={() => setMobileOpen(false)}
                className="mt-3 inline-flex rounded-full bg-toy-orange px-4 py-2 text-xs font-black uppercase tracking-wide text-white"
              >
                Start shopping
              </Link>
            </div>
          </nav>

          <div className="border-t border-slate-200 px-5 py-4">
            <Link
              href="/admin"
              onClick={() => setMobileOpen(false)}
              className="text-xs font-semibold text-slate-400 hover:text-slate-700"
            >
              Store admin
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}
