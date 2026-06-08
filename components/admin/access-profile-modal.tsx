"use client";

import { useState } from "react";
import { X, Loader2, ArrowRight, Check, Minus, ShieldAlert } from "lucide-react";
import {
  APPROVAL_PROFILE_LIST,
  APPROVAL_PROFILES,
  BUYER_TIER_LABELS,
  type ApprovalProfileKey,
  type ApprovalProfile,
} from "@/lib/crm8";

// ── Types ─────────────────────────────────────────────────────────────────────

interface CurrentAccess {
  access_level?: string | null;
  approved_for_quotes?: boolean;
  approved_for_checkout?: boolean;
  approved_for_documents?: boolean;
  approved_for_wholesale_pricing?: boolean;
  buyer_tier?: string | null;
}

interface Props {
  current: CurrentAccess;
  applying: boolean;
  initialProfile?: ApprovalProfileKey;
  /** When true, the notes field is shown (approval audit trail). */
  onApply: (profile: ApprovalProfileKey, notes: string) => void;
  onClose: () => void;
}

const TONE_RING: Record<ApprovalProfile["tone"], string> = {
  neutral:  "has-[:checked]:border-gray-400 has-[:checked]:bg-gray-50",
  positive: "has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50/50",
  warning:  "has-[:checked]:border-amber-500 has-[:checked]:bg-amber-50/50",
  danger:   "has-[:checked]:border-red-500 has-[:checked]:bg-red-50/50",
};

// ── Permission diff row ─────────────────────────────────────────────────────

function PermBit({ on }: { on: boolean }) {
  return on ? (
    <span className="inline-flex items-center gap-1 text-emerald-700">
      <Check size={12} strokeWidth={2.5} /> Yes
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[#9ca3af]">
      <Minus size={12} strokeWidth={2.5} /> No
    </span>
  );
}

function DiffRow({ label, from, to }: { label: string; from: boolean; to: boolean }) {
  const changed = from !== to;
  return (
    <div className={`flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-[0.78rem] ${changed ? "bg-white" : ""}`}>
      <span className="text-[#5c5e62]">{label}</span>
      <span className="flex items-center gap-1.5 font-semibold">
        <PermBit on={from} />
        {changed && <ArrowRight size={11} className="text-[#9ca3af]" />}
        {changed && <PermBit on={to} />}
      </span>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AccessProfileModal({
  current, applying, initialProfile, onApply, onClose,
}: Props) {
  const [selected, setSelected] = useState<ApprovalProfileKey>(initialProfile ?? "approved_buyer");
  const [notes, setNotes] = useState("");

  const profile = APPROVAL_PROFILES[selected];

  const cur = {
    quotes:    current.approved_for_quotes ?? true,
    checkout:  current.approved_for_checkout ?? true,
    documents: current.approved_for_documents ?? true,
    wholesale: current.approved_for_wholesale_pricing ?? false,
  };

  const tierChange =
    profile.tier != null && profile.tier !== (current.buyer_tier ?? "none");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-7 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-[1.05rem] font-extrabold text-[#1a1a1a]">Apply Access Profile</p>
            <p className="mt-1 text-[0.83rem] text-[#5c5e62]">
              Choose a profile. The summary shows exactly what will change before you apply.
            </p>
          </div>
          {!applying && (
            <button type="button" onClick={onClose} className="shrink-0 text-[#9ca3af] hover:text-[#1a1a1a]">
              <X size={18} />
            </button>
          )}
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {/* Profile choices */}
          <div className="flex flex-col gap-2">
            {APPROVAL_PROFILE_LIST.map((p) => (
              <label
                key={p.key}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border border-black/[0.08] px-4 py-3 transition hover:border-black/20 ${TONE_RING[p.tone]}`}
              >
                <input
                  type="radio"
                  name="approvalProfile"
                  value={p.key}
                  checked={selected === p.key}
                  onChange={() => setSelected(p.key)}
                  className="mt-0.5 accent-[#E85C1A]"
                />
                <div>
                  <p className="flex items-center gap-1.5 text-[0.875rem] font-semibold text-[#1a1a1a]">
                    {p.label}
                    {p.revokesAccess && <ShieldAlert size={13} className="text-red-500" />}
                  </p>
                  <p className="mt-0.5 text-[0.75rem] leading-snug text-[#5c5e62]">{p.description}</p>
                </div>
              </label>
            ))}
          </div>

          {/* Change preview */}
          <div className="flex flex-col gap-3">
            <div className="rounded-xl border border-black/[0.08] bg-[#f8f8f8] p-3">
              <p className="mb-2 text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#9ca3af]">
                What changes
              </p>
              <div className="space-y-0.5">
                <DiffRow label="Quote Requests"    from={cur.quotes}    to={profile.approved_for_quotes} />
                <DiffRow label="Checkout"          from={cur.checkout}  to={profile.approved_for_checkout} />
                <DiffRow label="Trade Documents"   from={cur.documents} to={profile.approved_for_documents} />
                <DiffRow label="Wholesale Pricing" from={cur.wholesale} to={profile.approved_for_wholesale_pricing} />
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-black/[0.06] px-2.5 pt-2 text-[0.78rem]">
                <span className="text-[#5c5e62]">Buyer Tier</span>
                <span className="font-semibold text-[#1a1a1a]">
                  {profile.tier == null ? (
                    <span className="text-[#9ca3af]">Unchanged</span>
                  ) : tierChange ? (
                    <span className="text-[#1a1a1a]">→ {BUYER_TIER_LABELS[profile.tier]}</span>
                  ) : (
                    BUYER_TIER_LABELS[profile.tier]
                  )}
                </span>
              </div>
            </div>

            {profile.revokesAccess && (
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[0.78rem] text-red-700">
                <ShieldAlert size={14} className="mt-0.5 shrink-0" />
                Applying <strong>{profile.label}</strong> revokes all access and signs the customer out of active sessions.
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">
                Notes <span className="font-normal lowercase tracking-normal text-[#9ca3af]">(optional, logged)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Reason for this access change…"
                className="w-full resize-none rounded-xl border border-black/[0.09] bg-white px-3 py-2 text-[0.83rem] text-[#1a1a1a] outline-none placeholder:text-[#aaa] transition focus:border-[#E85C1A]/40 focus:ring-2 focus:ring-[#E85C1A]/10"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            disabled={applying}
            onClick={onClose}
            className="flex-1 h-11 rounded-full border border-black/[0.1] text-[0.875rem] font-semibold text-[#5c5e62] transition hover:bg-[#f0f2f5] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={applying}
            onClick={() => onApply(selected, notes.trim())}
            className={`flex flex-1 h-11 items-center justify-center gap-2 rounded-full text-[0.875rem] font-semibold text-white transition disabled:opacity-50 ${
              profile.tone === "danger" ? "bg-red-600 hover:bg-red-700" : "bg-[#E85C1A] hover:bg-[#d44d10]"
            }`}
          >
            {applying ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
            {applying ? "Applying…" : `Apply ${profile.label}`}
          </button>
        </div>
      </div>
    </div>
  );
}
