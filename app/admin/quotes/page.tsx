import { redirect } from "next/navigation";
import type { Metadata } from "next";
import {
  adminApiFetch,
  adminSafeFetch,
  AdminUnauthorizedError,
  type AdminQuote,
} from "@/lib/admin-api";
import QuotesTable from "@/components/admin/quotes-table";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Quote Requests" };

type SearchParams = Promise<{ status?: string; review_status?: string; q?: string; page?: string }>;

export default async function AdminQuotesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { status, review_status, q, page } = await searchParams;

  try {
    await adminApiFetch<AdminQuote[]>("/quote-requests", {
      params: { per_page: 1 },
      revalidate: false,
    });
  } catch (e) {
    if (e instanceof AdminUnauthorizedError) redirect("/admin/login");
  }

  const params: Record<string, string | number> = { per_page: 20 };
  if (status && status !== "all") params.status = status;
  if (review_status && review_status !== "all") params.review_status = review_status;
  if (q?.trim()) params.q = q.trim();
  if (page) params.page = page;

  const res = await adminSafeFetch<AdminQuote[]>("/quote-requests", {
    params,
    revalidate: false,
  });

  const quotes: AdminQuote[] = Array.isArray(res?.data) ? res.data : [];
  const meta = res?.meta ?? {};

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <p className="text-[0.75rem] font-bold uppercase tracking-[0.18em] text-[#E85C1A]">
          Quote Requests
        </p>
        <p className="mt-0.5 text-[0.875rem] text-[#5c5e62]">
          {typeof meta.total === "number"
            ? `${meta.total} request${meta.total !== 1 ? "s" : ""} total`
            : "Manage inbound quote requests"}
        </p>
      </div>

      <QuotesTable
        quotes={quotes}
        meta={meta}
        currentStatus={status ?? "all"}
        currentReviewStatus={review_status ?? "all"}
        currentQ={q ?? ""}
        currentPage={Number(page ?? 1)}
      />
    </div>
  );
}
