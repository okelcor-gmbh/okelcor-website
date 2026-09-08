import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ArticleForm from "@/components/admin/article-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "New Article — Admin",
};

export default function NewArticlePage() {
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
          New Article
        </p>
        <p className="mt-0.5 text-[0.875rem] text-[#5c5e62]">
          Fill in the content below. EN translation is required; DE, FR and ES are optional.
        </p>
      </div>

      <ArticleForm mode="create" />
    </div>
  );
}
