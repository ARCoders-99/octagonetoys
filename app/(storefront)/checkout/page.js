import CheckoutForm from "@/components/storefront/CheckoutForm";
import { getSession } from "@/lib/server/session";
import { getCustomerProfile } from "@/lib/server/data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Checkout",
  description: "Complete your Octagonetoys order securely with cash on delivery or bank transfer.",
};

export default async function CheckoutPage() {
  const session = await getSession();
  let profile = null;

  if (session?.role === "customer") {
    try {
      profile = await getCustomerProfile(session.id);
    } catch (error) {
      console.error("Checkout profile lookup failed:", error.message);
    }
  }

  const displayName =
    profile?.name || `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim() || session?.name || "";

  return (
    <CheckoutForm
      defaultName={session?.role === "customer" ? displayName : ""}
      defaultEmail={session?.role === "customer" ? profile?.email || session.email || "" : ""}
      defaultAddress={session?.role === "customer" ? profile?.addressBook?.[0] || null : null}
    />
  );
}
