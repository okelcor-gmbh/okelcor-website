import { redirect } from "next/navigation";
import type { Metadata } from "next";
import {
  adminApiFetch, adminSafeFetch, AdminUnauthorizedError, type AdminOrder,
} from "@/lib/admin-api";
import FulfilmentQueue from "@/components/admin/fulfilment-queue";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Fulfilment Queue" };

type SearchParams = Promise<{ channel?: string }>;

/**
 * The fulfilment queue — two sections, one request each.
 *
 * `in_transit` used to mean *shipped*, so this page used to show the work only
 * after the moment to do it had passed. It now covers the whole window from
 * confirmed-and-paid through to delivered, and the two halves are different
 * jobs, so they are fetched and rendered separately rather than filtered out of
 * one list on the client.
 *
 * **Newest first**, because that is what the list endpoint does —
 * `orderByDesc('created_at')`, hardcoded, with no `sort` parameter. Worth
 * knowing: for a *queue* the useful order is the opposite, since the row that
 * has waited longest is the one somebody is chasing. Not sorted client-side,
 * which would only reorder the 25 rows already fetched and label the result
 * "oldest" while the genuinely oldest orders sat on page two. Raised with
 * backend instead.
 */
export default async function AdminFulfilmentQueuePage({ searchParams }: { searchParams: SearchParams }) {
  const { channel } = await searchParams;

  try {
    await adminApiFetch<AdminOrder[]>("/orders", { params: { per_page: 1 }, revalidate: false });
  } catch (e) {
    if (e instanceof AdminUnauthorizedError) redirect("/admin/login");
  }

  const base: Record<string, string | number> = { per_page: 25 };
  if (channel && channel !== "all") base.channel = channel;

  const [ready, transit] = await Promise.all([
    adminSafeFetch<AdminOrder[]>("/orders", {
      params: { ...base, fulfilment_stage: "ready_to_ship" },
      revalidate: false,
    }),
    adminSafeFetch<AdminOrder[]>("/orders", {
      params: { ...base, fulfilment_stage: "in_transit" },
      revalidate: false,
    }),
  ]);

  const readyRows   = Array.isArray(ready?.data)   ? ready.data   : [];
  const transitRows = Array.isArray(transit?.data) ? transit.data : [];
  const readyTotal   = typeof ready?.meta?.total   === "number" ? ready.meta.total   : null;
  const transitTotal = typeof transit?.meta?.total === "number" ? transit.meta.total : null;

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <p className="text-[0.75rem] font-bold uppercase tracking-[0.18em] text-[#f4511e]">
          Fulfilment Queue
        </p>
        <p className="mt-0.5 text-[0.875rem] text-[#5c5e62]">
          Paid orders that haven&apos;t reached the customer yet, split by what they need next
        </p>
      </div>

      <FulfilmentQueue
        readyToShip={readyRows}
        readyTotal={readyTotal}
        inTransit={transitRows}
        inTransitTotal={transitTotal}
      />
    </div>
  );
}
