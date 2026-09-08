"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { CalendarRange } from "lucide-react";

/**
 * From/to range, submitted through the URL so the period is shareable and the
 * back button works — finance quoting a figure at someone needs to be able to
 * send the screen it came from.
 *
 * Preserves any other query parameters, so this can sit on a page that also
 * carries a tab or a channel filter without silently dropping them.
 */
export default function PeriodPicker({ from, to }: { from: string; to: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  const [f, setF] = useState(from);
  const [t, setT] = useState(to);

  function apply(e: React.FormEvent) {
    e.preventDefault();
    const next = new URLSearchParams(search.toString());
    if (f) next.set("from", f); else next.delete("from");
    if (t) next.set("to", t);   else next.delete("to");
    router.push(`${pathname}?${next.toString()}`);
  }

  const input =
    "h-9 rounded-lg border border-black/[0.10] bg-white px-2.5 text-[0.8rem] text-[#171a20] focus:border-[#f4511e] focus:outline-none";

  return (
    <form onSubmit={apply} className="flex flex-wrap items-center gap-1.5">
      <CalendarRange size={14} className="text-[#5c5e62]" />
      <input type="date" value={f} onChange={(e) => setF(e.target.value)} className={input} aria-label="From" />
      <span className="text-[0.8rem] text-[#8c8f94]">→</span>
      <input type="date" value={t} onChange={(e) => setT(e.target.value)} className={input} aria-label="To" />
      <button
        type="submit"
        className="h-9 rounded-lg bg-[#171a20] px-3.5 text-[0.8rem] font-semibold text-white transition hover:bg-black"
      >
        Apply
      </button>
    </form>
  );
}
