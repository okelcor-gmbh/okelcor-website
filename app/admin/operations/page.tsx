import { redirect } from "next/navigation";
import type { Metadata } from "next";
import {
  adminSafeFetch, AdminUnauthorizedError, adminApiFetch,
  type OperationsSummary, type OperationsSummaryMeta,
} from "@/lib/admin-api";
import OperationsBoard from "@/components/admin/operations-board";
import PeriodPicker from "@/components/admin/period-picker";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Operations" };

type SearchParams = Promise<{ from?: string; to?: string }>;

export default async function AdminOperationsPage({ searchParams }: { searchParams: SearchParams }) {
  const { from, to } = await searchParams;

  try {
    await adminApiFetch("/operations/summary", { params: { per_page: 1 }, revalidate: false });
  } catch (e) {
    if (e instanceof AdminUnauthorizedError) redirect("/admin/login");
  }

  // No client-side default. The server defaults to the current month, which is
  // the period finance actually reconciles in — picking one here would only
  // create a second opinion about what "this month" means.
  const params: Record<string, string> = {};
  if (from) params.from = from;
  if (to)   params.to   = to;

  const res = await adminSafeFetch<OperationsSummary>("/operations/summary", {
    params,
    revalidate: false,
  });

  const summary = res?.data ?? null;
  const meta = (res?.meta ?? {}) as OperationsSummaryMeta;

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[0.75rem] font-bold uppercase tracking-[0.18em] text-[#f4511e]">
            Operations
          </p>
          <p className="mt-0.5 text-[0.875rem] text-[#5c5e62]">
            {summary?.period?.label
              ? `Sales channels · ${summary.period.label}`
              : "Sales channel summary"}
          </p>
        </div>
        <PeriodPicker from={summary?.period?.from ?? from ?? ""} to={summary?.period?.to ?? to ?? ""} />
      </div>

      {summary ? (
        <OperationsBoard summary={summary} meta={meta} />
      ) : (
        // Deployed ahead of the migrations by design. An empty grid would read
        // as "no orders this month", which is a different and wrong statement.
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-[0.85rem] text-amber-900">
          <p className="font-semibold">The operations board isn&apos;t available on this server yet.</p>
          <p className="mt-1">
            This screen is deployed ahead of the API that feeds it. Nothing is wrong with your
            orders — the figures simply have nowhere to come from until it ships.
          </p>
        </div>
      )}
    </div>
  );
}
