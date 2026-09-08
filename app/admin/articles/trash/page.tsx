import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  adminApiFetch,
  adminSafeFetch,
  AdminUnauthorizedError,
  type AdminArticle,
} from "@/lib/admin-api";
import TrashArticlesTable from "@/components/admin/trash-articles-table";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Article Trash" };

export default async function ArticleTrashPage() {
  try {
    await adminApiFetch("/articles", { params: { per_page: 1 }, revalidate: false });
  } catch (e) {
    if (e instanceof AdminUnauthorizedError) redirect("/admin/login");
  }

  const res = await adminSafeFetch<AdminArticle[]>("/articles", {
    params: { trashed: "only", per_page: 50 },
    revalidate: false,
  });

  const articles: AdminArticle[] = Array.isArray(res?.data) ? res.data : [];

  return (
    <div className="p-6 md:p-8">
      <div className="mb-7">
        <Link
          href="/admin/articles"
          className="mb-4 inline-flex items-center gap-1.5 text-[0.8rem] font-medium text-[#5c5e62] transition hover:text-[#f4511e]"
        >
          <ArrowLeft size={14} strokeWidth={2} />
          Back to Articles
        </Link>
        <p className="text-[0.75rem] font-bold uppercase tracking-[0.18em] text-[#f4511e]">
          Trash
        </p>
        <p className="mt-0.5 text-[0.875rem] text-[#5c5e62]">
          {articles.length > 0
            ? `${articles.length} deleted article${articles.length !== 1 ? "s" : ""} — restore to make available again`
            : "No deleted articles"}
        </p>
      </div>

      <TrashArticlesTable articles={articles} />
    </div>
  );
}
