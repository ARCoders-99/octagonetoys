"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/components/admin/adminFetch";
import {
  Badge,
  EmptyState,
  ErrorBanner,
  PageHeader,
  Spinner,
  buttonDanger,
  buttonSecondary,
  inputClass,
} from "@/components/admin/ui";
import { formatDateTime } from "@/lib/format";

export default function MessagesClient() {
  const [messages, setMessages] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState(null);
  const [busyId, setBusyId] = useState("");

  const load = useCallback(
    async (query = "", onlyUnread = false, nextPage = 1) => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({ page: String(nextPage), limit: "20" });
        if (query.trim()) params.set("search", query.trim());
        if (onlyUnread) params.set("unread", "true");

        const data = await adminFetch(`/api/admin/messages?${params.toString()}`);
        setMessages(data.messages || []);
        setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
        setUnreadCount(data.unreadCount || 0);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    load("", false, 1);
  }, [load]);

  const applyFilters = (event) => {
    event.preventDefault();
    setPage(1);
    load(search, unreadOnly, 1);
  };

  const toggleRead = async (message) => {
    setBusyId(message._id);
    try {
      const data = await adminFetch(`/api/admin/messages/${message._id}`, {
        method: "PATCH",
        body: JSON.stringify({ isRead: !message.isRead }),
      });
      setMessages((current) =>
        current.map((item) => (item._id === message._id ? { ...item, ...data.message } : item))
      );
      setUnreadCount((current) => Math.max(0, current + (message.isRead ? 1 : -1)));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyId("");
    }
  };

  const remove = async (message) => {
    if (!window.confirm(`Delete the message from “${message.name}”?`)) return;
    setBusyId(message._id);
    try {
      await adminFetch(`/api/admin/messages/${message._id}`, { method: "DELETE" });
      setMessages((current) => current.filter((item) => item._id !== message._id));
      setPagination((current) => ({ ...current, total: Math.max(0, current.total - 1) }));
      if (!message.isRead) setUnreadCount((current) => Math.max(0, current - 1));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Messages"
        description="Contact-form submissions from the storefront. Opening a message marks it as read."
      >
        <Badge tone={unreadCount ? "warning" : "slate"}>{unreadCount} unread</Badge>
      </PageHeader>

      <ErrorBanner message={error} onRetry={() => load(search, unreadOnly, page)} />

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <form onSubmit={applyFilters} className="flex flex-wrap items-center gap-3">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, email or message…"
            className={`${inputClass} max-w-sm`}
          />
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(event) => {
                setUnreadOnly(event.target.checked);
                setPage(1);
                load(search, event.target.checked, 1);
              }}
              className="h-4 w-4 rounded border-slate-300"
            />
            Unread only
          </label>
          <button type="submit" className={buttonSecondary}>
            Search
          </button>
        </form>
      </div>

      {loading ? (
        <Spinner label="Loading messages…" />
      ) : messages.length === 0 ? (
        <EmptyState icon="✉️" title="No messages" description="New contact-form messages will appear here." />
      ) : (
        <div className="space-y-3">
          {messages.map((message) => {
            const open = openId === message._id;
            return (
              <div
                key={message._id}
                className={`rounded-2xl border bg-white shadow-sm transition ${
                  message.isRead ? "border-slate-200" : "border-amber-300 ring-1 ring-amber-100"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : message._id)}
                  className="flex w-full flex-wrap items-center justify-between gap-3 px-5 py-4 text-left"
                >
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 font-black text-ink-900">
                      {message.name}
                      {!message.isRead && <Badge tone="warning">New</Badge>}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {message.email} · {formatDateTime(message.createdAt)}
                    </p>
                    {message.subject && (
                      <p className="mt-1 text-sm font-semibold text-slate-700">{message.subject}</p>
                    )}
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    {open ? "Hide" : "Open"}
                  </span>
                </button>

                {open && (
                  <div className="border-t border-slate-100 px-5 py-4">
                    <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                      {message.message}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <a
                        href={`mailto:${message.email}?subject=${encodeURIComponent(
                          `Re: ${message.subject || "Your message to Octagonetoys"}`
                        )}`}
                        className={buttonSecondary}
                      >
                        Reply by email
                      </a>
                      {message.phone && (
                        <a href={`tel:${message.phone.replace(/[^\d+]/g, "")}`} className={buttonSecondary}>
                          Call
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => toggleRead(message)}
                        disabled={busyId === message._id}
                        className={buttonSecondary}
                      >
                        Mark as {message.isRead ? "unread" : "read"}
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(message)}
                        disabled={busyId === message._id}
                        className={buttonDanger}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
              <span className="text-slate-500">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const nextPage = Math.max(1, pagination.page - 1);
                    setPage(nextPage);
                    load(search, unreadOnly, nextPage);
                  }}
                  disabled={pagination.page <= 1}
                  className={buttonSecondary}
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const nextPage = Math.min(pagination.totalPages, pagination.page + 1);
                    setPage(nextPage);
                    load(search, unreadOnly, nextPage);
                  }}
                  disabled={pagination.page >= pagination.totalPages}
                  className={buttonSecondary}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
