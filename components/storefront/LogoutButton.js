"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LogoutButton({ redirectTo = "/", className = "" }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const logout = async () => {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push(redirectTo);
      router.refresh();
    }
  };

  return (
    <button
      type="button"
      onClick={logout}
      disabled={loading}
      className={
        className ||
        "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:border-rose-300 hover:text-rose-600 disabled:opacity-60"
      }
    >
      {loading ? "Signing out…" : "Sign out"}
    </button>
  );
}
