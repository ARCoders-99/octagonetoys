import ResetPasswordForm from "@/components/storefront/ResetPasswordForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Reset password",
  description: "Choose a new password for your Octagonetoys account.",
};

export default async function ResetPasswordPage({ searchParams }) {
  const query = await searchParams;
  const token = typeof query.token === "string" ? query.token : "";

  return <ResetPasswordForm token={token} />;
}
