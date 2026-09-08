import type { Metadata } from "next";
import ClaimsQueue from "@/components/admin/claims-queue";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Claims" };

type SearchParams = Promise<{ claim?: string }>;

export default async function ClaimsPage({ searchParams }: { searchParams: SearchParams }) {
  const { claim } = await searchParams;

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <p className="text-[0.75rem] font-bold uppercase tracking-[0.18em] text-[#f4511e]">
          Claims
        </p>
        <p className="mt-0.5 text-[0.875rem] text-[#5c5e62]">
          After-sales claims, out of the inbox — oldest first, with a status, a name and a clock on every one
        </p>
      </div>
      <ClaimsQueue initialClaim={claim ? Number(claim) : null} />
    </div>
  );
}
