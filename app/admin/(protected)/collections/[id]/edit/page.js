import CollectionForm from "@/components/admin/CollectionForm";

export default async function AdminEditCollectionPage({ params }) {
  const { id } = await params;
  return <CollectionForm collectionId={id} />;
}
