"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck, Plus, Check, X, Loader2, AlertCircle, CheckCircle2, FileBadge,
} from "lucide-react";
import {
  VERIFICATION_TYPES, VERIFICATION_TYPE_LABELS,
  VERIFICATION_STATUS_LABELS, VERIFICATION_STATUS_STYLES,
  type CustomerVerification,
} from "@/lib/crm8";

interface Props {
  customerId: number;
  /** Notify parent when the overall verification picture changes (optional). */
  onVerifiedChange?: (anyVerified: boolean) => void;
}

export default function CustomerVerificationsCard({ customerId, onVerifiedChange }: Props) {
  const [items, setItems]       = useState<CustomerVerification[]>([]);
  const [loading, setLoading]   = useState(true);
  const [unavailable, setUA]    = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [busyId, setBusyId]     = useState<number | "add" | null>(null);

  // Add form
  const [showAdd, setShowAdd]   = useState(false);
  const [addType, setAddType]   = useState<string>("company_registration");
  const [addValue, setAddValue] = useState("");

  // Reject-with-notes inline state
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectNotes, setRejectNotes] = useState("");

  const fetchItems = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/admin/customers/${customerId}/verifications`, { cache: "no-store" });
      if (res.status === 404 || res.status === 405) { setUA(true); setItems([]); return; }
      const json = await res.json().catch(() => ({})) as Record<string, unknown>;
      if (!res.ok) { setError((json.message as string) ?? "Failed to load verifications."); return; }
      const raw = (Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : []) as CustomerVerification[];
      setItems(raw);
      onVerifiedChange?.(raw.some((v) => v.status === "verified"));
    } catch {
      setError("Network error — could not load verifications.");
    } finally {
      setLoading(false);
    }
  }, [customerId, onVerifiedChange]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  async function addItem() {
    if (busyId) return;
    setBusyId("add");
    try {
      const res = await fetch(`/api/admin/customers/${customerId}/verifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: addType, value: addValue.trim() || undefined }),
      });
      const json = await res.json().catch(() => ({})) as Record<string, unknown>;
      if (res.ok) {
        const created = (json.data ?? json) as CustomerVerification;
        setItems((prev) => [...prev, created]);
        setShowAdd(false); setAddValue(""); setAddType("company_registration");
      } else {
        setError((json.message as string) ?? "Could not add verification.");
      }
    } catch {
      setError("Network error.");
    } finally { setBusyId(null); }
  }

  async function patchStatus(item: CustomerVerification, status: "verified" | "rejected", notes?: string) {
    setBusyId(item.id);
    try {
      const res = await fetch(`/api/admin/customers/${customerId}/verifications/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notes ? { status, notes } : { status }),
      });
      const json = await res.json().catch(() => ({})) as Record<string, unknown>;
      if (res.ok) {
        const updated = (json.data ?? json) as CustomerVerification;
        const merged = { ...item, ...updated, status, notes: notes ?? updated.notes ?? item.notes };
        setItems((prev) => {
          const next = prev.map((v) => (v.id === item.id ? merged : v));
          onVerifiedChange?.(next.some((v) => v.status === "verified"));
          return next;
        });
        setRejectingId(null); setRejectNotes("");
      } else {
        setError((json.message as string) ?? "Could not update verification.");
      }
    } catch {
      setError("Network error.");
    } finally { setBusyId(null); }
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
      <div className="flex items-center justify-between gap-2.5 border-b border-black/[0.06] px-5 py-4">
        <div className="flex items-center gap-2.5">
          <ShieldCheck size={15} className="text-[#5c5e62]" />
          <p className="text-[0.9rem] font-extrabold text-[#1a1a1a]">Verification</p>
        </div>
        {!unavailable && (
          <button
            type="button"
            onClick={() => { setShowAdd((s) => !s); setError(null); }}
            className="flex items-center gap-1.5 rounded-lg border border-black/[0.09] bg-white px-2.5 py-1.5 text-[0.75rem] font-semibold text-[#5c5e62] transition hover:bg-[#f0f2f5]"
          >
            <Plus size={12} /> Add
          </button>
        )}
      </div>

      <div className="p-5">
        {error && (
          <div className="mb-3 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[0.8rem] text-red-700">
            <AlertCircle size={13} /><span className="flex-1">{error}</span>
            <button type="button" onClick={() => setError(null)}><X size={12} /></button>
          </div>
        )}

        {unavailable ? (
          <div className="py-6 text-center">
            <p className="text-[0.83rem] text-[#9ca3af]">Verifications not available yet.</p>
            <p className="mt-1 font-mono text-[0.72rem] text-[#d1d5db]">Backend: GET /admin/customers/{"{id}"}/verifications</p>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-6"><Loader2 size={18} className="animate-spin text-[#E85C1A]" /></div>
        ) : (
          <>
            {/* Add form */}
            {showAdd && (
              <div className="mb-4 rounded-xl border border-[#E85C1A]/20 bg-orange-50/30 p-3">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <select
                    value={addType}
                    onChange={(e) => setAddType(e.target.value)}
                    className="h-9 rounded-lg border border-black/[0.09] bg-white px-2.5 text-[0.8rem] text-[#1a1a1a] outline-none focus:border-[#E85C1A]"
                  >
                    {VERIFICATION_TYPES.map((t) => <option key={t} value={t}>{VERIFICATION_TYPE_LABELS[t]}</option>)}
                  </select>
                  <input
                    value={addValue}
                    onChange={(e) => setAddValue(e.target.value)}
                    placeholder="Reference / value (optional)"
                    className="h-9 flex-1 rounded-lg border border-black/[0.09] bg-white px-2.5 text-[0.8rem] text-[#1a1a1a] outline-none placeholder:text-[#bbb] focus:border-[#E85C1A]"
                  />
                  <button
                    type="button"
                    disabled={busyId === "add"}
                    onClick={addItem}
                    className="flex h-9 items-center gap-1.5 rounded-lg bg-[#E85C1A] px-3 text-[0.78rem] font-semibold text-white transition hover:bg-[#d44d10] disabled:opacity-50"
                  >
                    {busyId === "add" ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Add
                  </button>
                </div>
              </div>
            )}

            {items.length === 0 && !showAdd ? (
              <div className="flex flex-col items-center gap-2 py-6">
                <FileBadge size={22} className="text-[#d1d5db]" />
                <p className="text-[0.83rem] text-[#9ca3af]">No verification items yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-black/[0.05]">
                {items.map((v) => (
                  <div key={v.id} className="flex flex-col gap-1.5 py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[0.83rem] font-semibold text-[#1a1a1a]">
                          {VERIFICATION_TYPE_LABELS[v.type] ?? v.type}
                        </p>
                        {v.value && <p className="truncate text-[0.75rem] text-[#5c5e62]">{v.value}</p>}
                      </div>
                      <span className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[0.65rem] font-bold ${VERIFICATION_STATUS_STYLES[v.status] ?? "bg-gray-100 text-gray-500"}`}>
                        {VERIFICATION_STATUS_LABELS[v.status] ?? v.status}
                      </span>
                    </div>

                    {v.notes && <p className="text-[0.72rem] italic text-[#9ca3af]">{v.notes}</p>}

                    {rejectingId === v.id ? (
                      <div className="flex flex-col gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5">
                        <textarea
                          value={rejectNotes}
                          onChange={(e) => setRejectNotes(e.target.value)}
                          rows={2}
                          placeholder="Reason for rejection…"
                          className="w-full resize-none rounded-lg border border-black/[0.09] bg-white px-2.5 py-1.5 text-[0.78rem] text-[#1a1a1a] outline-none placeholder:text-[#bbb] focus:border-red-400"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={busyId === v.id}
                            onClick={() => patchStatus(v, "rejected", rejectNotes.trim() || undefined)}
                            className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-[0.75rem] font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                          >
                            {busyId === v.id ? <Loader2 size={11} className="animate-spin" /> : <X size={11} />} Confirm Reject
                          </button>
                          <button
                            type="button"
                            onClick={() => { setRejectingId(null); setRejectNotes(""); }}
                            className="rounded-lg border border-black/[0.1] px-3 py-1.5 text-[0.75rem] font-semibold text-[#5c5e62] transition hover:bg-[#f0f2f5]"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        {v.status !== "verified" && (
                          <button
                            type="button"
                            disabled={busyId === v.id}
                            onClick={() => patchStatus(v, "verified")}
                            className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[0.72rem] font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
                          >
                            {busyId === v.id ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle2 size={11} />} Mark Verified
                          </button>
                        )}
                        {v.status !== "rejected" && (
                          <button
                            type="button"
                            disabled={busyId === v.id}
                            onClick={() => { setRejectingId(v.id); setRejectNotes(""); }}
                            className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-2.5 py-1 text-[0.72rem] font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                          >
                            <X size={11} /> Reject
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
