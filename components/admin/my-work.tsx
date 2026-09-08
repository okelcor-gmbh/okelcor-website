"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Loader2, ClipboardCheck, ClipboardList, CalendarClock, CheckCircle2,
  UserCheck, ShieldQuestion, ArrowRight, LineChart, FileCheck,
  ChevronDown, ChevronRight, ListTodo, LifeBuoy, type LucideIcon,
} from "lucide-react";
import type { MyWorkItem, MyWorkType } from "@/lib/admin-api";
import EmptyState from "@/components/ui/empty-state";

// ── Section definitions (display order) ─────────────────────────────────────────
// Type strings must match the API's exactly — a section whose type the server
// never emits renders nothing, which is how this page sat empty.

const SECTIONS: { type: MyWorkType; label: string; icon: LucideIcon }[] = [
  { type: "finance_task",              label: "Finance Tasks",      icon: LineChart },
  { type: "ec_invoice_task",           label: "EC Invoice Tasks",   icon: FileCheck },
  { type: "todo_task",                 label: "To-Dos",             icon: ClipboardCheck },
  { type: "claim_task",                label: "Claims",             icon: LifeBuoy },
  { type: "assigned_lead",             label: "Assigned Leads",     icon: ClipboardList },
  { type: "follow_up_due",             label: "Due Follow-ups",     icon: CalendarClock },
  { type: "proposal_accepted",         label: "Proposal Accepted",  icon: CheckCircle2 },
  { type: "customer_approval_needed",  label: "Customer Approvals", icon: UserCheck },
  { type: "customer_access_requested", label: "Access Requests",    icon: ShieldQuestion },
];

/** Statuses an assignee can set on their own finance task. */
const FINANCE_STATUSES = ["Pending", "Sent", "In Progress", "Under Review", "Approved", "Completed", "Cancelled"];

/**
 * Which part of the business raised a to-do. Matches the to-do board's
 * palette so the same department reads the same on both screens.
 */
const DEPARTMENT_BADGE: Record<string, string> = {
  Finance:    "border-emerald-200 bg-emerald-50 text-emerald-700",
  Operations: "border-sky-200 bg-sky-50 text-sky-700",
  Sales:      "border-violet-200 bg-violet-50 text-violet-700",
  Marketing:  "border-pink-200 bg-pink-50 text-pink-700",
  Management: "border-amber-200 bg-amber-50 text-amber-800",
  Content:    "border-indigo-200 bg-indigo-50 text-indigo-700",
  Support:    "border-teal-200 bg-teal-50 text-teal-700",
  General:    "border-gray-200 bg-gray-50 text-gray-600",
};

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

export default function MyWork({
  highlightFinanceItem = null,
  highlightTodo = null,
  highlightClaim = null,
}: {
  highlightFinanceItem?: number | null;
  highlightTodo?: number | null;
  highlightClaim?: number | null;
}) {
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
        <Loader2 size={22} className="animate-spin text-[#f4511e]" />
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
                  <WorkRow
                    key={`${type}-${idx}`}
                    item={item}
                    onChanged={load}
                    highlighted={
                      (type === "finance_task"
                        && highlightFinanceItem != null
                        && item.id === highlightFinanceItem)
                      || (type === "todo_task"
                        && highlightTodo != null
                        && item.id === highlightTodo)
                      || (type === "claim_task"
                        && highlightClaim != null
                        && item.id === highlightClaim)
                    }
                  />
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

function WorkRow({
  item,
  onChanged,
  highlighted = false,
}: { item: MyWorkItem; onChanged: () => void; highlighted?: boolean }) {
  const due = fmtDue(item.due_at);
  const priorityCls = item.priority ? PRIORITY_STYLES[item.priority] ?? PRIORITY_STYLES.normal : null;

  // The assignee's in-place status update — finance, EC invoice and to-do
  // tasks. Setting a status notifies whoever created the record, so "done"
  // reaches them without a message being written.
  const isEcTask = item.type === "ec_invoice_task";
  const isTodo = item.type === "todo_task";
  const isClaim = item.type === "claim_task";

  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  // A to-do opens where it is worked. Arriving from a tagged-task link opens
  // it already expanded: the person clicked the task, so show them the task
  // rather than a row they have to work out how to open.
  const [expanded, setExpanded] = useState((isTodo || isClaim) && highlighted);

  // The note back to finance — PATCHes alongside the current status (the
  // endpoint requires one), so "done, but the client asked for X" travels
  // without a message being written anywhere else.
  const saveNote = async (comment: string) => {
    if (!item.id || comment.trim() === (item.comment ?? "").trim()) return;
    setUpdating(true);
    setUpdateError(null);
    try {
      const res = await fetch(`/api/admin/my-work/finance/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: item.status ?? "Pending", comment: comment.trim() }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({})) as { message?: string };
        setUpdateError(json.message ?? "Could not save the note.");
        return;
      }
      onChanged();
    } catch {
      setUpdateError("Could not reach the server.");
    } finally {
      setUpdating(false);
    }
  };

  // The to-do's note back. Its own field, not `details` — the brief belongs
  // to whoever asked, and a reply that overwrote it would destroy the
  // question while answering it. PATCHes the to-do endpoint directly:
  // being a participant is the authorization there, so no my-work-specific
  // route is needed.
  const saveTodoNote = async (note: string) => {
    if (!item.id || note.trim() === (item.assignee_note ?? "").trim()) return;
    setUpdating(true);
    setUpdateError(null);
    try {
      const res = await fetch(`/api/admin/todos/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignee_note: note.trim() || null }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({})) as { message?: string };
        setUpdateError(json.message ?? "Could not save the note.");
        return;
      }
      onChanged();
    } catch {
      setUpdateError("Could not reach the server.");
    } finally {
      setUpdating(false);
    }
  };

  // The claim's outcome note — what was decided and what was done. PATCHes
  // alongside the current status (the endpoint requires one), the same shape
  // as the finance note above, and whoever logged the claim is notified on a
  // status change so the customer's e-mail thread gets answered.
  const saveClaimNote = async (note: string) => {
    if (!item.id || note.trim() === (item.outcome_note ?? "").trim()) return;
    setUpdating(true);
    setUpdateError(null);
    try {
      const res = await fetch(`/api/admin/my-work/claims/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: item.status ?? "new", outcome_note: note.trim() || null }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({})) as { message?: string };
        setUpdateError(json.message ?? "Could not save the note.");
        return;
      }
      onChanged();
    } catch {
      setUpdateError("Could not reach the server.");
    } finally {
      setUpdating(false);
    }
  };

  const setStatus = async (status: string) => {
    if (!item.id || status === item.status) return;
    setUpdating(true);
    setUpdateError(null);
    try {
      // To-dos PATCH their own endpoint — being a participant is the
      // authorization there, so no my-work-specific route is needed.
      const endpoint = isTodo
        ? `/api/admin/todos/${item.id}`
        : isClaim
          ? `/api/admin/my-work/claims/${item.id}`
          : isEcTask
            ? `/api/admin/my-work/ec-invoice-lines/${item.id}`
            : `/api/admin/my-work/finance/${item.id}`;
      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEcTask ? { task_status: status } : { status }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({})) as { message?: string };
        setUpdateError(json.message ?? "Could not update.");
        return;
      }
      onChanged();
    } catch {
      setUpdateError("Could not reach the server.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <li
      // Deep-linked row: scroll it into view and mark it, so arriving from a
      // tagged-task link lands on the record rather than on a list to search.
      // Same treatment as the to-do board's ?todo= highlight.
      ref={highlighted ? (el) => el?.scrollIntoView({ block: "center" }) : undefined}
      className={`px-4 py-3.5 transition hover:bg-[#fafafa] ${
        highlighted ? "bg-amber-50 ring-2 ring-inset ring-amber-300" : ""
      }`}
    >
      <div className="flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[0.875rem] font-semibold text-[#1a1a1a]">{item.title}</p>
          {item.priority && item.priority !== "normal" && priorityCls && (
            <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[0.62rem] font-bold uppercase ${priorityCls}`}>
              {item.priority}
            </span>
          )}
          {item.department && (
            <span
              title={`Raised by ${item.department}`}
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-wide ${
                DEPARTMENT_BADGE[item.department] ?? "border-gray-200 bg-gray-50 text-gray-600"
              }`}
            >
              {item.department}
            </span>
          )}
          {item.status && !item.editable && (
            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[0.65rem] font-bold capitalize text-gray-500">
              {item.status.replace(/_/g, " ")}
            </span>
          )}
        </div>
        {item.subtitle && !((isTodo || isClaim) && expanded) && (
          <p className="mt-0.5 truncate text-[0.8rem] text-[#5c5e62]">{item.subtitle}</p>
        )}
        {due && (
          <p className={`mt-0.5 text-[0.73rem] font-medium ${due.overdue ? "text-red-600" : "text-[#9ca3af]"}`}>
            {due.overdue ? "Overdue · " : "Due "}{due.label}
          </p>
        )}
        {updateError && (
          <p className="mt-0.5 text-[0.73rem] font-medium text-red-600">{updateError}</p>
        )}
        {/* The assignee's note back to finance. Finance tasks only: the
            tagged person cannot open the board, so this row is where the
            whole exchange happens — status right, words here. */}
        {item.type === "finance_task" && item.editable && item.id && (
          <input
            type="text"
            defaultValue={item.comment ?? ""}
            placeholder="Add a note back to finance — saved when you click away…"
            disabled={updating}
            onBlur={(e) => void saveNote(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
            className="mt-1.5 h-8 w-full max-w-md rounded-lg border border-black/[0.08] bg-white px-2.5 text-[0.78rem] text-[#1a1a1a] outline-none placeholder:text-[#b6b8bc] transition focus:border-[#f4511e] disabled:opacity-50"
          />
        )}
      </div>

      {item.editable && item.id ? (
        <select
          value={item.status ?? "Pending"}
          disabled={updating}
          onChange={(e) => void setStatus(e.target.value)}
          className="h-8 shrink-0 cursor-pointer rounded-xl border border-black/[0.09] bg-white px-2 text-[0.75rem] font-semibold text-[#1a1a1a] outline-none transition focus:border-[#f4511e] disabled:opacity-50"
        >
          {item.status_options
            ? item.status_options.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)
            : FINANCE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      ) : null}

      {/*
        A to-do opens HERE, so its primary control expands the row instead of
        navigating. Its action_url (/admin/my-work?todo=N) is still served and
        still correct — it is what the notification bell links to from another
        page — but rendering it as a button on this page would be a link to
        the page you are already on, which is what "clicking it took me to the
        to-do list" was on the other side of.
      */}
      {isTodo || isClaim ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-[#1a1a1a] px-3.5 py-2 text-[0.78rem] font-semibold text-white transition hover:bg-[#333]"
        >
          {expanded ? "Close" : "Open"}
          {expanded
            ? <ChevronDown size={13} strokeWidth={2.2} />
            : <ChevronRight size={13} strokeWidth={2.2} />}
        </button>
      ) : item.action_url ? (
        /*
          Use action_url exactly as served. This used to rewrite finance tasks
          to /admin/finance-snapshot?item=N, which is now a guaranteed 403 for
          most assignees — the board is finance-only and the people tagged to
          chase a payment usually are not finance. The API decides where a task
          opens; overriding it here is how the two came apart.
        */
        <Link
          href={item.action_url}
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-[#1a1a1a] px-3.5 py-2 text-[0.78rem] font-semibold text-white transition hover:bg-[#333]"
        >
          Open <ArrowRight size={13} strokeWidth={2.2} />
        </Link>
      ) : null}

      {/* The shared team board — a second way out, never the only one. */}
      {isTodo && item.list_url && (
        <Link
          href={item.list_url}
          title="Open on the shared team to-do list"
          className="hidden shrink-0 items-center gap-1.5 rounded-xl border border-black/[0.09] bg-white px-3 py-2 text-[0.78rem] font-semibold text-[#5c5e62] transition hover:bg-[#fafafa] sm:flex"
        >
          <ListTodo size={13} strokeWidth={2.2} /> List
        </Link>
      )}

      {/* The claims queue page — served only when this viewer may open it. */}
      {isClaim && item.queue_url && (
        <Link
          href={item.queue_url}
          title="Open on the claims queue"
          className="hidden shrink-0 items-center gap-1.5 rounded-xl border border-black/[0.09] bg-white px-3 py-2 text-[0.78rem] font-semibold text-[#5c5e62] transition hover:bg-[#fafafa] sm:flex"
        >
          <LifeBuoy size={13} strokeWidth={2.2} /> Queue
        </Link>
      )}

      {/*
        Secondary, and only when the server says this viewer may open the
        board — it sends board_url as null otherwise.
      */}
      {item.board_url && (
        <Link
          href={item.board_url}
          className="hidden shrink-0 items-center gap-1.5 rounded-xl border border-black/[0.09] bg-white px-3 py-2 text-[0.78rem] font-semibold text-[#5c5e62] transition hover:bg-[#fafafa] sm:flex"
        >
          Board
        </Link>
      )}
      </div>

      {/*
        The to-do, opened. Everything the task IS — the brief, who asked, when
        it is due — plus the one thing the assignee writes back. This is the
        whole view of the task by design: the alternative was the shared list,
        where the person had to find their own row again.
      */}
      {/*
        The claim, opened. The customer's complaint (read-only — it is what
        was said, not a draft), who logged it, and the one thing the assignee
        writes back: the outcome. Like the to-do panel, this is the whole
        view of the claim by design — most assignees cannot open the queue.
      */}
      {isClaim && expanded && (
        <div className="mt-3 space-y-3 rounded-xl border border-black/[0.07] bg-[#fbfbfc] p-3.5">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.73rem] text-[#8c8f94]">
            {item.customer && (
              <span>
                Customer <span className="font-semibold text-[#5c5e62]">{item.customer}</span>
              </span>
            )}
            {item.claim_type && <span className="capitalize">{item.claim_type.replace(/_/g, " ")}</span>}
          </div>

          {item.description ? (
            <div>
              <p className="mb-1 text-[0.68rem] font-bold uppercase tracking-wider text-[#8c8f94]">
                What the customer says happened
              </p>
              <p className="whitespace-pre-wrap break-words text-[0.8rem] leading-relaxed text-[#1a1a1a]">
                {item.description}
              </p>
            </div>
          ) : null}

          <div>
            <label className="mb-1 block text-[0.68rem] font-bold uppercase tracking-wider text-[#8c8f94]">
              Outcome — what was decided and done
            </label>
            <textarea
              defaultValue={item.outcome_note ?? ""}
              placeholder="e.g. Credit note for the twelve damaged units; photos on file — saved when you click away"
              rows={2}
              disabled={updating}
              onBlur={(e) => void saveClaimNote(e.target.value)}
              className="w-full rounded-lg border border-black/[0.08] bg-white px-2.5 py-2 text-[0.78rem] text-[#1a1a1a] outline-none transition placeholder:text-[#b6b8bc] focus:border-[#f4511e] disabled:opacity-50"
            />
            <p className="mt-1 text-[0.7rem] text-[#8c8f94]">
              Whoever logged this claim is notified when the status changes, so the customer&apos;s thread gets answered.
            </p>
          </div>
        </div>
      )}

      {isTodo && expanded && (
        <div className="mt-3 space-y-3 rounded-xl border border-black/[0.07] bg-[#fbfbfc] p-3.5">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.73rem] text-[#8c8f94]">
            {item.creator && (
              <span>
                Asked by <span className="font-semibold text-[#5c5e62]">{item.creator}</span>
                {item.department ? ` · ${item.department}` : ""}
              </span>
            )}
            {item.due_on && (
              <span className={due?.overdue ? "font-semibold text-red-600" : ""}>
                {due?.overdue ? "Overdue · due " : "Due "}{item.due_on}
              </span>
            )}
          </div>

          {item.details ? (
            <div>
              <p className="mb-1 text-[0.68rem] font-bold uppercase tracking-wider text-[#8c8f94]">
                What was asked
              </p>
              <p className="whitespace-pre-wrap break-words text-[0.8rem] leading-relaxed text-[#1a1a1a]">
                {item.details}
              </p>
            </div>
          ) : (
            <p className="text-[0.78rem] italic text-[#8c8f94]">
              No further details were given — just the title.
            </p>
          )}

          <div>
            <label className="mb-1 block text-[0.68rem] font-bold uppercase tracking-wider text-[#8c8f94]">
              Your note back
            </label>
            <textarea
              defaultValue={item.assignee_note ?? ""}
              placeholder="e.g. Customer asked to push it to Thursday — saved when you click away"
              rows={2}
              disabled={updating}
              onBlur={(e) => void saveTodoNote(e.target.value)}
              className="w-full rounded-lg border border-black/[0.08] bg-white px-2.5 py-2 text-[0.78rem] text-[#1a1a1a] outline-none transition placeholder:text-[#b6b8bc] focus:border-[#f4511e] disabled:opacity-50"
            />
            <p className="mt-1 text-[0.7rem] text-[#8c8f94]">
              {item.creator
                ? `${item.creator} is notified, so you don't have to send a message.`
                : "Whoever created this is notified, so you don't have to send a message."}
            </p>
          </div>
        </div>
      )}
    </li>
  );
}
