"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, XCircle } from "lucide-react";

export default function TokenAcceptanceActions({ token }: { token: string }) {
  const [status,       setStatus]       = useState<"pending" | "accepted" | "rejected">("pending");
  const [showReject,   setShowReject]   = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [loading,      setLoading]      = useState<"accept" | "reject" | null>(null);
  const [error,        setError]        = useState<string | null>(null);

  if (status === "accepted") {
    return (
      <div className="flex items-start gap-3.5 rounded-[18px] border border-emerald-200 bg-emerald-50 px-6 py-5">
        <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-emerald-600" />
        <div>
          <p className="text-[0.9rem] font-bold text-emerald-800">Accepted</p>
          <p className="mt-0.5 text-[0.83rem] text-emerald-700">
            Thank you for your confirmation. Okelcor will proceed with your order.
          </p>
        </div>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className="flex items-start gap-3.5 rounded-[18px] border border-gray-200 bg-gray-50 px-6 py-5">
        <XCircle size={20} className="mt-0.5 shrink-0 text-gray-500" />
        <div>
          <p className="text-[0.9rem] font-bold text-gray-700">Declined</p>
          <p className="mt-0.5 text-[0.83rem] text-gray-600">
            You have declined this document. Okelcor will be in touch if further action is required.
          </p>
        </div>
      </div>
    );
  }

  const handleAccept = async () => {
    setLoading("accept");
    setError(null);
    try {
      const res = await fetch(`/api/documents/acceptance/${encodeURIComponent(token)}/accept`, {
        method: "POST",
      });
      if (res.ok) {
        setStatus("accepted");
      } else {
        const json = await res.json().catch(() => ({})) as { message?: string };
        setError(json.message ?? "Failed to accept. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  const handleReject = async () => {
    setLoading("reject");
    setError(null);
    try {
      const res = await fetch(`/api/documents/acceptance/${encodeURIComponent(token)}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rejectReason.trim() ? { reason: rejectReason.trim() } : {}),
      });
      if (res.ok) {
        setStatus("rejected");
      } else {
        const json = await res.json().catch(() => ({})) as { message?: string };
        setError(json.message ?? "Failed to decline. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <p className="text-[0.83rem] text-red-600">{error}</p>
      )}

      {!showReject ? (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleAccept}
            disabled={loading !== null}
            className="inline-flex items-center gap-2 rounded-full bg-[#E85C1A] px-6 py-2.5 text-[0.875rem] font-semibold text-white transition hover:bg-[#d04d15] disabled:opacity-60"
          >
            {loading === "accept"
              ? "Accepting…"
              : <>Accept <ArrowRight size={14} strokeWidth={2.5} /></>
            }
          </button>
          <button
            type="button"
            onClick={() => setShowReject(true)}
            disabled={loading !== null}
            className="inline-flex items-center gap-2 rounded-full border border-black/[0.1] bg-white px-6 py-2.5 text-[0.875rem] font-semibold text-[#1a1a1a] transition hover:bg-[#f5f5f5] disabled:opacity-60"
          >
            Decline
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div>
            <label className="mb-1.5 block text-[0.72rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">
              Reason <span className="font-normal lowercase tracking-normal text-[#9ca3af]">(optional)</span>
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Let us know why you're declining…"
              rows={3}
              className="w-full resize-none rounded-xl border border-black/[0.09] bg-white px-3.5 py-2.5 text-[0.875rem] text-[#1a1a1a] outline-none placeholder:text-[#aaa] transition focus:border-[#E85C1A]/40 focus:ring-2 focus:ring-[#E85C1A]/10"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleReject}
              disabled={loading !== null}
              className="inline-flex items-center gap-2 rounded-full border border-red-300 bg-white px-6 py-2.5 text-[0.875rem] font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
            >
              {loading === "reject" ? "Declining…" : "Confirm Decline"}
            </button>
            <button
              type="button"
              onClick={() => { setShowReject(false); setRejectReason(""); setError(null); }}
              disabled={loading !== null}
              className="inline-flex items-center gap-2 rounded-full border border-black/[0.1] bg-white px-6 py-2.5 text-[0.875rem] font-semibold text-[#1a1a1a] transition hover:bg-[#f5f5f5] disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
