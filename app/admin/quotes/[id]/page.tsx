import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  adminApiFetch,
  AdminUnauthorizedError,
  type AdminQuoteFull,
} from "@/lib/admin-api";
import QuoteDetail from "@/components/admin/quote-detail";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const res = await adminApiFetch<AdminQuoteFull>(`/quote-requests/${id}`, { revalidate: false });
    return { title: `Quote ${res.data.ref_number}` };
  } catch {
    return { title: "Quote Detail" };
  }
}

export default async function QuoteDetailPage({ params }: Props) {
  const { id } = await params;
  const numId = Number(id);
  if (!numId) notFound();

  const cookieStore = await cookies();
  const adminRole = cookieStore.get("admin_role")?.value ?? undefined;

  let quote: AdminQuoteFull | null = null;
  try {
    const res = await adminApiFetch<AdminQuoteFull>(`/quote-requests/${numId}`, {
      revalidate: false,
    });
    quote = res.data ?? null;
    console.log("[quote-detail] raw response keys:", Object.keys(res.data ?? {}));
    console.log("[quote-detail] attachment fields:", JSON.stringify({
      attachment_url:           (res.data as Record<string, unknown>)?.attachment_url,
      attachment_path:          (res.data as Record<string, unknown>)?.attachment_path,
      attachment_name:          (res.data as Record<string, unknown>)?.attachment_name,
      attachment_original_name: (res.data as Record<string, unknown>)?.attachment_original_name,
      attachment_mime:          (res.data as Record<string, unknown>)?.attachment_mime,
      attachment_size:          (res.data as Record<string, unknown>)?.attachment_size,
    }));
  } catch (e) {
    if (e instanceof AdminUnauthorizedError) redirect("/admin/login");
    // Any other error (404, 500, network) — fall through with quote = null
  }

  // Called outside the catch block so Next.js routes it to not-found correctly
  if (!quote) notFound();

  return (
    <div className="p-6 md:p-8">
      <div className="mb-7">
        <Link
          href="/admin/quotes"
          className="mb-4 inline-flex items-center gap-1.5 text-[0.8rem] font-medium text-[#5c5e62] transition hover:text-[#E85C1A]"
        >
          <ArrowLeft size={14} strokeWidth={2} />
          Back to Quote Requests
        </Link>
        <p className="text-[0.75rem] font-bold uppercase tracking-[0.18em] text-[#E85C1A]">
          Quote Request
        </p>
        <p className="mt-0.5 text-[1rem] font-extrabold text-[#1a1a1a]">
          {quote.ref_number}
        </p>
      </div>

      <QuoteDetail quote={quote} adminRole={adminRole} />
    </div>
  );
}
