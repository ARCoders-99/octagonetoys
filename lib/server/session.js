// lib/server/session.js
// Server-side session helpers used by Server Components and layouts.

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE, verifyToken } from "@/lib/auth";

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  if (!token) return null;

  try {
    return verifyToken(token);
  } catch {
    return null;
  }
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/admin/login");
  }
  return session;
}

export async function requireUser(nextPath = "/account") {
  const session = await getSession();
  if (!session) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }
  return session;
}
