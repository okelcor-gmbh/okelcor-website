"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { FileText, ArrowRight } from "lucide-react";

type Quote = {
  id: number; ref: string; name: string; company: string | null;
  tyre_category: string; country: string; created_at: string;
};

function timeAgo(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    if (d > 0)  return `${d}d ago`;
    if (h > 0)  return `${h}h ago`;
    if (m > 0)  return `${m}m ago`;
    return "just now";
  } catch { return ""; }
}

export default function PendingQuotes() {
  const [quotes, setQuotes] = useState<Quote[] | null>(null);
  const [loading, setLoad]  = useState(true);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/admin/dashboard/stats", { cache: "no-store" })
      .then(r => r.ok ? r.json() : null).catch(() => null);
    if (res?.pendingQuotesList) setQuotes(res.pendingQuotesList);
    setLoad(false);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount, same pattern as cart-context.tsx
  useEffect(() => { refresh(); }, [refresh]);

  return (
    <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white">
      <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-4">
        <div className="flex items-center gap-2.5">
          <FileText size={15} className="text-[#5c5e62]" />
          <p className="text-[0.9rem] font-bold text-[#1a1a1a]">Pending Quotes</p>
        </div>
        <Link href="/admin/quotes" className="text-[0.75rem] font-semibold text-[#E85C1A] hover:underline">
          View all →
        </Link>
      </div>
      <div className="divide-y divide-black/[0.04]">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="px-5 py-3">
              <div className="h-3.5 w-28 animate-pulse rounded bg-[#e5e7eb]" />
              <div className="mt-1.5 h-3 w-36 animate-pulse rounded bg-[#e5e7eb]" />
            </div>
          ))
        ) : !quotes?.length ? (
          <p className="px-5 py-8 text-center text-[0.83rem] text-[#5c5e62]">No pending quotes.</p>
        ) : (
          quotes.map(q => (
            <Link
              key={q.id}
              href={`/admin/quotes/${q.id}`}
              className="flex items-center justify-between gap-3 px-5 py-3 transition hover:bg-[#fafafa]"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[0.82rem] font-semibold text-[#1a1a1a]">
                  {q.name}
                  {q.company && <span className="ml-1 font-normal text-[#5c5e62]">· {q.company}</span>}
                </p>
                <p className="mt-0.5 text-[0.73rem] text-[#5c5e62]">
                  {q.tyre_category} · {q.country}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-[0.68rem] text-[#9ca3af]">{timeAgo(q.created_at)}</span>
                <ArrowRight size={12} className="text-[#5c5e62]" />
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
