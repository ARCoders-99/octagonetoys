"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/components/admin/adminFetch";
import {
  Badge,
  EmptyState,
  ErrorBanner,
  PageHeader,
  Spinner,
  inputClass,
} from "@/components/admin/ui";
import { formatDate } from "@/lib/format";

const FILTERS = [
  { value: "", label: "All reviews" },
  { value: "false", label: "Awaiting approval" },
  { value: "true", label: "Approved" },
];

function Stars({ rating }) {
  return (
    <span className="text-sm tracking-tight text-brand-500">
      {"★★★★★".slice(0, rating)}
      <span className="text-slate-200">{"★★★★★".slice(rating)}</span>
    </span>
  );
}

export default function ReviewsClient({ initialApproved = "" }) {
  const [reviews, setReviews] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [approved, setApproved] = useState(initialApproved);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  const load = useCallback(async (approvedFilter = "", term = "") => {
    setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams({ limit: "50" });
      if (approvedFilter === "true" || approvedFilter === "false") {
        query.set("approved", approvedFilter);
      }
      if (term.trim()) query.set("search", term.trim());
      const data = await adminFetch(`/api/admin/reviews?${query.toString()}`);
      setReviews(data.reviews || []);
      setPendingCount(data.pendingCount || 0);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(initialApproved, "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  const changeFilter = (value) => {
    setApproved(value);
    load(value, search);
  };

  const act = async (review, action) => {
    setBusyId(review._id);
    setError("");
    try {
      if (action === "delete") {
        if (!window.confirm("Delete this review permanently (soft delete)? The product rating will be recalculated.")) {
          setBusyId("");
          return;
        }
        await adminFetch(`/api/admin/reviews/${review._id}`, { method: "DELETE" });
        setReviews((current) => current.filter((item) => item._id !== review._id));
      } else {
        const data = await adminFetch(`/api/admin/reviews/${review._id}`, {
          method: "PATCH",
          body: JSON.stringify({ isApproved: action === "approve" }),
        });
        if (approved === "") {
          setReviews((current) =>
            current.map((item) => (item._id === review._id ? { ...item, ...data.review } : item))
          );
        } else {
          setReviews((current) => current.filter((item) => item._id !== review._id));
        }
      }

      setPendingCount((current) =>
        action === "approve"
          ? Math.max(0, current - 1)
          : action === "reject"
            ? current + 1
            : current
      );
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reviews moderation"
        description="Approve genuine reviews to publish them. Product average ratings and counts update automatically."
      >
        <Badge tone="warning">{pendingCount} awaiting approval</Badge>
      </PageHeader>

      <ErrorBanner message={error} onRetry={() => load(approved, search)} />

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => changeFilter(filter.value)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                approved === filter.value
                  ? "bg-ink-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {filter.label}
            </button>
          ))}

          <form
            onSubmit={(event) => {
              event.preventDefault();
              load(approved, search);
            }}
            className="ml-auto flex gap-2"
          >
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search reviews…"
              className={`${inputClass} max-w-xs`}
            />
            <button type="submit" className="rounded-xl bg-ink-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-ink-800">
              Search
            </button>
          </form>
        </div>
      </div>

      {loading ? (
        <Spinner label="Loading reviews…" />
      ) : reviews.length === 0 ? (
        <EmptyState
          icon="⭐"
          title={approved === "false" ? "No reviews awaiting approval" : "No reviews found"}
          description="Customer reviews submitted on product pages will appear here for moderation."
        />
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => {
            const product = review.productId;
            return (
              <article key={review._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                      {product?.images?.[0]?.url ? (
                        <Image src={product.images[0].url} alt={product.name} fill sizes="56px" className="object-cover" />
                      ) : (
                        <div className="grid h-full place-items-center text-xl">🧸</div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-black text-ink-900">
                        {product?.name || "Deleted product"}
                      </p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2">
                        <Stars rating={review.rating} />
                        <span className="text-xs text-slate-400">{formatDate(review.createdAt)}</span>
                        <Badge tone={review.isApproved ? "success" : "warning"}>
                          {review.isApproved ? "Approved" : "Pending"}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        by <span className="font-semibold text-slate-700">{review.authorName}</span>
                        {review.authorEmail ? ` · ${review.authorEmail}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {review.isApproved ? (
                      <button
                        type="button"
                        onClick={() => act(review, "reject")}
                        disabled={busyId === review._id}
                        className="rounded-lg border border-amber-200 px-3 py-1.5 text-xs font-bold text-amber-700 hover:bg-amber-50 disabled:opacity-50"
                      >
                        Unapprove
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => act(review, "approve")}
                        disabled={busyId === review._id}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        Approve
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => act(review, "delete")}
                      disabled={busyId === review._id}
                      className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {review.title && (
                  <h3 className="mt-3 text-sm font-black text-ink-900">{review.title}</h3>
                )}
                <p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-600">
                  {review.comment || "No written comment."}
                </p>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
