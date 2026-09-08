"use client";

/**
 * "Your desk" — the personal strip at the top of the dashboard. Every
 * widget below it is about the business; this one is about YOU: what is
 * assigned to you across My Work (leads, follow-ups, finance items, EC
 * invoice lines, claims, to-dos, approvals), as live counts that link
 * straight there. Hidden entirely when nothing is on your plate — a
 * clear desk deserves the silence.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardCheck, ArrowRight } from "lucide-react";

type Counts = {
  assigned_leads?: number;
  due_follow_ups?: number;
  proposals_accepted?: number;
  finance_tasks?: number;
  ec_invoice_tasks?: number;
  todo_tasks?: number;
  claim_tasks?: number;
  pending_approvals?: number;
  access_requests?: number;
};

const CHIP_LABELS: [keyof Counts, string][] = [
  ["assigned_leads", "leads"],
  ["due_follow_ups", "follow-ups due"],
  ["finance_tasks", "finance items"],
  ["ec_invoice_tasks", "EC invoice lines"],
  ["claim_tasks", "claims"],
  ["todo_tasks", "to-dos"],
  ["pending_approvals", "approvals"],
  ["access_requests", "access requests"],
];

export default function YourDesk() {
  const [counts, setCounts] = useState<Counts | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/my-work", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (active && j?.meta?.counts) setCounts(j.meta.counts); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  if (!counts) return null;

  const total = CHIP_LABELS.reduce((n, [key]) => n + (counts[key] ?? 0), 0);
  if (total === 0) return null;

  const chips = CHIP_LABELS
    .map(([key, label]) => ({ label, n: counts[key] ?? 0 }))
    .filter((c) => c.n > 0);

  return (
    <Link
      href="/admin/my-work"
      className="group mb-5 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-[#f4511e]/20 bg-[#fff3ee] px-4 py-3 transition hover:border-[#f4511e]/40"
    >
      <span className="flex items-center gap-2 text-[0.83rem] font-extrabold text-[#1a1a1a]">
        <ClipboardCheck size={15} strokeWidth={2.2} className="text-[#f4511e]" />
        Your desk · {total} open item{total === 1 ? "" : "s"}
      </span>
      <span className="flex flex-wrap items-center gap-1.5">
        {chips.map((c) => (
          <span key={c.label}
            className="rounded-full bg-white px-2.5 py-0.5 text-[0.72rem] font-semibold text-[#5c5e62] ring-1 ring-black/[0.05]">
            {c.n} {c.label}
          </span>
        ))}
      </span>
      <span className="ml-auto flex items-center gap-1 text-[0.78rem] font-semibold text-[#f4511e] transition group-hover:gap-1.5">
        Open My Work <ArrowRight size={12} strokeWidth={2.6} />
      </span>
    </Link>
  );
}
