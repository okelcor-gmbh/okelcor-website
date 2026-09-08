import type { Metadata } from "next";
import FinanceInvoicesPanel from "@/components/admin/finance-invoices-panel";
import PeriodPicker from "@/components/admin/period-picker";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Finance Invoices" };

type SearchParams = Promise<{ tab?: string; from?: string; to?: string; channel?: string }>;

export default async function FinanceInvoicesPage({ searchParams }: { searchParams: SearchParams }) {
  const { tab, from, to, channel } = await searchParams;

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[0.75rem] font-bold uppercase tracking-[0.18em] text-[#f4511e]">
            Finance Invoices
          </p>
          <p className="mt-0.5 text-[0.875rem] text-[#5c5e62]">
            What sevDesk raised, against what this system issued
          </p>
        </div>
        <PeriodPicker from={from ?? ""} to={to ?? ""} />
      </div>

      <FinanceInvoicesPanel
        // The board's variance links straight here with the period it was
        // showing, so the number and the explanation are never a period apart.
        initialTab={tab === "reconciliation" ? "reconciliation" : "invoices"}
        from={from ?? ""}
        to={to ?? ""}
        channel={channel ?? "all"}
      />
    </div>
  );
}
