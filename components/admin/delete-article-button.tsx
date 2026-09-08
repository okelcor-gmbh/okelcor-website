"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, X } from "lucide-react";
import { deleteArticle } from "@/app/admin/articles/actions";

type Props = {
  articleId: number;
  articleTitle: string;
};

export default function DeleteArticleButton({ articleId, articleTitle }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const result = await deleteArticle(articleId);
      if (result.error) {
        setError(result.error);
      } else {
        router.push("/admin/articles");
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex shrink-0 items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-[0.83rem] font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-100"
      >
        <Trash2 size={14} strokeWidth={2} />
        Delete
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-[420px] rounded-xl bg-white p-8 shadow-2xl">
            <div className="mb-5 flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-100">
                <Trash2 size={18} className="text-red-600" />
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#5c5e62] hover:bg-[#f0f2f5]"
              >
                <X size={16} />
              </button>
            </div>

            <h3 className="text-[1rem] font-extrabold text-[#1a1a1a]">Delete Article?</h3>
            <p className="mt-2 text-[0.875rem] leading-6 text-[#5c5e62]">
              <span className="font-semibold text-[#1a1a1a]">{articleTitle}</span> will be permanently removed along with all translations. This cannot be undone.
            </p>

            {error && (
              <p className="mt-3 text-[0.82rem] text-red-600">{error}</p>
            )}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={isPending}
                className="flex h-10 flex-1 items-center justify-center rounded-full border border-black/10 bg-white text-[0.875rem] font-semibold text-[#1a1a1a] transition hover:bg-[#f0f2f5] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="flex h-10 flex-1 items-center justify-center rounded-full bg-red-600 text-[0.875rem] font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {isPending ? "Deleting…" : "Delete Article"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
