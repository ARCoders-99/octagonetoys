import { redirect } from "next/navigation";
import RegisterForm from "@/components/storefront/RegisterForm";
import { getSession } from "@/lib/server/session";

export const dynamic = "force-dynamic";

export const metadata = { title: "Create an account" };

export default async function RegisterPage() {
  const session = await getSession();
  if (session?.role === "admin") redirect("/admin");
  if (session) redirect("/account");

  return <RegisterForm />;
}
