"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Mail, Phone, MessageCircle, StickyNote, Bot,
  Plus, X, ChevronDown, Loader2, AlertCircle, CheckCircle2,
  ArrowUpRight, ArrowDownLeft, Lock,
} from "lucide-react";
import type { Communication } from "@/lib/admin-api";

// ── Helpers ───────────────────────────────────────────────────────────────────

const TYPE_ICON: Record<string, React.ElementType> = {
  email:     Mail,
  call:      Phone,
  whatsapp:  MessageCircle,
  note:      StickyNote,
  system:    Bot,
};
const TYPE_COLOR: Record<string, string> = {
  email:    "bg-blue-100 text-blue-600",
  call:     "bg-emerald-100 text-emerald-600",
  whatsapp: "bg-green-100 text-green-600",
  note:     "bg-amber-100 text-amber-600",
  system:   "bg-gray-100 text-gray-500",
};
const DIR_ICON: Record<string, React.ElementType> = {
  outbound: ArrowUpRight,
  inbound:  ArrowDownLeft,
  internal: Lock,
};

function fmtDT(iso: string) {
  try {
    return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
  } catch { return iso; }
}

// ── Types ─────────────────────────────────────────────────────────────────────

type Props = {
  context: "customer" | "quote";
  entityId: number;
  compact?: boolean;
};

type FormState = {
  type: string;
  direction: string;
  subject: string;
  body: string;
};

const EMPTY_FORM: FormState = { type: "note", direction: "internal", subject: "", body: "" };

// ── Component ─────────────────────────────────────────────────────────────────

export default function CommunicationTimeline({ context, entityId, compact = false }: Props) {
  const [entries, setEntries] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const apiPath = context === "customer"
    ? `/api/admin/customers/${entityId}/communications`
    : `/api/admin/quotes/${entityId}/communications`;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(apiPath, { cache: "no-store" });
      const json = await res.json().catch(() => ({ data: [] }));
      setEntries(Array.isArray(json.data) ? json.data : []);
    } catch { setEntries([]); }
    finally { setLoading(false); }
  }, [apiPath]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.body.trim() && !form.subject.trim()) return;
    setSubmitting(true);
    setSubmitMsg(null);
    try {
      const res = await fetch(apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((json as Record<string, unknown>).error as string ?? `Error ${res.status}`);
      const newEntry = (json.data ?? json) as Communication;
      setEntries((prev) => [newEntry, ...prev]);
      setForm(EMPTY_FORM);
      setShowForm(false);
      setSubmitMsg({ type: "ok", text: "Entry logged." });
      setTimeout(() => setSubmitMsg(null), 3000);
    } catch (err) {
      setSubmitMsg({ type: "err", text: err instanceof Error ? err.message : "Failed to save." });
    } finally { setSubmitting(false); }
  };

  const inputCls = "w-full rounded-xl border border-black/[0.09] bg-white px-3 py-2 text-[0.83rem] text-[#1a1a1a] outline-none transition focus:border-[#E85C1A] focus:ring-2 focus:ring-[#E85C1A]/10";
  const selectCls = inputCls;

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#E85C1A]">
          Communications
          {entries.length > 0 && <span className="ml-2 rounded-full bg-[#f0f2f5] px-2 py-0.5 text-[0.65rem] text-[#5c5e62]">{entries.length}</span>}
        </p>
        <button type="button" onClick={() => { setShowForm((v) => !v); setSubmitMsg(null); }}
          className="flex items-center gap-1.5 rounded-xl border border-black/[0.09] bg-white px-3 py-1.5 text-[0.78rem] font-semibold text-[#5c5e62] transition hover:bg-[#f5f5f5]">
          {showForm ? <X size={13} /> : <Plus size={13} />}
          {showForm ? "Cancel" : "Add Entry"}
        </button>
      </div>

      {/* Add entry form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4 rounded-2xl border border-black/[0.08] bg-[#fafafa] p-4">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-wide text-[#9ca3af]">Type</label>
              <select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))} className={selectCls}>
                <option value="note">Note</option>
                <option value="call">Call</option>
                <option value="email">Email</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-wide text-[#9ca3af]">Direction</label>
              <select value={form.direction} onChange={(e) => setForm((p) => ({ ...p, direction: e.target.value }))} className={selectCls}>
                <option value="internal">Internal Note</option>
                <option value="outbound">Outbound</option>
                <option value="inbound">Inbound</option>
              </select>
            </div>
          </div>
          {form.type !== "note" && (
            <div className="mb-3">
              <label className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-wide text-[#9ca3af]">Subject</label>
              <input type="text" value={form.subject} onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
                placeholder="Brief subject…" className={inputCls} />
            </div>
          )}
          <div className="mb-3">
            <label className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-wide text-[#9ca3af]">
              {form.type === "note" ? "Note" : "Body / Summary"}
            </label>
            <textarea value={form.body} onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))}
              rows={3} placeholder={form.type === "note" ? "Internal note — not visible to customer…" : "Message body or call summary…"}
              className={`${inputCls} resize-none`} />
          </div>
          {submitMsg && (
            <div className={`mb-3 flex items-center gap-2 rounded-xl border px-3 py-2 text-[0.78rem] ${submitMsg.type === "ok" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>
              {submitMsg.type === "ok" ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
              {submitMsg.text}
            </div>
          )}
          <button type="submit" disabled={submitting || (!form.body.trim() && !form.subject.trim())}
            className="flex items-center gap-2 rounded-full bg-[#E85C1A] px-5 py-2 text-[0.83rem] font-semibold text-white transition hover:bg-[#d44d10] disabled:opacity-50">
            {submitting ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
            {submitting ? "Saving…" : "Save Entry"}
          </button>
        </form>
      )}

      {submitMsg && !showForm && (
        <div className={`mb-3 flex items-center gap-2 rounded-xl border px-3 py-2 text-[0.78rem] ${submitMsg.type === "ok" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>
          {submitMsg.type === "ok" ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
          {submitMsg.text}
        </div>
      )}

      {/* Timeline */}
      {loading ? (
        <div className="flex justify-center py-6"><Loader2 size={18} className="animate-spin text-[#E85C1A]" /></div>
      ) : entries.length === 0 ? (
        <p className="py-6 text-center text-[0.83rem] italic text-[#9ca3af]">No communications logged yet.</p>
      ) : (
        <div className={`space-y-2 ${compact ? "max-h-[360px] overflow-y-auto pr-1" : ""}`}>
          {entries.map((entry) => {
            const Icon = TYPE_ICON[entry.type] ?? StickyNote;
            const iconCls = TYPE_COLOR[entry.type] ?? "bg-gray-100 text-gray-500";
            const DirIcon = DIR_ICON[entry.direction] ?? Lock;
            return (
              <div key={entry.id} className="flex gap-3 rounded-xl border border-black/[0.06] bg-white p-3">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconCls}`}>
                  <Icon size={14} strokeWidth={1.8} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[0.8rem] font-semibold capitalize text-[#1a1a1a]">{entry.type}</span>
                    <span className="flex items-center gap-0.5 text-[0.68rem] text-[#9ca3af]">
                      <DirIcon size={10} /> {entry.direction}
                    </span>
                    {entry.admin_user_name && (
                      <span className="text-[0.68rem] text-[#9ca3af]">· {entry.admin_user_name}</span>
                    )}
                    <span className="ml-auto text-[0.68rem] text-[#9ca3af]">{fmtDT(entry.created_at)}</span>
                  </div>
                  {entry.subject && (
                    <p className="mt-0.5 text-[0.78rem] font-medium text-[#1a1a1a]">{entry.subject}</p>
                  )}
                  {entry.body && (
                    <p className="mt-0.5 text-[0.78rem] leading-relaxed text-[#5c5e62] whitespace-pre-wrap">{entry.body}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
