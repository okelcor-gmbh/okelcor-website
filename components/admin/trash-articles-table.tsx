"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, X } from "lucide-react";
import { restoreArticle } from "@/app/admin/articles/actions";
import type { AdminArticle } from "@/lib/admin-api";

function shortDate(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function TrashArticlesTable({ articles }: { articles: AdminArticle[] }) {
  const router = useRouter();
  const [actionError, setActionError] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  const handleRestore = (id: number) => {
    setActionError(null);
    setRestoringId(id);
    startTransition(async () => {
      const result = await restoreArticle(id);
      if (result.error) {
        setActionError(result.error);
      } else {
        router.push("/admin/articles/trash");
      }
      setRestoringId(null);
    });
  };

  if (articles.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-xl bg-white py-16 shadow-sm">
        <div className="text-center">
          <p className="text-[0.95rem] font-semibold text-[#1a1a1a]">Trash is empty</p>
          <p className="mt-1 text-[0.83rem] text-[#5c5e62]">Deleted articles will appear here.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {actionError && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[0.83rem] text-red-700">
          <span>{actionError}</span>
          <button type="button" onClick={() => setActionError(null)}><X size={14} /></button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left">
            <thead>
              <tr className="border-b border-black/[0.06] bg-[#fafafa]">
                {["Image", "Title", "Category", "Deleted On", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-[0.7rem] font-bold uppercase tracking-[0.12em] text-[#5c5e62]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {articles.map((article) => {
                const isRestoring = restoringId === article.id;
                return (
                  <tr key={article.id} className="opacity-70 transition hover:opacity-100">
                    {/* Thumbnail */}
                    <td className="px-4 py-3">
                      <div className="h-10 w-16 overflow-hidden rounded-lg bg-[#f0f2f5]">
                        {article.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={article.image} alt="" className="h-full w-full object-cover grayscale" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[0.55rem] font-bold text-[#bbb]">IMG</div>
                        )}
                      </div>
                    </td>

                    {/* Title */}
                    <td className="px-4 py-3">
                      <p className="max-w-[260px] truncate text-[0.875rem] font-semibold text-[#1a1a1a]">
                        {article.title}
                      </p>
                      <p className="text-[0.73rem] text-[#5c5e62]">{article.slug}</p>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-[#f0f2f5] px-2.5 py-0.5 text-[0.72rem] font-semibold text-[#5c5e62]">
                        {article.category || "—"}
                      </span>
                    </td>

                    {/* Deleted on */}
                    <td className="px-4 py-3 text-[0.83rem] text-[#5c5e62]">
                      {shortDate(article.deleted_at)}
                    </td>

                    {/* Restore */}
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleRestore(article.id)}
                        disabled={isRestoring}
                        className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-[0.78rem] font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
                      >
                        <RotateCcw size={12} strokeWidth={2.5} className={isRestoring ? "animate-spin" : ""} />
                        {isRestoring ? "Restoring…" : "Restore"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
