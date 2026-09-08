import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import {
  adminApiFetch,
  adminSafeFetch,
  AdminUnauthorizedError,
  type AdminArticle,
} from "@/lib/admin-api";
import ArticlesTable from "@/components/admin/articles-table";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Articles — Admin",
};

type Props = {
  searchParams: Promise<{ q?: string; page?: string }>;
};

export default async function AdminArticlesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const page = Math.max(1, Number(sp.page) || 1);

  // Auth check
  try {
    await adminApiFetch("/articles", { params: { per_page: 1 }, revalidate: false });
  } catch (e) {
    if (e instanceof AdminUnauthorizedError) redirect("/admin/login");
  }

  const params: Record<string, string | number> = { page, per_page: 15 };
  if (q) params.q = q;

  const res = await adminSafeFetch<AdminArticle[]>("/articles", {
    params,
    revalidate: false,
  });

  const articles = res?.data ?? [];
  const meta = res?.meta ?? {};

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-[0.75rem] font-bold uppercase tracking-[0.18em] text-[#f4511e]">
            Articles
          </p>
          <p className="mt-0.5 text-[0.875rem] text-[#5c5e62]">
            Manage blog posts and news articles
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/admin/articles/trash"
            className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-[0.83rem] font-semibold text-[#5c5e62] transition hover:border-red-200 hover:text-red-600"
          >
            <Trash2 size={14} strokeWidth={2} />
            Trash
          </Link>
          <Link
            href="/admin/articles/new"
            className="flex items-center gap-2 rounded-full bg-[#f4511e] px-4 py-2 text-[0.83rem] font-semibold text-white transition hover:bg-[#df4618]"
          >
            <Plus size={14} strokeWidth={2.5} />
            New Article
          </Link>
        </div>
      </div>

      <ArticlesTable
        articles={articles}
        meta={meta}
        currentQ={q}
        currentPage={page}
      />
    </div>
  );
}
