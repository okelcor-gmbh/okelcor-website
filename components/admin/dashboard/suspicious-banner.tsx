"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldAlert, X } from "lucide-react";

type Summary = { suspicious_accounts: number; locked_today: number; _unavailable?: boolean };

export default function SuspiciousBanner() {
  const [data, setData]       = useState<Summary | null>(null);
  const [dismissed, setDismiss] = useState(false);

  useEffect(() => {
    fetch("/api/admin/security/summary", { cache: "no-store" })
      .then(r => r.ok ? r.json() : null).then(j => { if (j) setData(j); }).catch(() => null);
  }, []);

  if (dismissed || !data || data._unavailable) return null;
  if (data.suspicious_accounts === 0 && data.locked_today === 0) return null;

  return (
    <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-3.5">
      <ShieldAlert size={18} className="shrink-0 text-red-600" />
      <div className="min-w-0 flex-1">
        <p className="text-[0.875rem] font-bold text-red-800">
          Security alert — suspicious activity detected
        </p>
        <p className="text-[0.78rem] text-red-700">
          {data.suspicious_accounts > 0 && (
            <span>{data.suspicious_accounts} account{data.suspicious_accounts !== 1 ? "s" : ""} flagged for suspicious login activity. </span>
          )}
          {data.locked_today > 0 && (
            <span>{data.locked_today} account{data.locked_today !== 1 ? "s" : ""} locked today. </span>
          )}
        </p>
      </div>
      <Link
        href="/admin/security"
        className="shrink-0 rounded-xl bg-red-600 px-3.5 py-1.5 text-[0.78rem] font-bold text-white transition hover:bg-red-700"
      >
        Review now
      </Link>
      <button type="button" onClick={() => setDismiss(true)} className="shrink-0 text-red-400 hover:text-red-600">
        <X size={16} />
      </button>
    </div>
  );
}
