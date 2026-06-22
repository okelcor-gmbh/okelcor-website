"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Loader2, ClipboardCheck, ClipboardList, CalendarClock,
  CheckCircle2, UserCheck, ShieldQuestion, ArrowRight, type LucideIcon,
} from "lucide-react";
import type { MyWorkItem, MyWorkType } from "@/lib/admin-api";
import EmptyState from "@/components/ui/empty-state";

// ── Section definitions (display order) ─────────────────────────────────────────

const SECTIONS: { type: MyWorkType; label: string; icon: LucideIcon }[] = [
  { type: "assigned_lead",     label: "Assigned Leads",     icon: ClipboardList },
  { type: "follow_up",         label: "Due Follow-ups",     icon: CalendarClock },
  { type: "proposal_accepted", label: "Proposal Accepted",  icon: CheckCircle2 },
  { type: "customer_approval", label: "Customer Approvals", icon: UserCheck },
  { type: "access_request",    label: "Access Requests",    icon: ShieldQuestion },
];

const PRIORITY_STYLES: Record<string, string> = {
  urgent: "border-red-200 bg-red-50 text-red-700",
  high:   "border-amber-200 bg-amber-50 text-amber-700",
  normal: "border-blue-200 bg-blue-50 text-blue-600",
  low:    "border-gray-200 bg-gray-50 text-gray-500",
};

function fmtDue(iso?: string | null): { label: string; overdue: boolean } | null {
  if (!iso) return null;
  const due = new Date(iso);
  if (Number.isNaN(due.getTime())) return null;
  const overdue = due.getTime() < Date.now();
  const label = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  }).format(due);
  return { label, overdue };
}

export default function MyWork() {
  const [items, setItems] = useState<MyWorkItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/my-work", { cache: "no-store" });
      const json = await res.json().catch(() => ({ data: [] }));
      setItems(Array.isArray(json.data) ? json.data : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={22} className="animate-spin text-[#E85C1A]" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <EmptyState
          icon={ClipboardCheck}
          heading="Nothing on your plate"
          description="You have no assigned work right now. New leads, follow-ups and approvals routed to you will show up here."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {SECTIONS.map(({ type, label, icon: Icon }) => {
        const sectionItems = items.filter((i) => i.type === type);
        if (sectionItems.length === 0) return null;
        return (
          <section key={type}>
            <div className="mb-2.5 flex items-center gap-2">
              <Icon size={15} strokeWidth={2} className="text-[#5c5e62]" />
              <h2 className="text-[0.875rem] font-extrabold text-[#1a1a1a]">{label}</h2>
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#f0f2f5] px-1.5 text-[0.68rem] font-bold text-[#5c5e62]">
                {sectionItems.length}
              </span>
            </div>
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
              <ul className="divide-y divide-black/[0.05]">
                {sectionItems.map((item, idx) => (
                  <WorkRow key={`${type}-${idx}`} item={item} />
                ))}
              </ul>
            </div>
          </section>
        );
      })}
    </div>
  );
}

// ── Row ───────────────────────────────────────────────────────────────────────

function WorkRow({ item }: { item: MyWorkItem }) {
  const due = fmtDue(item.due_at);
  const priorityCls = item.priority ? PRIORITY_STYLES[item.priority] ?? PRIORITY_STYLES.normal : null;

  return (
    <li className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-[#fafafa]">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[0.875rem] font-semibold text-[#1a1a1a]">{item.title}</p>
          {item.priority && item.priority !== "normal" && priorityCls && (
            <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[0.62rem] font-bold uppercase ${priorityCls}`}>
              {item.priority}
            </span>
          )}
          {item.status && (
            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[0.65rem] font-bold capitalize text-gray-500">
              {item.status.replace(/_/g, " ")}
            </span>
          )}
        </div>
        {item.subtitle && (
          <p className="mt-0.5 truncate text-[0.8rem] text-[#5c5e62]">{item.subtitle}</p>
        )}
        {due && (
          <p className={`mt-0.5 text-[0.73rem] font-medium ${due.overdue ? "text-red-600" : "text-[#9ca3af]"}`}>
            {due.overdue ? "Overdue · " : "Due "}{due.label}
          </p>
        )}
      </div>

      {item.action_url && (
        <Link
          href={item.action_url}
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-[#1a1a1a] px-3.5 py-2 text-[0.78rem] font-semibold text-white transition hover:bg-[#333]"
        >
          Open <ArrowRight size={13} strokeWidth={2.2} />
        </Link>
      )}
    </li>
  );
}
