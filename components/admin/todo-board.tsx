"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle, CalendarClock, CheckCircle2, Loader2, Pencil, Plus, Trash2, UserRound, X,
} from "lucide-react";
import type { TodoItem, TodoMeta } from "@/lib/admin-api";
import { useAdminPermissions } from "@/hooks/use-admin-permissions";

/**
 * The shared team to-do list. Anyone adds; tagging a teammate notifies them
 * and lands the item in their My Work; the people an item concerns — its
 * creator and its assignee — move it. `you_may_edit` / `you_may_delete` come
 * from the server, which owns those rules.
 */

const INPUT =
  "h-9 w-full rounded-lg border border-black/[0.10] bg-white px-3 text-[0.83rem] text-[#171a20] placeholder:text-[#8c8f94] focus:border-[#f4511e] focus:outline-none";
const LABEL = "mb-1 block text-[0.68rem] font-bold uppercase tracking-wider text-[#8c8f94]";

const PRIORITY_BADGE: Record<string, string> = {
  high:   "border-red-200 bg-red-50 text-red-700",
  normal: "border-blue-200 bg-blue-50 text-blue-600",
  low:    "border-gray-200 bg-gray-50 text-gray-500",
};

/**
 * A stable colour per department, so "from Finance" is recognisable at a
 * glance on a list that mixes every team's requests together. Anything not
 * listed falls back to grey rather than going uncoloured.
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

const DEPARTMENT_FALLBACK = "border-gray-200 bg-gray-50 text-gray-600";

const STATUS_SELECT: Record<string, string> = {
  open:        "border-black/[0.10] bg-white text-[#171a20]",
  in_progress: "border-cyan-200 bg-cyan-50 text-cyan-800",
  done:        "border-emerald-200 bg-emerald-50 text-emerald-800",
};

type Scope = "active" | "mine" | "created" | "done";

export default function TodoBoard({ initialTodo }: { initialTodo: number | null }) {
  // Loading state only — visibility rules come per-row from the server.
  useAdminPermissions();

  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [meta, setMeta] = useState<TodoMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [scope, setScope] = useState<Scope>("active");
  const [department, setDepartment] = useState<string>("");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<TodoItem | null>(null);
  const [highlight, setHighlight] = useState<number | null>(null);
  const deepLinkDone = useRef(false);
  const formRef = useRef<HTMLDivElement | null>(null);

  // The add/edit form renders above the list. Opening it from a row halfway
  // down the page put it off-screen, so the click looked like it did nothing
  // — which is most of what "you can't click a to-do to edit it" was.
  useEffect(() => {
    if (adding || editing) {
      formRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [adding, editing]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (scope === "mine") p.set("scope", "mine");
      if (scope === "created") p.set("scope", "created");
      if (scope === "done") p.set("status", "done");
      if (department) p.set("department", department);
      const res = await fetch(`/api/admin/todos${p.size ? `?${p}` : ""}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.meta?.todos_available === false) {
        setUnavailable(json.message ?? json.error ?? "The to-do list isn't available on this server yet.");
        setTodos([]);
      } else {
        setUnavailable(null);
        setTodos(Array.isArray(json.data) ? json.data : []);
        setMeta(json.meta ?? null);

        // ?todo= — a notification or My Work "Open" lands on the exact item.
        if (!deepLinkDone.current && initialTodo != null) {
          deepLinkDone.current = true;
          if ((json.data ?? []).some((t: TodoItem) => t.id === initialTodo)) {
            setHighlight(initialTodo);
          }
        }
      }
    } catch {
      setUnavailable("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }, [scope, department, initialTodo]);

  useEffect(() => { void load(); }, [load]);

  async function patch(todo: TodoItem, patchBody: Record<string, unknown>) {
    setError(null);
    const res = await fetch(`/api/admin/todos/${todo.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patchBody),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) { setError(json.message ?? "Could not update the to-do."); return; }
    await load();
  }

  async function remove(todo: TodoItem) {
    if (!window.confirm(`Delete "${todo.title}"?`)) return;
    const res = await fetch(`/api/admin/todos/${todo.id}`, { method: "DELETE" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) { setError(json.message ?? "Could not delete the to-do."); return; }
    await load();
  }

  const chip = (active: boolean) =>
    `rounded-full px-3.5 py-1.5 text-[0.8rem] font-semibold transition ${
      active ? "bg-[#171a20] text-white" : "bg-[#f0f2f5] text-[#5c5e62] hover:bg-[#e5e7eb]"
    }`;

  if (loading && !meta) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-black/[0.06] bg-white p-8 text-[0.83rem] text-[#5c5e62]">
        <Loader2 size={14} className="animate-spin" /> Loading…
      </div>
    );
  }

  if (unavailable) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-[0.83rem] text-amber-900">
        <p className="font-semibold">Not available on this server yet.</p>
        <p className="mt-0.5">{unavailable}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setScope("active")} className={chip(scope === "active")}>
          Active {meta ? `(${meta.open_count})` : ""}
        </button>
        <button type="button" onClick={() => setScope("mine")} className={chip(scope === "mine")}>
          Tagged to me
        </button>
        <button type="button" onClick={() => setScope("created")} className={chip(scope === "created")}>
          Created by me
        </button>
        <button type="button" onClick={() => setScope("done")} className={chip(scope === "done")}>
          Done
        </button>

        {/*
          Where a request came from. Only departments that actually have
          to-dos are offered — a filter listing eight choices where six
          return nothing is a worse list than one offering the two that exist.
        */}
        {meta?.departments && Object.keys(meta.departments).length > 0 && (
          <label className="flex items-center gap-1.5 text-[0.8rem] font-semibold text-[#5c5e62]">
            From:
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="h-8 cursor-pointer rounded-full border border-black/[0.10] bg-white px-2.5 text-[0.78rem] font-semibold text-[#171a20] outline-none transition focus:border-[#f4511e]"
            >
              <option value="">All departments</option>
              {Object.entries(meta.departments)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([name, count]) => (
                  <option key={name} value={name}>{name} ({count})</option>
                ))}
            </select>
          </label>
        )}
        {!adding && !editing && (
          <button type="button" onClick={() => setAdding(true)}
            className="ml-auto flex items-center gap-1.5 rounded-full bg-[#f4511e] px-3.5 py-1.5 text-[0.8rem] font-semibold text-white transition hover:bg-[#df4618]">
            <Plus size={13} /> Add to-do
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-[0.83rem] text-red-700">
          <span className="flex items-center gap-2"><AlertTriangle size={14} /> {error}</span>
          <button type="button" onClick={() => setError(null)}><X size={13} /></button>
        </div>
      )}

      <div ref={formRef}>
        {(adding || editing) && meta && (
          <TodoForm meta={meta} editing={editing}
            onCancel={() => { setAdding(false); setEditing(null); }}
            onDone={() => { setAdding(false); setEditing(null); void load(); }} />
        )}
      </div>

      {todos.length === 0 ? (
        <div className="rounded-xl border border-black/[0.06] bg-white p-8 text-center text-[0.83rem] text-[#8c8f94]">
          {department
            ? `Nothing from ${department}${scope === "done" ? " is finished" : " on this list"}.`
            : scope === "done" ? "Nothing finished yet."
            : scope === "mine" ? "Nothing is tagged to you — enjoy it while it lasts."
            : "Nothing on the list — add the first to-do."}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-black/[0.06] bg-white">
          <ul className="divide-y divide-black/[0.05]">
            {todos.map((todo) => (
              <li key={todo.id}
                ref={todo.id === highlight ? (el) => el?.scrollIntoView({ block: "center" }) : undefined}
                className={`flex flex-wrap items-center gap-3 px-4 py-3 ${
                  todo.id === highlight ? "bg-amber-50 ring-2 ring-inset ring-amber-300" : ""
                }`}>
                <div
                  className={`min-w-0 flex-1 ${todo.you_may_edit ? "cursor-pointer" : ""}`}
                  role={todo.you_may_edit ? "button" : undefined}
                  tabIndex={todo.you_may_edit ? 0 : undefined}
                  title={todo.you_may_edit ? "Open this to-do to edit it" : undefined}
                  onClick={() => { if (todo.you_may_edit) { setEditing(todo); setAdding(false); } }}
                  onKeyDown={(e) => {
                    if (!todo.you_may_edit) return;
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setEditing(todo);
                      setAdding(false);
                    }
                  }}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className={`whitespace-normal break-words text-[0.875rem] font-semibold ${
                      todo.status === "done" ? "text-[#9ca3af] line-through" : "text-[#171a20]"
                    }`}>
                      {todo.title}
                    </p>
                    {todo.priority !== "normal" && (
                      <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[0.62rem] font-bold uppercase ${PRIORITY_BADGE[todo.priority] ?? ""}`}>
                        {todo.priority}
                      </span>
                    )}
                    {todo.department && (
                      <span
                        title={`Raised by ${todo.department}`}
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-wide ${DEPARTMENT_BADGE[todo.department] ?? DEPARTMENT_FALLBACK}`}
                      >
                        {todo.department}
                      </span>
                    )}
                  </div>
                  {todo.details && (
                    <p className="mt-0.5 whitespace-normal break-words text-[0.78rem] text-[#5c5e62]">{todo.details}</p>
                  )}
                  {todo.assignee_note && (
                    <p className="mt-1 whitespace-pre-wrap break-words border-l-2 border-[#f4511e]/40 pl-2 text-[0.78rem] text-[#5c5e62]">
                      <span className="font-semibold text-[#8c8f94]">Note back:</span> {todo.assignee_note}
                    </p>
                  )}
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[0.72rem] text-[#8c8f94]">
                    {todo.assignee ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 font-bold text-indigo-700">
                        <UserRound size={10} /> {todo.assignee}
                      </span>
                    ) : (
                      <span className="italic">untagged — the team&apos;s</span>
                    )}
                    {todo.due_on && (
                      <span className={`inline-flex items-center gap-1 font-medium ${todo.overdue ? "text-red-600" : ""}`}>
                        <CalendarClock size={10} /> {todo.overdue ? "overdue · " : "due "}{todo.due_on}
                      </span>
                    )}
                    {todo.creator && <span>from {todo.creator}</span>}
                    {todo.status === "done" && todo.completed_by_name && (
                      <span className="inline-flex items-center gap-1 text-emerald-700">
                        <CheckCircle2 size={10} /> done by {todo.completed_by_name}
                        {todo.completed_at ? ` · ${todo.completed_at.slice(0, 10)}` : ""}
                      </span>
                    )}
                  </p>
                </div>

                <select value={todo.status} disabled={!todo.you_may_edit}
                  onChange={(e) => void patch(todo, { status: e.target.value })}
                  className={`h-8 shrink-0 cursor-pointer rounded-xl border px-2 text-[0.75rem] font-semibold outline-none transition focus:border-[#f4511e] disabled:cursor-default disabled:opacity-60 ${STATUS_SELECT[todo.status] ?? ""}`}>
                  {(meta?.statuses ?? []).map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>

                {/*
                  Labelled, not a bare 13px icon. Two people reported they
                  "could not edit or delete" a to-do they had every right to
                  move: the controls were there, in grey, unlabelled, at the
                  end of a row that wraps on a narrow screen. Nothing was
                  denied — nothing was findable.
                */}
                {todo.you_may_edit && (
                  <button type="button" onClick={() => { setEditing(todo); setAdding(false); }}
                    className="flex shrink-0 items-center gap-1 rounded-lg border border-black/[0.10] bg-white px-2.5 py-1.5 text-[0.73rem] font-semibold text-[#5c5e62] transition hover:border-[#f4511e] hover:text-[#171a20]">
                    <Pencil size={12} /> Edit
                  </button>
                )}
                {todo.you_may_delete && (
                  <button type="button" onClick={() => void remove(todo)}
                    className="flex shrink-0 items-center gap-1 rounded-lg border border-black/[0.10] bg-white px-2.5 py-1.5 text-[0.73rem] font-semibold text-[#5c5e62] transition hover:border-red-300 hover:text-red-600">
                    <Trash2 size={12} /> Delete
                  </button>
                )}
                {/*
                  And when it genuinely is not yours, say so. A row with no
                  controls and no explanation is indistinguishable from a
                  broken one — which is how this was reported.
                */}
                {/*
                  Name the DEPARTMENT, not two colleagues. Naming people was
                  accurate and still unhelpful: the second finance user read
                  "Only Joseph or Solomon can change this", was finance
                  himself, and could not tell whether he was locked out by
                  design or by a bug.
                */}
                {!todo.you_may_edit && (
                  <span className="shrink-0 text-[0.7rem] italic text-[#b6b8bc]">
                    {todo.department
                      ? `Only ${todo.department}${todo.assignee ? ` or ${todo.assignee}` : ""} can change this`
                      : `Only ${todo.creator ?? "whoever created it"}${todo.assignee ? ` or ${todo.assignee}` : ""} can change this`}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── The add / edit form ───────────────────────────────────────────────────────

function TodoForm({
  meta, editing, onCancel, onDone,
}: {
  meta: TodoMeta;
  editing: TodoItem | null;
  onCancel: () => void;
  onDone: () => void;
}) {
  const [title, setTitle] = useState(editing?.title ?? "");
  const [details, setDetails] = useState(editing?.details ?? "");
  const [dueOn, setDueOn] = useState(editing?.due_on ?? "");
  const [priority, setPriority] = useState(editing?.priority ?? "normal");
  const [assignee, setAssignee] = useState(editing?.assigned_admin_id ? String(editing.assigned_admin_id) : "");
  const [note, setNote] = useState(editing?.assignee_note ?? "");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      const body = {
        title,
        details: details || null,
        due_on: dueOn || null,
        priority,
        assigned_admin_id: assignee ? Number(assignee) : null,
        // Only on an edit: a to-do being created has nobody to reply yet.
        ...(editing ? { assignee_note: note || null } : {}),
      };
      const res = await fetch(editing ? `/api/admin/todos/${editing.id}` : "/api/admin/todos", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { setFormError(json.message ?? "Could not save the to-do."); return; }
      onDone();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-black/[0.06] bg-white p-4">
      <p className="text-[0.72rem] font-bold uppercase tracking-wider text-[#5c5e62]">
        {editing ? "Edit to-do" : "New to-do"}
      </p>
      {formError && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[0.78rem] text-red-700">{formError}</p>
      )}
      <div>
        <label className={LABEL}>What needs doing</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200}
          placeholder="e.g. Chase the Croatia shipping quote" className={INPUT} />
      </div>
      <div>
        <label className={LABEL}>Details (optional)</label>
        <textarea value={details} onChange={(e) => setDetails(e.target.value)} maxLength={2000} rows={2}
          className={`${INPUT} h-auto py-2`} />
      </div>
      {editing && (
        <div>
          <label className={LABEL}>Note back (whoever is doing it)</label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={2000} rows={2}
            placeholder="e.g. Customer asked to push it to Thursday"
            className={`${INPUT} h-auto py-2`} />
          <p className="mt-1 text-[0.7rem] text-[#8c8f94]">
            Kept apart from the details above — that is what was asked, this is the reply.
            Whoever created the to-do is notified.
          </p>
        </div>
      )}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={LABEL}>Tag a teammate (notifies them)</label>
          <select value={assignee} onChange={(e) => setAssignee(e.target.value)} className={`${INPUT} cursor-pointer`}>
            <option value="">— nobody, the team&apos;s —</option>
            {meta.staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className={LABEL}>Due</label>
          <input type="date" value={dueOn} onChange={(e) => setDueOn(e.target.value)} className={INPUT} />
        </div>
        <div>
          <label className={LABEL}>Priority</label>
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className={`${INPUT} cursor-pointer`}>
            {meta.priorities.map((p) => <option key={p} value={p}>{p[0].toUpperCase() + p.slice(1)}</option>)}
          </select>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button type="submit" disabled={busy}
          className="flex items-center gap-1.5 rounded-full bg-[#f4511e] px-4 py-1.5 text-[0.78rem] font-semibold text-white transition hover:bg-[#df4618] disabled:opacity-50">
          {busy && <Loader2 size={12} className="animate-spin" />} {editing ? "Save changes" : "Add to-do"}
        </button>
        <button type="button" onClick={onCancel}
          className="rounded-full border border-black/10 px-4 py-1.5 text-[0.78rem] font-semibold text-[#5c5e62]">
          Cancel
        </button>
      </div>
    </form>
  );
}
