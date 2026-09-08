"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search, Pencil, Trash2, Eye, EyeOff, ChevronLeft, ChevronRight, X,
} from "lucide-react";
import { toggleArticlePublished, deleteArticle } from "@/app/admin/articles/actions";
import type { AdminArticle } from "@/lib/admin-api";

// ── Types ─────────────────────────────────────────────────────────────────────

type Meta = {
  total?: number;
  current_page?: number;
  last_page?: number;
};

type Props = {
  articles: AdminArticle[];
  meta: Meta;
  currentQ: string;
  currentPage: number;
};

// ── Sub-components ────────────────────────────────────────────────────────────

function PublishedBadge({ published }: { published: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[0.68rem] font-bold ${
        published ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${published ? "bg-emerald-500" : "bg-gray-400"}`} />
      {published ? "Published" : "Draft"}
    </span>
  );
}

function ConfirmDeleteModal({
  article,
  onCancel,
  onConfirm,
  deleting,
}: {
  article: AdminArticle;
  onCancel: () => void;
  onConfirm: () => void;
  deleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-[420px] rounded-xl bg-white p-8 shadow-2xl">
        <div className="mb-5 flex items-start justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-100">
            <Trash2 size={18} className="text-red-600" />
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#5c5e62] hover:bg-[#f0f2f5]"
          >
            <X size={16} />
          </button>
        </div>
        <h3 className="text-[1rem] font-extrabold text-[#1a1a1a]">Delete Article?</h3>
        <p className="mt-2 text-[0.875rem] leading-6 text-[#5c5e62]">
          <span className="font-semibold text-[#1a1a1a]">{article.title}</span> will be permanently removed. This cannot be undone.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="flex h-10 flex-1 items-center justify-center rounded-full border border-black/10 bg-white text-[0.875rem] font-semibold text-[#1a1a1a] hover:bg-[#f0f2f5] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="flex h-10 flex-1 items-center justify-center rounded-full bg-red-600 text-[0.875rem] font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ArticlesTable({ articles, meta, currentQ, currentPage }: Props) {
  const router = useRouter();
  const [q, setQ] = useState(currentQ);
  const [confirmDelete, setConfirmDelete] = useState<AdminArticle | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  // ── URL helpers ──────────────────────────────────────────────────────────

  const buildUrl = (overrides: { q?: string; page?: number }) => {
    const params = new URLSearchParams();
    const qVal = overrides.q ?? q;
    const pageVal = overrides.page ?? 1;
    if (qVal.trim()) params.set("q", qVal.trim());
    if (pageVal > 1) params.set("page", String(pageVal));
    const qs = params.toString();
    return `/admin/articles${qs ? `?${qs}` : ""}`;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(buildUrl({ page: 1 }));
  };

  // ── Actions ──────────────────────────────────────────────────────────────

  const handleToggle = (article: AdminArticle) => {
    setActionError(null);
    setTogglingId(article.id);
    startTransition(async () => {
      const result = await toggleArticlePublished(article.id, !(article.is_published ?? false));
      if (result.error) setActionError(result.error);
      else router.push(buildUrl({}));
      setTogglingId(null);
    });
  };

  const handleDelete = () => {
    if (!confirmDelete) return;
    setActionError(null);
    setDeletingId(confirmDelete.id);
    startTransition(async () => {
      const result = await deleteArticle(confirmDelete.id);
      if (result.error) {
        setActionError(result.error);
        setDeletingId(null);
      } else {
        setConfirmDelete(null);
        setDeletingId(null);
        router.push("/admin/articles");
      }
    });
  };

  // ── Pagination ───────────────────────────────────────────────────────────

  const lastPage = meta.last_page ?? 1;
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < lastPage;

  return (
    <>
      {confirmDelete && (
        <ConfirmDeleteModal
          article={confirmDelete}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={handleDelete}
          deleting={deletingId === confirmDelete.id}
        />
      )}

      {actionError && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[0.83rem] text-red-700">
          <span>{actionError}</span>
          <button type="button" onClick={() => setActionError(null)}><X size={14} /></button>
        </div>
      )}

      {/* Search bar */}
      <div className="mb-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5c5e62]" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by title, category…"
              className="h-10 w-full rounded-xl border border-black/[0.09] bg-white pl-9 pr-4 text-[0.875rem] text-[#1a1a1a] outline-none placeholder:text-[#aaa] transition focus:border-[#f4511e] focus:ring-2 focus:ring-[#f4511e]/10"
            />
          </div>
          <button
            type="submit"
            className="h-10 rounded-xl bg-[#1a1a1a] px-4 text-[0.875rem] font-semibold text-white transition hover:bg-[#333]"
          >
            Search
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left">
            <thead>
              <tr className="border-b border-black/[0.06] bg-[#fafafa]">
                {["Image", "Title", "Category", "Date", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-[0.7rem] font-bold uppercase tracking-[0.12em] text-[#5c5e62]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {articles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-[0.875rem] text-[#5c5e62]">
                    No articles found.{" "}
                    <Link href="/admin/articles/new" className="font-semibold text-[#f4511e] underline">
                      Write the first one
                    </Link>
                    .
                  </td>
                </tr>
              ) : (
                articles.map((article) => {
                  const published = article.is_published ?? false;
                  const isToggling = togglingId === article.id;
                  return (
                    <tr key={article.id} className="group transition hover:bg-[#fafafa]">
                      {/* Thumbnail */}
                      <td className="px-4 py-3">
                        <div className="h-10 w-16 overflow-hidden rounded-lg bg-[#f0f2f5]">
                          {article.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={article.image} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[0.55rem] font-bold text-[#bbb]">IMG</div>
                          )}
                        </div>
                      </td>

                      {/* Title */}
                      <td className="px-4 py-3">
                        <p className="max-w-[280px] truncate text-[0.875rem] font-semibold text-[#1a1a1a]">
                          {article.title}
                        </p>
                        {article.read_time && (
                          <p className="text-[0.73rem] text-[#5c5e62]">{article.read_time}</p>
                        )}
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-[#f0f2f5] px-2.5 py-0.5 text-[0.72rem] font-semibold text-[#5c5e62]">
                          {article.category}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3 text-[0.875rem] text-[#5c5e62]">
                        {article.published_at}
                      </td>

                      {/* Published */}
                      <td className="px-4 py-3">
                        <PublishedBadge published={published} />
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Link
                            href={`/admin/articles/${article.id}`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#5c5e62] transition hover:bg-[#f4511e]/10 hover:text-[#f4511e]"
                            title="Edit"
                          >
                            <Pencil size={14} strokeWidth={2} />
                          </Link>

                          <button
                            type="button"
                            onClick={() => handleToggle(article)}
                            disabled={isToggling}
                            title={published ? "Unpublish" : "Publish"}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#5c5e62] transition hover:bg-[#f0f2f5] disabled:opacity-40"
                          >
                            {published
                              ? <EyeOff size={14} className="text-amber-600" />
                              : <Eye size={14} className="text-emerald-600" />
                            }
                          </button>

                          <button
                            type="button"
                            onClick={() => setConfirmDelete(article)}
                            title="Delete"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#5c5e62] transition hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={14} strokeWidth={2} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {lastPage > 1 && (
          <div className="flex items-center justify-between border-t border-black/[0.06] px-5 py-3">
            <p className="text-[0.78rem] text-[#5c5e62]">
              Page {currentPage} of {lastPage}
              {typeof meta.total === "number" && ` · ${meta.total} articles`}
            </p>
            <div className="flex gap-2">
              <Link
                href={hasPrev ? buildUrl({ page: currentPage - 1 }) : "#"}
                aria-disabled={!hasPrev}
                className={`flex h-8 w-8 items-center justify-center rounded-lg border border-black/[0.09] transition ${hasPrev ? "bg-white text-[#1a1a1a] hover:border-[#f4511e] hover:text-[#f4511e]" : "pointer-events-none bg-[#f5f5f5] text-[#ccc]"}`}
              >
                <ChevronLeft size={14} />
              </Link>
              <Link
                href={hasNext ? buildUrl({ page: currentPage + 1 }) : "#"}
                aria-disabled={!hasNext}
                className={`flex h-8 w-8 items-center justify-center rounded-lg border border-black/[0.09] transition ${hasNext ? "bg-white text-[#1a1a1a] hover:border-[#f4511e] hover:text-[#f4511e]" : "pointer-events-none bg-[#f5f5f5] text-[#ccc]"}`}
              >
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
