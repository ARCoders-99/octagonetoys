import CartProvider from "@/components/providers/CartProvider";
import SettingsProvider from "@/components/providers/SettingsProvider";
import Header from "@/components/storefront/Header";
import Footer from "@/components/storefront/Footer";
import WhatsAppButton from "@/components/storefront/WhatsAppButton";
import CartDrawer from "@/components/storefront/CartDrawer";
import { getStorefrontCollections } from "@/lib/server/data";
import { getSettings } from "@/lib/server/settings";

export const dynamic = "force-dynamic";

export default async function StorefrontLayout({ children }) {
  let collections = [];
  let settings = null;

  try {
    collections = await getStorefrontCollections();
  } catch (error) {
    console.error("Storefront layout could not load collections:", error.message);
  }

  try {
    settings = await getSettings();
  } catch (error) {
    console.error("Storefront layout could not load settings:", error.message);
  }

  return (
    <SettingsProvider settings={settings}>
      <CartProvider>
        <div className="flex min-h-screen flex-col">
          <Header collections={collections} />
          <main className="flex-1">{children}</main>
          <Footer collections={collections} settings={settings} />
          <WhatsAppButton />
        </div>
        <CartDrawer />
      </CartProvider>
    </SettingsProvider>
  );
}
