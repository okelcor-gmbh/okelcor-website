import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  adminApiFetch,
  AdminUnauthorizedError,
  type AdminArticleFull,
} from "@/lib/admin-api";
import ArticleForm from "@/components/admin/article-form";
import DeleteArticleButton from "@/components/admin/delete-article-button";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const res = await adminApiFetch<AdminArticleFull>(`/articles/${id}`, { revalidate: false });
    const title = res.data.translations?.en?.title ?? "Article";
    return { title: `Edit — ${title}` };
  } catch {
    return { title: "Edit Article" };
  }
}

export default async function EditArticlePage({ params }: Props) {
  const { id } = await params;
  const numId = Number(id);
  if (!numId) notFound();

  let article: AdminArticleFull;
  try {
    const res = await adminApiFetch<AdminArticleFull>(`/articles/${numId}`, {
      revalidate: false,
    });
    article = res.data;
  } catch (e) {
    if (e instanceof AdminUnauthorizedError) redirect("/admin/login");
    notFound();
  }

  const enTitle = article.translations?.en?.title ?? `Article #${numId}`;

  return (
    <div className="p-6 md:p-8">
      {/* Back + header */}
      <div className="mb-7">
        <Link
          href="/admin/articles"
          className="mb-4 inline-flex items-center gap-1.5 text-[0.8rem] font-medium text-[#5c5e62] transition hover:text-[#f4511e]"
        >
          <ArrowLeft size={14} strokeWidth={2} />
          Back to Articles
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[0.75rem] font-bold uppercase tracking-[0.18em] text-[#f4511e]">
              Edit Article
            </p>
            <p className="mt-0.5 max-w-[480px] truncate text-[0.875rem] text-[#5c5e62]">
              {enTitle}
            </p>
          </div>
          <DeleteArticleButton articleId={numId} articleTitle={enTitle} />
        </div>
      </div>

      <ArticleForm mode="edit" article={article} />
    </div>
  );
}
