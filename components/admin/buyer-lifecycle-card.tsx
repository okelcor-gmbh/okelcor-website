"use client";

import { useState } from "react";
import {
  Loader2, CheckCircle2, AlertCircle, ShieldCheck, ShieldOff,
  Ban, RefreshCw, Save, Sliders, UserCheck, X,
} from "lucide-react";
import AccessProfileModal from "@/components/admin/access-profile-modal";
import {
  BUYER_TIERS, BUYER_TIER_LABELS, BUYER_TIER_STYLES,
  VERIFICATION_STATUS_LABELS, VERIFICATION_STATUS_STYLES,
  RISK_LEVELS, RISK_LEVEL_LABELS, RISK_LEVEL_STYLES,
  APPROVAL_PROFILES, healthScoreColor, riskFromHealth,
  type ApprovalProfileKey, type BuyerLifecycle,
} from "@/lib/crm8";

// ── Types ─────────────────────────────────────────────────────────────────────

interface AccessFlags {
  access_level?: string | null;
  approved_for_quotes?: boolean;
  approved_for_checkout?: boolean;
  approved_for_documents?: boolean;
  approved_for_wholesale_pricing?: boolean;
}

interface Props {
  customerId: number;
  lifecycle: BuyerLifecycle;
  access: AccessFlags;
  /** Merge updated fields back into the parent customer record. */
  onPatch: (fields: Record<string, unknown>) => void;
}

function fmtDT(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
  } catch { return iso; }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function BuyerLifecycleCard({ customerId, lifecycle, access, onPatch }: Props) {
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg]   = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [modalProfile, setModalProfile] = useState<ApprovalProfileKey | null>(null);

  // Local editable tier / risk (defaults tolerate undefined → treat as set baseline)
  const tier = (lifecycle.buyer_tier as string) ?? "none";
  const risk = (lifecycle.risk_level as string) ?? riskFromHealth(lifecycle.health_score);
  const [tierDraft, setTierDraft] = useState(tier);
  const [riskDraft, setRiskDraft] = useState(risk);

  const verification = (lifecycle.verification_status as string) ?? "not_started";
  const health = lifecycle.health_score;

  async function post(path: string, body?: Record<string, unknown>) {
    const res = await fetch(`/api/admin/customers/${customerId}/${path}`, {
      method: "POST",
      headers: body ? { "Content-Type": "application/json" } : {},
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => ({})) as Record<string, unknown>;
    if (res.status === 404 || res.status === 405) {
      throw new Error("Endpoint not yet deployed on the backend.");
    }
    if (!res.ok) {
      throw new Error((json.message as string) ?? (json.error as string) ?? `Action failed (HTTP ${res.status})`);
    }
    return (json.data ?? json) as Record<string, unknown>;
  }

  /** Optimistic access fields derived from an applied profile. */
  function profileFields(key: ApprovalProfileKey): Record<string, unknown> {
    const p = APPROVAL_PROFILES[key];
    const fields: Record<string, unknown> = {
      access_level:                   p.access_level,
      approved_for_quotes:            p.approved_for_quotes,
      approved_for_checkout:          p.approved_for_checkout,
      approved_for_documents:         p.approved_for_documents,
      approved_for_wholesale_pricing: p.approved_for_wholesale_pricing,
    };
    if (p.tier != null) fields.buyer_tier = p.tier;
    return fields;
  }

  // Approve via /approve (records approved_by/at) — used by the positive quick buttons
  async function approveWith(key: "approved_buyer" | "wholesale_buyer") {
    setBusy(key); setMsg(null);
    try {
      const p = APPROVAL_PROFILES[key];
      const data = await post("approve", { profile: key, buyer_tier: p.tier, notes: "" });
      onPatch({ ...profileFields(key), verification_status: lifecycle.verification_status, ...data });
      setMsg({ type: "ok", text: `${p.label} applied.` });
    } catch (e) {
      setMsg({ type: "err", text: e instanceof Error ? e.message : "Action failed." });
    } finally { setBusy(null); }
  }

  // Apply any profile via /approval-profile (used by the modal: restrict / block / generic)
  async function applyProfile(key: ApprovalProfileKey, notes: string) {
    setBusy("modal"); setMsg(null);
    try {
      const data = await post("approval-profile", { profile: key, notes });
      onPatch({ ...profileFields(key), ...data });
      setModalProfile(null);
      setMsg({ type: "ok", text: `${APPROVAL_PROFILES[key].label} applied.` });
    } catch (e) {
      setMsg({ type: "err", text: e instanceof Error ? e.message : "Action failed." });
    } finally { setBusy(null); }
  }

  async function saveTier() {
    if (tierDraft === tier) return;
    setBusy("tier"); setMsg(null);
    try {
      const data = await post("set-tier", { buyer_tier: tierDraft });
      onPatch({ buyer_tier: tierDraft, ...data });
      setMsg({ type: "ok", text: "Buyer tier updated." });
    } catch (e) {
      setMsg({ type: "err", text: e instanceof Error ? e.message : "Action failed." });
    } finally { setBusy(null); }
  }

  async function saveRisk() {
    if (riskDraft === risk) return;
    setBusy("risk"); setMsg(null);
    try {
      const data = await post("risk", { risk_level: riskDraft });
      onPatch({ risk_level: riskDraft, ...data });
      setMsg({ type: "ok", text: "Risk level updated." });
    } catch (e) {
      setMsg({ type: "err", text: e instanceof Error ? e.message : "Action failed." });
    } finally { setBusy(null); }
  }

  async function recalcHealth() {
    setBusy("health"); setMsg(null);
    try {
      const data = await post("health/recalculate");
      onPatch(data);
      const newScore = data.health_score;
      setMsg({ type: "ok", text: newScore != null ? `Health recalculated: ${newScore}/100.` : "Health recalculated." });
    } catch (e) {
      setMsg({ type: "err", text: e instanceof Error ? e.message : "Action failed." });
    } finally { setBusy(null); }
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
      <div className="flex items-center gap-2.5 border-b border-black/[0.06] px-5 py-4">
        <UserCheck size={15} className="text-[#5c5e62]" />
        <p className="text-[0.9rem] font-extrabold text-[#1a1a1a]">Buyer Lifecycle</p>
      </div>

      <div className="space-y-4 p-5">
        {msg && (
          <div className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-[0.8rem] ${msg.type === "ok" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700"}`}>
            {msg.type === "ok" ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
            <span className="flex-1">{msg.text}</span>
            <button type="button" onClick={() => setMsg(null)}><X size={13} /></button>
          </div>
        )}

        {/* Status row: verification · health · risk */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-black/[0.06] bg-[#fafafa] px-3 py-2.5 text-center">
            <p className="mb-1 text-[0.62rem] font-bold uppercase tracking-[0.1em] text-[#9ca3af]">Verification</p>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.68rem] font-bold ${VERIFICATION_STATUS_STYLES[verification] ?? "bg-gray-100 text-gray-500"}`}>
              {VERIFICATION_STATUS_LABELS[verification] ?? verification}
            </span>
          </div>
          <div className="rounded-xl border border-black/[0.06] bg-[#fafafa] px-3 py-2.5 text-center">
            <p className="mb-1 text-[0.62rem] font-bold uppercase tracking-[0.1em] text-[#9ca3af]">Health</p>
            <span className={`inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-[0.78rem] font-extrabold ${healthScoreColor(health)}`}>
              {health ?? "—"}
            </span>
          </div>
          <div className="rounded-xl border border-black/[0.06] bg-[#fafafa] px-3 py-2.5 text-center">
            <p className="mb-1 text-[0.62rem] font-bold uppercase tracking-[0.1em] text-[#9ca3af]">Risk</p>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.68rem] font-bold ${RISK_LEVEL_STYLES[risk] ?? "bg-gray-100 text-gray-500"}`}>
              {RISK_LEVEL_LABELS[risk] ?? risk}
            </span>
          </div>
        </div>

        {/* Buyer tier */}
        <div>
          <p className="mb-1 text-[0.7rem] font-semibold uppercase tracking-wide text-[#9ca3af]">Buyer Tier</p>
          <div className="flex gap-2">
            <select
              value={tierDraft}
              onChange={(e) => setTierDraft(e.target.value)}
              className="h-9 flex-1 rounded-xl border border-black/[0.09] bg-white px-3 text-[0.83rem] text-[#1a1a1a] outline-none focus:border-[#E85C1A]"
            >
              {BUYER_TIERS.map((t) => <option key={t} value={t}>{BUYER_TIER_LABELS[t]}</option>)}
            </select>
            <button
              type="button"
              disabled={busy !== null || tierDraft === tier}
              onClick={saveTier}
              className="flex h-9 items-center gap-1.5 rounded-xl border border-black/[0.09] bg-white px-3 text-[0.78rem] font-semibold text-[#5c5e62] transition hover:bg-[#f0f2f5] disabled:opacity-40"
            >
              {busy === "tier" ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
              Save
            </button>
          </div>
          {tier !== "none" && (
            <span className={`mt-1.5 inline-flex items-center rounded-full px-2 py-0.5 text-[0.65rem] font-bold ${BUYER_TIER_STYLES[tier]}`}>
              Current: {BUYER_TIER_LABELS[tier]}
            </span>
          )}
        </div>

        {/* Risk level */}
        <div>
          <p className="mb-1 text-[0.7rem] font-semibold uppercase tracking-wide text-[#9ca3af]">Risk Level</p>
          <div className="flex gap-2">
            <select
              value={riskDraft}
              onChange={(e) => setRiskDraft(e.target.value)}
              className="h-9 flex-1 rounded-xl border border-black/[0.09] bg-white px-3 text-[0.83rem] text-[#1a1a1a] outline-none focus:border-[#E85C1A]"
            >
              {RISK_LEVELS.map((r) => <option key={r} value={r}>{RISK_LEVEL_LABELS[r]}</option>)}
            </select>
            <button
              type="button"
              disabled={busy !== null || riskDraft === risk}
              onClick={saveRisk}
              className="flex h-9 items-center gap-1.5 rounded-xl border border-black/[0.09] bg-white px-3 text-[0.78rem] font-semibold text-[#5c5e62] transition hover:bg-[#f0f2f5] disabled:opacity-40"
            >
              {busy === "risk" ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
              Save
            </button>
          </div>
        </div>

        {/* Approval audit */}
        {(lifecycle.approved_at || lifecycle.approval_notes || lifecycle.rejection_reason) && (
          <div className="rounded-xl border border-black/[0.06] bg-[#fafafa] px-3 py-2.5 text-[0.78rem]">
            {lifecycle.approved_at && (
              <p className="text-[#5c5e62]">
                <span className="font-semibold text-[#9ca3af]">Approved:</span>{" "}
                {fmtDT(lifecycle.approved_at)}
                {lifecycle.approved_by_name ? ` · ${lifecycle.approved_by_name}` : ""}
              </p>
            )}
            {lifecycle.approval_notes && (
              <p className="mt-0.5 text-[#5c5e62]"><span className="font-semibold text-[#9ca3af]">Notes:</span> {lifecycle.approval_notes}</p>
            )}
            {lifecycle.rejection_reason && (
              <p className="mt-0.5 text-red-600"><span className="font-semibold">Rejection:</span> {lifecycle.rejection_reason}</p>
            )}
          </div>
        )}

        {/* Quick actions */}
        <div className="flex flex-wrap gap-2 border-t border-black/[0.06] pt-4">
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => approveWith("approved_buyer")}
            className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[0.78rem] font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
          >
            {busy === "approved_buyer" ? <Loader2 size={12} className="animate-spin" /> : <ShieldCheck size={12} />}
            Apply Approved Buyer
          </button>
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => approveWith("wholesale_buyer")}
            className="flex items-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-[0.78rem] font-semibold text-teal-700 transition hover:bg-teal-100 disabled:opacity-50"
          >
            {busy === "wholesale_buyer" ? <Loader2 size={12} className="animate-spin" /> : <ShieldCheck size={12} />}
            Apply Wholesale Buyer
          </button>
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => setModalProfile("restricted")}
            className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[0.78rem] font-semibold text-amber-700 transition hover:bg-amber-100 disabled:opacity-50"
          >
            <ShieldOff size={12} /> Restrict
          </button>
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => setModalProfile("blocked")}
            className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[0.78rem] font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
          >
            <Ban size={12} /> Block
          </button>
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => setModalProfile("approved_buyer")}
            className="flex items-center gap-1.5 rounded-xl border border-black/[0.09] bg-white px-3 py-2 text-[0.78rem] font-semibold text-[#5c5e62] transition hover:bg-[#f0f2f5] disabled:opacity-50"
          >
            <Sliders size={12} /> Apply Profile…
          </button>
          <button
            type="button"
            disabled={busy !== null}
            onClick={recalcHealth}
            className="flex items-center gap-1.5 rounded-xl border border-black/[0.09] bg-white px-3 py-2 text-[0.78rem] font-semibold text-[#5c5e62] transition hover:bg-[#f0f2f5] disabled:opacity-50"
          >
            {busy === "health" ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
            Recalculate Health
          </button>
        </div>
      </div>

      {modalProfile && (
        <AccessProfileModal
          current={{ ...access, buyer_tier: tier }}
          applying={busy === "modal"}
          initialProfile={modalProfile}
          onApply={applyProfile}
          onClose={() => setModalProfile(null)}
        />
      )}
    </div>
  );
}
