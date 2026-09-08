import type { Metadata } from "next";
import ProfitabilityPanel from "@/components/admin/profitability-panel";
import PeriodPicker from "@/components/admin/period-picker";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Profitability" };

type SearchParams = Promise<{ tab?: string; from?: string; to?: string; channel?: string }>;

export default async function ProfitabilityPage({ searchParams }: { searchParams: SearchParams }) {
  const { tab, from, to, channel } = await searchParams;

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[0.75rem] font-bold uppercase tracking-[0.18em] text-[#f4511e]">
            Profitability
          </p>
          <p className="mt-0.5 text-[0.875rem] text-[#5c5e62]">
            What each order made — revenue invoice minus suppliers and fees, signed off by finance
          </p>
        </div>
        <PeriodPicker from={from ?? ""} to={to ?? ""} />
      </div>

      <ProfitabilityPanel
        initialTab={tab === "dashboard" ? "dashboard" : "orders"}
        from={from ?? ""}
        to={to ?? ""}
        channel={channel ?? "all"}
      />
    </div>
  );
}
