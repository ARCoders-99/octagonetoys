"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import LogoutButton from "@/components/storefront/LogoutButton";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: "▦", exact: true },
  { href: "/admin/products", label: "Products", icon: "🏷️" },
  { href: "/admin/collections", label: "Collections", icon: "🗂️" },
  { href: "/admin/inventory", label: "Inventory", icon: "📦" },
  { href: "/admin/orders", label: "Orders", icon: "🧾" },
  { href: "/admin/customers", label: "Customers", icon: "👥" },
  { href: "/admin/messages", label: "Messages", icon: "✉️" },
  { href: "/admin/reviews", label: "Reviews", icon: "⭐" },
  { href: "/admin/discounts", label: "Discounts", icon: "🎯" },
  { href: "/admin/settings", label: "Settings", icon: "⚙️" },
];

function isActive(pathname, item) {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export default function AdminShell({ session, children }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-5 py-5">
        <Image
          src="/brand/logo.png"
          alt="Octagonetoys"
          width={640}
          height={643}
          sizes="100px"
          className="h-11 w-auto object-contain"
        />
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
          Admin panel
        </p>
      </div>

      <nav className="mt-2 flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                active
                  ? "bg-white/10 text-white shadow-inner"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="rounded-xl bg-white/5 px-3 py-3">
          <p className="truncate text-sm font-bold text-white">{session?.name || "Admin"}</p>
          <p className="truncate text-xs text-slate-400">{session?.email}</p>
        </div>
        <div className="mt-3 grid gap-2">
          <Link
            href="/"
            className="rounded-xl border border-white/10 px-3 py-2 text-center text-xs font-bold text-slate-300 transition hover:bg-white/5 hover:text-white"
          >
            View storefront
          </Link>
          <LogoutButton
            redirectTo="/admin/login"
            className="rounded-xl bg-white/5 px-3 py-2 text-xs font-bold text-slate-300 transition hover:bg-rose-500/20 hover:text-rose-200 disabled:opacity-60"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 bg-ink-900 lg:block">
        {sidebar}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-ink-900/60 backdrop-blur-sm"
          />
          <aside className="relative h-full w-64 bg-ink-900">{sidebar}</aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-ink-700 hover:bg-slate-100 lg:hidden"
            aria-label="Open admin menu"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          </button>

          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
              Store online
            </span>
            <span className="hidden truncate text-xs text-slate-400 sm:block">
              Manage products, orders and customers
            </span>
          </div>

          <Link
            href="/admin/products/new"
            className="rounded-xl bg-ink-900 px-4 py-2 text-xs font-bold text-white hover:bg-ink-800"
          >
            + New product
          </Link>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
