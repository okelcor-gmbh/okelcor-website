"use client";

import { useState, useEffect, useCallback } from "react";
import { Lock, ShoppingCart, FileText, Tag, Check, Loader2, AlertCircle } from "lucide-react";
import { REQUESTED_ACCESS_LABELS, type RequestedAccess, type AccessRequest } from "@/lib/crm8";

interface Props {
  approvedForCheckout?: boolean;
  approvedForDocuments?: boolean;
  approvedForWholesalePricing?: boolean;
}

interface RequestableItem {
  key: RequestedAccess;
  icon: React.ElementType;
  title: string;
  description: string;
}

const ICON: Record<string, React.ElementType> = {
  checkout: ShoppingCart,
  documents: FileText,
  wholesale_pricing: Tag,
};

export default function AccessRequestsPanel({
  approvedForCheckout,
  approvedForDocuments,
  approvedForWholesalePricing,
}: Props) {
  // Safety rule: undefined flag = pre-CRM-8 backfill → treat as already granted.
  // Only surface a request when a permission is EXPLICITLY withheld (=== false).
  const missing: RequestableItem[] = [
    approvedForCheckout === false && {
      key: "checkout" as const, icon: ICON.checkout,
      title: "Checkout Approval",
      description: "Request approval to place orders directly at checkout.",
    },
    approvedForDocuments === false && {
      key: "documents" as const, icon: ICON.documents,
      title: "Trade Documents",
      description: "Request access to invoices, packing lists, and shipment documents.",
    },
    approvedForWholesalePricing === false && {
      key: "wholesale_pricing" as const, icon: ICON.wholesale_pricing,
      title: "Wholesale Pricing",
      description: "Request wholesale pricing for dealer and distributor volumes.",
    },
  ].filter(Boolean) as RequestableItem[];

  const [requested, setRequested] = useState<Record<string, "pending" | "approved" | "rejected">>({});
  const [busy, setBusy]   = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load the customer's existing requests so buttons reflect prior submissions.
  const loadExisting = useCallback(async () => {
    try {
      const res = await fetch("/api/account/access-requests", { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json().catch(() => ({})) as Record<string, unknown>;
      const list = (Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : []) as AccessRequest[];
      const map: Record<string, "pending" | "approved" | "rejected"> = {};
      for (const r of list) {
        if (r.status === "pending" || r.status === "approved" || r.status === "rejected") {
          map[r.requested_access] = r.status;
        }
      }
      setRequested(map);
    } catch { /* graceful — buttons simply default to requestable */ }
  }, []);

  useEffect(() => { if (missing.length > 0) loadExisting(); }, [missing.length, loadExisting]);

  async function request(item: RequestableItem) {
    setBusy(item.key); setError(null);
    try {
      const res = await fetch("/api/account/access-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requested_access: item.key }),
      });
      if (res.ok) {
        setRequested((prev) => ({ ...prev, [item.key]: "pending" }));
      } else {
        const json = await res.json().catch(() => ({})) as Record<string, unknown>;
        setError((json.message as string) ?? "Could not submit your request. Please try again.");
      }
    } catch {
      setError("Network error — please try again.");
    } finally { setBusy(null); }
  }

  if (missing.length === 0) return null;

  return (
    <div className="mt-6 rounded-[20px] border border-black/[0.06] bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
      <div className="mb-1 flex items-center gap-2">
        <Lock size={14} strokeWidth={1.9} className="text-[var(--primary)]" />
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--muted)]">Request Access</p>
      </div>
      <p className="mb-4 text-[0.85rem] text-[var(--muted)]">
        Some features need approval from our team. Request access and we&apos;ll review it shortly.
      </p>

      {error && (
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[0.82rem] text-red-700">
          <AlertCircle size={14} className="shrink-0" /> {error}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {missing.map((item) => {
          const state = requested[item.key];
          const Icon = item.icon;
          return (
            <div key={item.key} className="flex flex-col gap-3 rounded-2xl border border-black/[0.07] bg-[#fafafa] p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">
                <Icon size={18} strokeWidth={1.8} className="text-[var(--primary)]" />
              </div>
              <div className="flex-1">
                <p className="text-[0.9rem] font-bold text-[var(--foreground)]">{item.title}</p>
                <p className="mt-0.5 text-[0.78rem] leading-snug text-[var(--muted)]">{item.description}</p>
              </div>
              {state === "pending" ? (
                <span className="inline-flex items-center justify-center gap-1.5 rounded-full bg-amber-100 px-3 py-2 text-[0.8rem] font-semibold text-amber-700">
                  <Check size={13} /> Request Pending
                </span>
              ) : state === "approved" ? (
                <span className="inline-flex items-center justify-center gap-1.5 rounded-full bg-emerald-100 px-3 py-2 text-[0.8rem] font-semibold text-emerald-700">
                  <Check size={13} /> Approved
                </span>
              ) : (
                <button
                  type="button"
                  disabled={busy === item.key}
                  onClick={() => request(item)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[var(--primary)] px-4 py-2 text-[0.82rem] font-semibold text-white transition hover:bg-[var(--primary-hover)] disabled:opacity-50"
                >
                  {busy === item.key ? <Loader2 size={13} className="animate-spin" /> : null}
                  Request {REQUESTED_ACCESS_LABELS[item.key].replace(" Approval", "").replace("Trade ", "")}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
