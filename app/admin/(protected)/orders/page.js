import OrdersClient from "@/components/admin/OrdersClient";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage({ searchParams }) {
  const params = await searchParams;
  const status = typeof params.status === "string" ? params.status : "";

  return <OrdersClient initialStatus={status} />;
}
