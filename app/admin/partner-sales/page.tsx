import type { Metadata } from "next";
import PartnerSalesReview from "@/components/admin/partner-sales-review";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Partner Sales" };

export default function PartnerSalesPage() {
  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <p className="text-[0.75rem] font-bold uppercase tracking-[0.18em] text-[#f4511e]">
          Partner Sales Log
        </p>
        <h1 className="mt-0.5 text-[1.25rem] font-extrabold text-[#171a20]">Sales</h1>
        <p className="mt-1 max-w-2xl text-[0.875rem] text-[#5c5e62]">
          What partners have reported selling. Verify entries you have checked, or
          dispute one with a note so the partner knows what is wrong. Export the
          range for the books.
        </p>
      </div>

      <PartnerSalesReview />
    </div>
  );
}
