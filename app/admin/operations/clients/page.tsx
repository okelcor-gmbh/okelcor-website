import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import OperationsClients from "@/components/admin/operations-clients";
import PeriodPicker from "@/components/admin/period-picker";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Clients" };

type SearchParams = Promise<{ from?: string; to?: string; channel?: string }>;

export default async function OperationsClientsPage({ searchParams }: { searchParams: SearchParams }) {
  const { from, to, channel } = await searchParams;

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href={`/admin/operations?from=${from ?? ""}&to=${to ?? ""}`}
            className="mb-1 inline-flex items-center gap-1 text-[0.75rem] font-semibold text-[#5c5e62] transition hover:text-[#171a20]"
          >
            <ArrowLeft size={12} /> Operations board
          </Link>
          <p className="text-[0.75rem] font-bold uppercase tracking-[0.18em] text-[#f4511e]">
            Clients
          </p>
          <p className="mt-0.5 text-[0.875rem] text-[#5c5e62]">
            {channel && channel !== "all"
              ? `The buyers behind the ${channel} client figure`
              : "The buyers behind the client figure on the board"}
          </p>
        </div>
        <PeriodPicker from={from ?? ""} to={to ?? ""} />
      </div>

      <OperationsClients from={from ?? ""} to={to ?? ""} channel={channel ?? "all"} />
    </div>
  );
}
