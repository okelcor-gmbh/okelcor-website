"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle, Clock3, LifeBuoy, Loader2, Plus, Trash2, UserRound, X,
} from "lucide-react";
import type { ClaimItem, ClaimMeta } from "@/lib/admin-api";
import { useAdminPermissions } from "@/hooks/use-admin-permissions";
import EmptyState from "@/components/ui/empty-state";

/**
 * The after-sales claims queue (Session 119). Claims used to live in e-mail
 * threads; this is the structured version on the machinery that already runs
 * the finance snapshot and the to-dos: status + assignee + My Work +
 * notify-on-change. The queue reads oldest-first — the customer who has
 * waited longest is on top — and its numbers (open count, average days to a
 * decision) come from meta, never computed here.
 */

const INPUT =
  "h-9 w-full rounded-lg border border-black/[0.10] bg-white px-3 text-[0.83rem] text-[#171a20] placeholder:text-[#8c8f94] focus:border-[#f4511e] focus:outline-none";
const LABEL = "mb-1 block text-[0.68rem] font-bold uppercase tracking-wider text-[#8c8f94]";

/** Status → select styling. Same palette logic as the to-do board. */
const STATUS_SELECT: Record<string, string> = {
  new:               "border-red-200 bg-red-50 text-red-800",
  in_review:         "border-cyan-200 bg-cyan-50 text-cyan-800",
  awaiting_customer: "border-amber-200 bg-amber-50 text-amber-800",
  approved:          "border-emerald-200 bg-emerald-50 text-emerald-800",
  rejected:          "border-gray-300 bg-gray-100 text-gray-700",
  closed:            "border-gray-200 bg-gray-50 text-gray-500",
};

const TYPE_BADGE = "border-gray-200 bg-gray-50 text-gray-600";

type Tab = "open" | "closed" | "all";

export default function ClaimsQueue({ initialClaim }: { initialClaim: number | null }) {
  const { can } = useAdminPermissions();
  const mayManage = can("claims.manage");
  const mayDelete = can("claims.delete");

  const [claims, setClaims] = useState<ClaimItem[]>([]);
  const [meta, setMeta] = useState<ClaimMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const [tab, setTab] = useState<Tab>("open");
  const [typeFilter, setTypeFilter] = useState("");
  const [q, setQ] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The deep-linked claim opens expanded — same contract as ?todo= on the
  // to-do board: the person clicked a notification about THIS claim.
  const [expandedId, setExpandedId] = useState<number | null>(initialClaim);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("status", tab === "open" ? "open" : tab === "closed" ? "closed" : "all");
      if (typeFilter) params.set("type", typeFilter);
      if (q.trim()) params.set("q", q.trim());
      const res = await fetch(`/api/admin/claims?${params}`, { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      setClaims(Array.isArray(json.data) ? json.data : []);
      setMeta(json.meta ?? null);
      setUnavailable(json.meta?.claims_available === false);
    } catch {
      setClaims([]);
    } finally {
      setLoading(false);
    }
  }, [tab, typeFilter, q]);

  useEffect(() => { void load(); }, [load]);

  if (loading && claims.length === 0 && !meta) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={22} className="animate-spin text-[#f4511e]" />
      </div>
    );
  }

  if (unavailable) {
    return (
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <EmptyState
          icon={LifeBuoy}
          heading="The claims queue is not available yet"
          description="The database migration behind it has not run on this environment."
        />
      </div>
    );
  }

  const counts = meta?.counts ?? {};

  return (
    <div className="space-y-4">
      {/* ── The queue's own numbers — served, never computed here ─────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Open claims" value={String(meta?.open_count ?? 0)} highlight={Boolean(meta?.open_count)} />
        <StatCard label="New" value={String(counts.new ?? 0)} />
        <StatCard label="Awaiting customer" value={String(counts.awaiting_customer ?? 0)} />
        <StatCard
          label="Avg days to decision"
          value={meta?.avg_days_to_decision != null ? String(meta.avg_days_to_decision) : "—"}
          hint="Logged to approved or rejected, last 90 days"
        />
      </div>

      {/* ── Controls ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex overflow-hidden rounded-lg border border-black/[0.10] bg-white">
          {(["open", "closed", "all"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 text-[0.78rem] font-semibold capitalize transition ${
                tab === t ? "bg-[#171a20] text-white" : "text-[#5c5e62] hover:bg-[#fafafa]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="h-8 cursor-pointer rounded-lg border border-black/[0.10] bg-white px-2 text-[0.78rem] font-semibold text-[#171a20] focus:border-[#f4511e] focus:outline-none"
        >
          <option value="">All types</option>
          {(meta?.types ?? []).map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
        </select>

        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search ref, customer or order…"
          className="h-8 w-full max-w-[220px] rounded-lg border border-black/[0.10] bg-white px-2.5 text-[0.78rem] text-[#171a20] placeholder:text-[#8c8f94] focus:border-[#f4511e] focus:outline-none"
        />

        {mayManage && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="ml-auto flex items-center gap-1.5 rounded-xl bg-[#f4511e] px-3.5 py-2 text-[0.78rem] font-semibold text-white transition hover:bg-[#d0500f]"
          >
            <Plus size={14} strokeWidth={2.4} /> Log a claim
          </button>
        )}
      </div>

      {error && (
        <p className="flex items-center gap-1.5 text-[0.8rem] font-medium text-red-600">
          <AlertTriangle size={14} /> {error}
        </p>
      )}

      {/* ── The queue ─────────────────────────────────────────────────────── */}
      {claims.length === 0 ? (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <EmptyState
            icon={LifeBuoy}
            heading={tab === "open" ? "No open claims" : "Nothing here"}
            description={
              tab === "open"
                ? "Every claim has been closed. When a customer reports a problem, log it here so it gets a status, a name and a clock."
                : "No claims match this view."
            }
          />
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <ul className="divide-y divide-black/[0.05]">
            {claims.map((c) => (
              <ClaimRow
                key={c.id}
                claim={c}
                meta={meta}
                mayManage={mayManage}
                mayDelete={mayDelete}
                expanded={expandedId === c.id}
                onToggle={() => setExpandedId((v) => (v === c.id ? null : c.id))}
                onChanged={load}
                onError={setError}
                highlighted={initialClaim === c.id}
              />
            ))}
          </ul>
        </div>
      )}

      {showForm && meta && (
        <NewClaimModal
          meta={meta}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); void load(); }}
        />
      )}
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, hint, highlight = false }: {
  label: string; value: string; hint?: string; highlight?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <p className="text-[0.68rem] font-bold uppercase tracking-wider text-[#8c8f94]">{label}</p>
      <p className={`mt-1 text-[1.35rem] font-extrabold ${highlight ? "text-[#f4511e]" : "text-[#171a20]"}`}>
        {value}
      </p>
      {hint && <p className="mt-0.5 text-[0.68rem] text-[#b6b8bc]">{hint}</p>}
    </div>
  );
}

// ── Row ───────────────────────────────────────────────────────────────────────

function ClaimRow({
  claim, meta, mayManage, mayDelete, expanded, onToggle, onChanged, onError, highlighted,
}: {
  claim: ClaimItem;
  meta: ClaimMeta | null;
  mayManage: boolean;
  mayDelete: boolean;
  expanded: boolean;
  onToggle: () => void;
  onChanged: () => void;
  onError: (m: string | null) => void;
  highlighted: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const open = claim.status !== "closed";
  const waitedLong = open && (claim.age_days ?? 0) >= 7;

  const patch = async (body: Record<string, unknown>) => {
    setBusy(true);
    onError(null);
    try {
      const res = await fetch(`/api/admin/claims/${claim.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({})) as { message?: string };
        onError(json.message ?? "Could not update the claim.");
        return;
      }
      onChanged();
    } catch {
      onError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Remove ${claim.ref}? Closing it with a note is usually the right call — deleting erases what the customer told us.`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/claims/${claim.id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json().catch(() => ({})) as { message?: string };
        onError(json.message ?? "Could not remove the claim.");
        return;
      }
      onChanged();
    } catch {
      onError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <li
      ref={highlighted ? (el) => el?.scrollIntoView({ block: "center" }) : undefined}
      className={`px-4 py-3.5 transition hover:bg-[#fafafa] ${
        highlighted ? "bg-amber-50 ring-2 ring-inset ring-amber-300" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        <button type="button" onClick={onToggle} className="min-w-0 flex-1 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[0.875rem] font-semibold text-[#1a1a1a]">
              <span className="font-mono text-[0.8rem] text-[#8c8f94]">{claim.ref}</span>
              {"  "}{claim.customer_name}
            </p>
            <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[0.62rem] font-bold uppercase ${TYPE_BADGE}`}>
              {claim.type_label}
            </span>
            {claim.order_number && (
              <span className="text-[0.73rem] text-[#8c8f94]">order {claim.order_number}</span>
            )}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
            <p className="max-w-xl truncate text-[0.8rem] text-[#5c5e62]">{claim.description}</p>
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 text-[0.73rem]">
            <span className={`flex items-center gap-1 font-medium ${waitedLong ? "text-red-600" : "text-[#9ca3af]"}`}>
              <Clock3 size={12} strokeWidth={2.2} />
              {open
                ? `waiting ${claim.age_days ?? 0} ${claim.age_days === 1 ? "day" : "days"}`
                : `decided in ${claim.age_days ?? 0} ${claim.age_days === 1 ? "day" : "days"}`}
            </span>
            {claim.assignee && (
              <span className="flex items-center gap-1 text-[#9ca3af]">
                <UserRound size={12} strokeWidth={2.2} /> {claim.assignee}
              </span>
            )}
            {claim.creator && <span className="text-[#b6b8bc]">logged by {claim.creator}</span>}
          </div>
        </button>

        {mayManage ? (
          <select
            value={claim.status}
            disabled={busy}
            onChange={(e) => void patch({ status: e.target.value })}
            className={`h-8 shrink-0 cursor-pointer rounded-xl border px-2 text-[0.75rem] font-semibold outline-none transition focus:border-[#f4511e] disabled:opacity-50 ${
              STATUS_SELECT[claim.status] ?? "border-black/[0.09] bg-white text-[#1a1a1a]"
            }`}
          >
            {(meta?.statuses ?? []).map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        ) : (
          <span className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[0.68rem] font-bold ${
            STATUS_SELECT[claim.status] ?? "border-gray-200 bg-gray-50 text-gray-600"
          }`}>
            {claim.status_label}
          </span>
        )}

        {mayDelete && (
          <button
            type="button"
            onClick={() => void remove()}
            disabled={busy}
            title="Remove (super admin) — closing with a note is usually right"
            className="shrink-0 rounded-lg p-1.5 text-[#b6b8bc] transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
          >
            <Trash2 size={15} strokeWidth={2} />
          </button>
        )}
      </div>

      {expanded && (
        <ExpandedClaim claim={claim} meta={meta} mayManage={mayManage} busy={busy} onPatch={patch} />
      )}
    </li>
  );
}

// ── Expanded claim ────────────────────────────────────────────────────────────

function ExpandedClaim({ claim, meta, mayManage, busy, onPatch }: {
  claim: ClaimItem;
  meta: ClaimMeta | null;
  mayManage: boolean;
  busy: boolean;
  onPatch: (body: Record<string, unknown>) => Promise<void>;
}) {
  return (
    <div className="mt-3 space-y-3 rounded-xl border border-black/[0.07] bg-[#fbfbfc] p-3.5">
      <div className="flex flex-wrap gap-x-5 gap-y-1 text-[0.73rem] text-[#8c8f94]">
        {claim.customer_company && <span>Company <b className="font-semibold text-[#5c5e62]">{claim.customer_company}</b></span>}
        {claim.customer_email && <span>{claim.customer_email}</span>}
        {claim.quantity != null && <span>{claim.quantity} tyres affected</span>}
        {claim.resolved_at && (
          <span>
            Decided {new Date(claim.resolved_at).toLocaleDateString("en-GB")}
            {claim.resolved_by_name ? ` by ${claim.resolved_by_name}` : ""}
          </span>
        )}
      </div>

      <div>
        <p className="mb-1 text-[0.68rem] font-bold uppercase tracking-wider text-[#8c8f94]">
          What the customer says happened
        </p>
        <p className="whitespace-pre-wrap break-words text-[0.8rem] leading-relaxed text-[#1a1a1a]">
          {claim.description}
        </p>
      </div>

      {mayManage ? (
        <div>
          <label className="mb-1 block text-[0.68rem] font-bold uppercase tracking-wider text-[#8c8f94]">
            Outcome — what was decided and done
          </label>
          <textarea
            defaultValue={claim.outcome_note ?? ""}
            placeholder="e.g. Credit note issued for the twelve damaged units; photos on file — saved when you click away"
            rows={2}
            disabled={busy}
            onBlur={(e) => {
              const v = e.target.value.trim();
              if (v !== (claim.outcome_note ?? "").trim()) void onPatch({ outcome_note: v || null });
            }}
            className="w-full rounded-lg border border-black/[0.08] bg-white px-2.5 py-2 text-[0.78rem] text-[#1a1a1a] outline-none transition placeholder:text-[#b6b8bc] focus:border-[#f4511e] disabled:opacity-50"
          />
        </div>
      ) : claim.outcome_note ? (
        <div>
          <p className="mb-1 text-[0.68rem] font-bold uppercase tracking-wider text-[#8c8f94]">Outcome</p>
          <p className="whitespace-pre-wrap text-[0.8rem] leading-relaxed text-[#1a1a1a]">{claim.outcome_note}</p>
        </div>
      ) : null}

      {mayManage && (
        <div className="max-w-xs">
          <label className={LABEL}>Assigned to</label>
          <select
            value={claim.assigned_admin_id ?? ""}
            disabled={busy}
            onChange={(e) => void onPatch({ assigned_admin_id: e.target.value ? Number(e.target.value) : null })}
            className="h-8 w-full cursor-pointer rounded-lg border border-black/[0.10] bg-white px-2 text-[0.78rem] font-semibold text-[#171a20] focus:border-[#f4511e] focus:outline-none disabled:opacity-50"
          >
            <option value="">Nobody yet</option>
            {(meta?.staff ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <p className="mt-1 text-[0.7rem] text-[#8c8f94]">
            Tagging someone notifies them and lands the claim in their My Work.
          </p>
        </div>
      )}
    </div>
  );
}

// ── New claim modal ───────────────────────────────────────────────────────────

function NewClaimModal({ meta, onClose, onSaved }: {
  meta: ClaimMeta;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const firstField = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    customer_name: "",
    customer_email: "",
    customer_company: "",
    order_number: "",
    type: "other",
    quantity: "",
    description: "",
    assigned_admin_id: "",
  });

  useEffect(() => { firstField.current?.focus(); }, []);

  const set = (k: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customer_name.trim() || !form.description.trim()) {
      setError("The customer's name and what happened are the minimum a claim needs.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: form.customer_name.trim(),
          customer_email: form.customer_email.trim() || null,
          customer_company: form.customer_company.trim() || null,
          order_number: form.order_number.trim() || null,
          type: form.type,
          quantity: form.quantity ? Number(form.quantity) : null,
          description: form.description.trim(),
          assigned_admin_id: form.assigned_admin_id ? Number(form.assigned_admin_id) : null,
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({})) as { message?: string };
        setError(json.message ?? "Could not log the claim.");
        return;
      }
      onSaved();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <form
        onSubmit={submit}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[1rem] font-extrabold text-[#171a20]">Log a claim</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-[#8c8f94] hover:bg-[#f5f5f6]">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Customer name *</label>
              <input ref={firstField} type="text" value={form.customer_name} onChange={set("customer_name")} className={INPUT} placeholder="Who is claiming" />
            </div>
            <div>
              <label className={LABEL}>Company</label>
              <input type="text" value={form.customer_company} onChange={set("customer_company")} className={INPUT} placeholder="Optional" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>E-mail</label>
              <input type="email" value={form.customer_email} onChange={set("customer_email")} className={INPUT} placeholder="Optional" />
            </div>
            <div>
              <label className={LABEL}>Order number</label>
              <input type="text" value={form.order_number} onChange={set("order_number")} className={INPUT} placeholder="e.g. OK-2026-0455" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Type</label>
              <select value={form.type} onChange={set("type")} className={`${INPUT} cursor-pointer`}>
                {(meta.types ?? []).map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL}>Tyres affected</label>
              <input type="number" min={1} value={form.quantity} onChange={set("quantity")} className={INPUT} placeholder="Optional" />
            </div>
          </div>

          <div>
            <label className={LABEL}>What the customer says happened *</label>
            <textarea
              value={form.description}
              onChange={set("description")}
              rows={4}
              className="w-full rounded-lg border border-black/[0.10] bg-white px-3 py-2 text-[0.83rem] text-[#171a20] placeholder:text-[#8c8f94] focus:border-[#f4511e] focus:outline-none"
              placeholder="Paste it from the e-mail thread — this is the record of what was reported"
            />
          </div>

          <div>
            <label className={LABEL}>Assign to</label>
            <select value={form.assigned_admin_id} onChange={set("assigned_admin_id")} className={`${INPUT} cursor-pointer`}>
              <option value="">Nobody yet</option>
              {(meta.staff ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <p className="mt-1 text-[0.7rem] text-[#8c8f94]">
              Tagging someone notifies them and lands the claim in their My Work.
            </p>
          </div>
        </div>

        {error && (
          <p className="mt-3 flex items-center gap-1.5 text-[0.8rem] font-medium text-red-600">
            <AlertTriangle size={14} /> {error}
          </p>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-xl border border-black/[0.10] px-3.5 py-2 text-[0.8rem] font-semibold text-[#5c5e62] hover:bg-[#fafafa]">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-1.5 rounded-xl bg-[#f4511e] px-4 py-2 text-[0.8rem] font-semibold text-white transition hover:bg-[#d0500f] disabled:opacity-50"
          >
            {saving && <Loader2 size={13} className="animate-spin" />} Log the claim
          </button>
        </div>
      </form>
    </div>
  );
}
