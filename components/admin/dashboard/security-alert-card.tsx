"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ShieldAlert, Lock, AlertTriangle, UserPlus } from "lucide-react";

type Summary = {
  locked_today: number;
  failed_attempts_today: number;
  new_registrations_today: number;
  suspicious_accounts: number;
  _unavailable?: boolean;
};

export default function SecurityAlertCard() {
  const [data, setData]    = useState<Summary | null>(null);
  const [loading, setLoad] = useState(true);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/admin/security/summary", { cache: "no-store" })
      .then(r => r.ok ? r.json() : null).catch(() => null);
    if (res) setData(res);
    setLoad(false);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount, same pattern as cart-context.tsx
  useEffect(() => { refresh(); }, [refresh]);

  const items = [
    {
      icon:  Lock,
      label: "Accounts Locked Today",
      value: data?.locked_today ?? 0,
      color: data?.locked_today ? "text-red-600" : "text-[#1a1a1a]",
      bg:    "bg-red-50",
      iconC: "text-red-500",
    },
    {
      icon:  AlertTriangle,
      label: "Failed Attempts Today",
      value: data?.failed_attempts_today ?? 0,
      color: (data?.failed_attempts_today ?? 0) > 20 ? "text-amber-700" : "text-[#1a1a1a]",
      bg:    "bg-amber-50",
      iconC: "text-amber-500",
    },
    {
      icon:  UserPlus,
      label: "New Registrations Today",
      value: data?.new_registrations_today ?? 0,
      color: "text-emerald-700",
      bg:    "bg-emerald-50",
      iconC: "text-emerald-500",
    },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white">
      <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-4">
        <div className="flex items-center gap-2.5">
          <ShieldAlert size={15} className="text-[#5c5e62]" />
          <p className="text-[0.9rem] font-bold text-[#1a1a1a]">Security Overview</p>
        </div>
        <Link href="/admin/security" className="text-[0.75rem] font-semibold text-[#E85C1A] hover:underline">
          View log →
        </Link>
      </div>

      {data?._unavailable ? (
        <div className="px-5 py-8 text-center">
          <ShieldAlert size={28} className="mx-auto mb-2 text-[#d1d5db]" />
          <p className="text-[0.83rem] text-[#9ca3af]">Security API not yet configured on the backend.</p>
          <p className="mt-1 text-[0.72rem] text-[#9ca3af]">Implement GET /admin/security/summary</p>
        </div>
      ) : (
        <div className="divide-y divide-black/[0.04]">
          {items.map(({ icon: Icon, label, value, color, bg, iconC }) => (
            <div key={label} className="flex items-center gap-4 px-5 py-3.5">
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${bg}`}>
                <Icon size={16} className={iconC} />
              </div>
              <div className="flex-1">
                <p className="text-[0.72rem] text-[#5c5e62]">{label}</p>
                {loading ? (
                  <div className="mt-1 h-5 w-10 animate-pulse rounded bg-[#e5e7eb]" />
                ) : (
                  <p className={`text-[1.1rem] font-bold tabular-nums ${color}`}>{value}</p>
                )}
              </div>
            </div>
          ))}
          {!loading && (data?.suspicious_accounts ?? 0) > 0 && (
            <div className="flex items-center gap-3 border-t border-red-100 bg-red-50 px-5 py-3">
              <AlertTriangle size={14} className="shrink-0 text-red-600" />
              <p className="flex-1 text-[0.78rem] font-semibold text-red-700">
                {data!.suspicious_accounts} account{data!.suspicious_accounts !== 1 ? "s" : ""} flagged for suspicious activity
              </p>
              <Link href="/admin/security" className="text-[0.75rem] font-bold text-red-600 hover:underline">
                Review
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
