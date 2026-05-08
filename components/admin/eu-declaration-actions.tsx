"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Download, CheckCheck } from "lucide-react";

type Status = "pending" | "signed" | "acknowledged";

interface Props {
  id: number;
  initialStatus: Status;
  initialAcknowledgedAt?: string | null;
  orderRef: string;
}

const BANNER: Record<Status, string> = {
  pending:      "border-amber-200 bg-amber-50",
  signed:       "border-blue-200 bg-blue-50",
  acknowledged: "border-emerald-200 bg-emerald-50",
};

const BADGE: Record<Status, string> = {
  pending:      "bg-amber-100 text-amber-700",
  signed:       "bg-blue-100 text-blue-700",
  acknowledged: "bg-emerald-100 text-emerald-700",
};

const LABEL: Record<Status, string> = {
  pending:      "Pending — awaiting customer signature",
  signed:       "Signed — awaiting admin acknowledgement",
  acknowledged: "Acknowledged — compliance review completed.",
};

const TEXT: Record<Status, string> = {
  pending:      "text-amber-800",
  signed:       "text-blue-800",
  acknowledged: "text-emerald-800",
};

export default function EuDeclarationActions({ id, initialStatus, initialAcknowledgedAt, orderRef }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>(initialStatus);
  const [adminAcknowledgedAt, setAdminAcknowledgedAt] = useState<string | null>(
    initialAcknowledgedAt ?? null
  );
  const [downloading, setDownloading] = useState(false);
  const [acknowledging, setAcknowledging] = useState(false);
  const [ackError, setAckError] = useState<string | null>(null);

  // Sync both status and acknowledged timestamp from server after router.refresh().
  // If the backend persisted the change, initialStatus becomes "acknowledged" and
  // initialAcknowledgedAt is set — both sync here. If not, state reverts and the
  // Acknowledge button reappears, making the failure visible.
  useEffect(() => {
    setStatus(initialStatus);
    setAdminAcknowledgedAt(initialAcknowledgedAt ?? null);
  }, [initialStatus, initialAcknowledgedAt]);

  async function handleDownload() {
    setDownloading(true);
    try {
      const res = await fetch(`/api/admin/eu-declarations/${id}/download`);
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `EU-Certificate-${orderRef}.pdf`;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // silently fail — user can retry
    } finally {
      setDownloading(false);
    }
  }

  async function handleAcknowledge() {
    setAcknowledging(true);
    setAckError(null);
    try {
      const res = await fetch(`/api/admin/eu-declarations/${id}/acknowledge`, {
        method: "PATCH",
      });
      if (res.ok) {
        setStatus("acknowledged");
        setAdminAcknowledgedAt(new Date().toISOString());
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({})) as { message?: string };
        setAckError(data.message ?? "Failed to acknowledge. Please try again.");
      }
    } catch {
      setAckError("Network error. Please try again.");
    } finally {
      setAcknowledging(false);
    }
  }

  // Use admin_acknowledged_at as an additional source of truth — the backend may
  // set this field even if the status field has a sync lag.
  const isAcknowledged = status === "acknowledged" || adminAcknowledgedAt != null;
  const effectiveStatus: Status = isAcknowledged ? "acknowledged" : status;

  const canDownload = effectiveStatus === "signed" || effectiveStatus === "acknowledged";
  const canAcknowledge = !isAcknowledged && status === "signed";

  return (
    <div className={`flex flex-col gap-4 rounded-2xl border px-5 py-5 ${BANNER[effectiveStatus]}`}>

      {/* Status badge + label */}
      <div className="flex items-center gap-3">
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-[0.75rem] font-bold capitalize ${BADGE[effectiveStatus]}`}>
          {effectiveStatus}
        </span>
        <p className={`text-[0.875rem] font-semibold ${TEXT[effectiveStatus]}`}>
          {LABEL[effectiveStatus]}
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">

          {canDownload && (
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="inline-flex items-center gap-2 rounded-full border border-[#E85C1A]/30 bg-white px-4 py-2 text-[0.83rem] font-semibold text-[#E85C1A] transition hover:bg-[#fff5f2] disabled:opacity-60"
            >
              <Download size={14} strokeWidth={2.2} />
              {downloading ? "Downloading…" : "Download Certificate"}
            </button>
          )}

          {canAcknowledge && (
            <button
              type="button"
              onClick={handleAcknowledge}
              disabled={acknowledging}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-[0.83rem] font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
            >
              <CheckCheck size={14} strokeWidth={2.2} />
              {acknowledging ? "Acknowledging…" : "Acknowledge Declaration"}
            </button>
          )}

        </div>

        {ackError && (
          <p className="text-[0.8rem] text-red-600">{ackError}</p>
        )}
      </div>

    </div>
  );
}
