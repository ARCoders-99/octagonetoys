import CustomersClient from "@/components/admin/CustomersClient";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage({ searchParams }) {
  const params = await searchParams;
  const search = typeof params.search === "string" ? params.search : "";

  return <CustomersClient initialSearch={search} />;
}
