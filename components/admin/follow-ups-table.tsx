"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  CheckCircle2, Clock, AlertTriangle, CalendarClock,
  User, Loader2, AlertCircle, RotateCcw, X,
} from "lucide-react";
import type { FollowUpItem } from "@/lib/admin-api";

// ── Follow-up status helpers ──────────────────────────────────────────────────

export type FollowUpStatus = "overdue" | "due_today" | "scheduled" | "none";

export function getFollowUpStatus(followUpAt?: string | null): FollowUpStatus {
  if (!followUpAt) return "none";
  const due = new Date(followUpAt);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  if (dueDay < today) return "overdue";
  if (dueDay.getTime() === today.getTime()) return "due_today";
  return "scheduled";
}

const STATUS_CONFIG = {
  overdue:   { label: "Overdue",    cls: "border-red-200 bg-red-50 text-red-700",      Icon: AlertTriangle },
  due_today: { label: "Due Today",  cls: "border-amber-200 bg-amber-50 text-amber-700", Icon: Clock },
  scheduled: { label: "Scheduled",  cls: "border-blue-200 bg-blue-50 text-blue-600",   Icon: CalendarClock },
  none:      { label: "",           cls: "",                                             Icon: Clock },
};

export function FollowUpBadge({ followUpAt }: { followUpAt?: string | null }) {
  const status = getFollowUpStatus(followUpAt);
  if (status === "none") return null;
  const { label, cls, Icon } = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[0.67rem] font-bold ${cls}`}>
      <Icon size={9} className="shrink-0" />
      {label}
    </span>
  );
}

// ── Complete / Reschedule modals ──────────────────────────────────────────────

function CompleteModal({
  item, onCancel, onDone,
}: { item: FollowUpItem; onCancel: () => void; onDone: () => void }) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true); setErr(null);
    try {
      const res = await fetch(`/api/admin/crm/follow-ups/${item.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: note.trim() || undefined }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((json as Record<string, unknown>).error as string ?? `Error ${res.status}`);
      onDone();
    } catch (e) { setErr(e instanceof Error ? e.message : "Failed."); }
    finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <p className="text-[0.95rem] font-extrabold text-[#1a1a1a]">Complete Follow-up</p>
          <button type="button" onClick={onCancel}><X size={16} className="text-[#9ca3af]" /></button>
        </div>
        <p className="mb-3 text-[0.83rem] text-[#5c5e62]">
          <span className="font-semibold text-[#1a1a1a]">{item.full_name}</span>
          {item.company_name && ` · ${item.company_name}`}
        </p>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3}
          placeholder="Add a completion note (optional)…"
          className="mb-3 w-full resize-none rounded-xl border border-black/[0.09] bg-white px-3 py-2.5 text-[0.83rem] outline-none focus:border-[#E85C1A] focus:ring-2 focus:ring-[#E85C1A]/10" />
        {err && <p className="mb-3 text-[0.78rem] text-red-600">{err}</p>}
        <div className="flex gap-3">
          <button type="button" onClick={onCancel}
            className="flex-1 h-10 rounded-full border border-black/[0.1] text-[0.83rem] font-semibold text-[#5c5e62] hover:bg-[#f5f5f5]">Cancel</button>
          <button type="button" disabled={busy} onClick={submit}
            className="flex flex-1 h-10 items-center justify-center gap-2 rounded-full bg-emerald-600 text-[0.83rem] font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
            {busy ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
            Complete
          </button>
        </div>
      </div>
    </div>
  );
}

function RescheduleModal({
  item, onCancel, onDone,
}: { item: FollowUpItem; onCancel: () => void; onDone: () => void }) {
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    if (!date) { setErr("Please select a date."); return; }
    setBusy(true); setErr(null);
    try {
      const res = await fetch(`/api/admin/crm/follow-ups/${item.id}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ follow_up_at: `${date}:00Z`, note: note.trim() || undefined }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((json as Record<string, unknown>).error as string ?? `Error ${res.status}`);
      onDone();
    } catch (e) { setErr(e instanceof Error ? e.message : "Failed."); }
    finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <p className="text-[0.95rem] font-extrabold text-[#1a1a1a]">Reschedule Follow-up</p>
          <button type="button" onClick={onCancel}><X size={16} className="text-[#9ca3af]" /></button>
        </div>
        <p className="mb-3 text-[0.83rem] text-[#5c5e62]">
          <span className="font-semibold text-[#1a1a1a]">{item.full_name}</span>
        </p>
        <div className="mb-3">
          <label className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-wide text-[#9ca3af]">New Date &amp; Time</label>
          <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl border border-black/[0.09] bg-white px-3 py-2.5 text-[0.83rem] outline-none focus:border-[#E85C1A]" />
        </div>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2}
          placeholder="Reason for reschedule (optional)…"
          className="mb-3 w-full resize-none rounded-xl border border-black/[0.09] bg-white px-3 py-2.5 text-[0.83rem] outline-none focus:border-[#E85C1A]" />
        {err && <p className="mb-3 text-[0.78rem] text-red-600">{err}</p>}
        <div className="flex gap-3">
          <button type="button" onClick={onCancel}
            className="flex-1 h-10 rounded-full border border-black/[0.1] text-[0.83rem] font-semibold text-[#5c5e62] hover:bg-[#f5f5f5]">Cancel</button>
          <button type="button" disabled={busy || !date} onClick={submit}
            className="flex flex-1 h-10 items-center justify-center gap-2 rounded-full bg-[#1a1a1a] text-[0.83rem] font-semibold text-white hover:bg-[#333] disabled:opacity-50">
            {busy ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />}
            Reschedule
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main table ────────────────────────────────────────────────────────────────

type Filter = "all" | "overdue" | "due_today" | "upcoming";

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  try { return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso)); }
  catch { return iso; }
}

export default function FollowUpsTable({ initialFilter = "all" }: { initialFilter?: Filter }) {
  const [items, setItems] = useState<FollowUpItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>(initialFilter);
  const [completeItem, setCompleteItem] = useState<FollowUpItem | null>(null);
  const [rescheduleItem, setRescheduleItem] = useState<FollowUpItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams();
    if (filter === "overdue")   p.set("overdue", "1");
    if (filter === "due_today") p.set("due", "today");
    if (filter === "upcoming")  p.set("upcoming", "1");
    try {
      const res = await fetch(`/api/admin/crm/follow-ups?${p}`, { cache: "no-store" });
      const json = await res.json().catch(() => ({ data: [] }));
      setItems(Array.isArray(json.data) ? json.data : []);
    } catch { setItems([]); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const filterTabs: { key: Filter; label: string }[] = [
    { key: "all",       label: "All" },
    { key: "overdue",   label: "Overdue" },
    { key: "due_today", label: "Due Today" },
    { key: "upcoming",  label: "Upcoming" },
  ];

  const handleDone = () => {
    setCompleteItem(null);
    setRescheduleItem(null);
    load();
  };

  return (
    <>
      {/* Filter tabs */}
      <div className="mb-4 flex gap-1.5 overflow-x-auto">
        {filterTabs.map(({ key, label }) => (
          <button key={key} type="button" onClick={() => setFilter(key)}
            className={["h-9 whitespace-nowrap rounded-xl px-3.5 text-[0.8rem] font-semibold transition",
              filter === key ? "bg-[#E85C1A] text-white" : "border border-black/[0.09] bg-white text-[#5c5e62] hover:border-[#E85C1A] hover:text-[#E85C1A]",
            ].join(" ")}>
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left">
            <thead>
              <tr className="border-b border-black/[0.06] bg-[#fafafa]">
                {["Lead / Customer", "Company", "Owner", "Follow-up", "Priority", "Status", "Last Comm.", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-[0.7rem] font-bold uppercase tracking-[0.12em] text-[#5c5e62]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center"><Loader2 size={20} className="mx-auto animate-spin text-[#E85C1A]" /></td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-[0.875rem] text-[#5c5e62]">No follow-ups found.</td></tr>
              ) : (
                items.map((item) => {
                  const fuStatus = getFollowUpStatus(item.follow_up_at);
                  return (
                    <tr key={item.id} className={`group transition hover:bg-[#fafafa] ${fuStatus === "overdue" ? "bg-red-50/30" : ""}`}>
                      <td className="px-4 py-3">
                        <Link href={`/admin/quotes/${item.id}`} className="text-[0.875rem] font-semibold text-[#1a1a1a] hover:text-[#E85C1A]">
                          {item.full_name}
                        </Link>
                        <p className="text-[0.73rem] text-[#5c5e62]">{item.email}</p>
                        <p className="font-mono text-[0.67rem] text-[#9ca3af]">{item.ref_number}</p>
                      </td>
                      <td className="px-4 py-3 text-[0.83rem] text-[#5c5e62]">
                        {item.company_name ?? "—"}
                        {item.country && <p className="text-[0.72rem] text-[#9ca3af]">{item.country}</p>}
                      </td>
                      <td className="px-4 py-3">
                        {item.assigned_to_name ? (
                          <div className="flex items-center gap-1.5 text-[0.8rem] text-[#5c5e62]">
                            <User size={11} className="shrink-0 text-[#9ca3af]" />
                            {item.assigned_to_name}
                          </div>
                        ) : <span className="text-[0.78rem] italic text-[#9ca3af]">Unassigned</span>}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-[0.8rem] text-[#5c5e62]">{fmtDate(item.follow_up_at)}</p>
                        <FollowUpBadge followUpAt={item.follow_up_at} />
                      </td>
                      <td className="px-4 py-3">
                        {item.lead_priority && item.lead_priority !== "normal" ? (
                          <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[0.62rem] font-bold uppercase ${item.lead_priority === "urgent" ? "border-red-200 bg-red-50 text-red-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
                            {item.lead_priority}
                          </span>
                        ) : <span className="text-[0.78rem] text-[#9ca3af]">Normal</span>}
                      </td>
                      <td className="px-4 py-3">
                        {item.qualification_status ? (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[0.67rem] font-bold capitalize text-gray-500">
                            {item.qualification_status.replace(/_/g, " ")}
                          </span>
                        ) : <span className="text-[0.78rem] text-[#9ca3af]">—</span>}
                      </td>
                      <td className="px-4 py-3 text-[0.78rem] text-[#9ca3af]">
                        {item.last_communication_at ? (
                          <>
                            <p className="text-[#5c5e62]">{fmtDate(item.last_communication_at)}</p>
                            {item.last_communication_type && (
                              <p className="capitalize">{item.last_communication_type}</p>
                            )}
                          </>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          <button type="button" onClick={() => setCompleteItem(item)}
                            className="flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[0.72rem] font-semibold text-emerald-700 transition hover:bg-emerald-100">
                            <CheckCircle2 size={11} /> Complete
                          </button>
                          <button type="button" onClick={() => setRescheduleItem(item)}
                            className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[0.72rem] font-semibold text-[#5c5e62] transition hover:bg-[#f5f5f5]">
                            <RotateCcw size={11} /> Reschedule
                          </button>
                          <Link href={`/admin/quotes/${item.id}`}
                            className="flex items-center gap-1 rounded-lg border border-black/[0.08] bg-white px-2.5 py-1.5 text-[0.72rem] font-semibold text-[#5c5e62] transition hover:bg-[#f5f5f5]">
                            View
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {completeItem && <CompleteModal item={completeItem} onCancel={() => setCompleteItem(null)} onDone={handleDone} />}
      {rescheduleItem && <RescheduleModal item={rescheduleItem} onCancel={() => setRescheduleItem(null)} onDone={handleDone} />}
    </>
  );
}
