// app/api/auth/logout/route.js

import { AUTH_COOKIE } from "@/lib/auth";
import { jsonOk } from "@/lib/server/api";

export async function POST() {
  const response = jsonOk({ message: "Logged out successfully" });
  response.cookies.set(AUTH_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
