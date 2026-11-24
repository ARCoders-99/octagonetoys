import { redirect } from "next/navigation";
import LoginForm from "@/components/storefront/LoginForm";
import { getSession } from "@/lib/server/session";

export const dynamic = "force-dynamic";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }) {
  const query = await searchParams;
  const nextPath = typeof query.next === "string" && query.next.startsWith("/") ? query.next : "/account";

  const session = await getSession();
  if (session?.role === "admin") redirect("/admin");
  if (session) redirect(nextPath);

  return <LoginForm nextPath={nextPath} />;
}
