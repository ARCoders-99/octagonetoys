import ReviewsClient from "@/components/admin/ReviewsClient";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage({ searchParams }) {
  const params = await searchParams;
  const approved = typeof params.approved === "string" ? params.approved : "";

  return <ReviewsClient initialApproved={approved} />;
}
