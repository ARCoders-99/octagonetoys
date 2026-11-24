import OrderDetailClient from "@/components/admin/OrderDetailClient";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({ params }) {
  const { id } = await params;
  return <OrderDetailClient orderId={id} />;
}
