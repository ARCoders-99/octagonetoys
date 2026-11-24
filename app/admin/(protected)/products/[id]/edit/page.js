import ProductForm from "@/components/admin/ProductForm";

export default async function AdminEditProductPage({ params }) {
  const { id } = await params;
  return <ProductForm productId={id} />;
}
