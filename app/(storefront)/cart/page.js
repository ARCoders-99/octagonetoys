import CartView from "@/components/storefront/CartView";

export const metadata = {
  title: "Shopping cart",
  description: "Review the toys in your cart before checkout.",
};

export default function CartPage() {
  return <CartView />;
}
