import { redirect } from "next/navigation";
import ForgotPasswordForm from "@/components/storefront/ForgotPasswordForm";
import { getSession } from "@/lib/server/session";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Forgot password",
  description: "Request a secure link to reset your Octagonetoys account password.",
};

export default async function ForgotPasswordPage() {
  const session = await getSession();
  if (session) redirect(session.role === "admin" ? "/admin" : "/account");

  return <ForgotPasswordForm />;
}
