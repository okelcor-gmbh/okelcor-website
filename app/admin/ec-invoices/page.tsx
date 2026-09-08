import type { Metadata } from "next";
import EcInvoiceList from "@/components/admin/ec-invoice-list";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "EC Invoice List" };

type SearchParams = Promise<{ period?: string; line?: string }>;

export default async function EcInvoicesPage({ searchParams }: { searchParams: SearchParams }) {
  const { period, line } = await searchParams;

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <p className="text-[0.75rem] font-bold uppercase tracking-[0.18em] text-[#f4511e]">
          EC Invoice List
        </p>
        <p className="mt-0.5 text-[0.875rem] text-[#5c5e62]">
          Zusammenfassende Meldung (ZM) — BZSt / ELSTER filing with its audit trail
        </p>
      </div>
      <EcInvoiceList initialPeriod={period ?? ""} initialLine={line ? Number(line) : null} />
    </div>
  );
}
