"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, AlertTriangle, CheckCircle2, Loader2, ShieldAlert } from "lucide-react";

type SentryStats = {
  configured: boolean;
  unresolved: number | null;
  last24h:    number | null;
  topIssue:   { title: string; count: number; id: string } | null;
  sentryUrl?: string;
  error?:     string;
};

function Skeleton() {
  return (
    <div className="space-y-3 p-5">
      <div className="h-3 w-28 animate-pulse rounded bg-[#e5e7eb]" />
      <div className="h-7 w-16 animate-pulse rounded bg-[#e5e7eb]" />
      <div className="h-3 w-40 animate-pulse rounded bg-[#e5e7eb]" />
    </div>
  );
}

function StatPill({
  label,
  value,
  urgent,
}: {
  label:   string;
  value:   number | null;
  urgent?: boolean;
}) {
  return (
    <div className={`flex flex-col items-center rounded-xl px-3 py-2 ${urgent && (value ?? 0) > 0 ? "bg-red-50" : "bg-[#fafafa]"}`}>
      <p className={`text-xl font-bold tabular-nums ${urgent && (value ?? 0) > 0 ? "text-red-600" : "text-[#1a1a1a]"}`}>
        {value === null ? "—" : value.toLocaleString()}
      </p>
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-[#5c5e62]">{label}</p>
    </div>
  );
}

const REFRESH = 60_000;

export default function SentryCard() {
  const [data,    setData]    = useState<SentryStats | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/admin/sentry/stats", { cache: "no-store" })
      .then(r => r.ok ? r.json() : null)
      .catch(() => null);
    setData(res);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount + poll, same pattern as cart-context.tsx
    void refresh();
    const t = setInterval(() => void refresh(), REFRESH);
    return () => clearInterval(t);
  }, [refresh]);

  const sentryHref = data?.sentryUrl
    ?? `https://sentry.io/organizations/${process.env.NEXT_PUBLIC_SENTRY_ORG ?? "okelcor"}/issues/`;

  return (
    <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#362d59]">
            <ShieldAlert size={14} strokeWidth={1.8} className="text-white" />
          </div>
          <p className="text-[0.9rem] font-bold text-[#1a1a1a]">Error Monitoring</p>
          {!loading && data?.configured && (data?.unresolved ?? 0) === 0 && (
            <CheckCircle2 size={14} className="text-emerald-500" />
          )}
        </div>
        <a
          href={sentryHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 rounded-lg border border-black/[0.09] px-2.5 py-1.5 text-[0.75rem] font-semibold text-[#1a1a1a] transition hover:bg-[#f5f5f7]"
        >
          <ExternalLink size={11} strokeWidth={2} />
          Open Sentry
        </a>
      </div>

      {loading ? (
        <Skeleton />
      ) : !data?.configured ? (
        /* Not configured state */
        <div className="px-5 py-6 text-center">
          <AlertTriangle size={24} className="mx-auto mb-2 text-amber-400" />
          <p className="text-[0.83rem] font-semibold text-[#1a1a1a]">Sentry not configured</p>
          <p className="mt-1 text-[0.75rem] text-[#5c5e62]">
            Add <code className="rounded bg-[#f0f2f5] px-1 text-[0.7rem]">SENTRY_AUTH_TOKEN</code>,{" "}
            <code className="rounded bg-[#f0f2f5] px-1 text-[0.7rem]">SENTRY_ORG</code> and{" "}
            <code className="rounded bg-[#f0f2f5] px-1 text-[0.7rem]">SENTRY_PROJECT</code> to enable.
          </p>
        </div>
      ) : data?.error ? (
        /* API error state */
        <div className="px-5 py-5">
          <p className="text-[0.8rem] text-[#9ca3af]">{data.error}</p>
        </div>
      ) : (
        /* Normal state */
        <div className="p-5">
          {/* Stat pills */}
          <div className="mb-4 grid grid-cols-2 gap-2">
            <StatPill label="Unresolved" value={data?.unresolved ?? null} urgent />
            <StatPill label="Last 24 h"  value={data?.last24h   ?? null} />
          </div>

          {/* Top issue this week */}
          {data?.topIssue ? (
            <div className="rounded-xl border border-black/[0.06] bg-[#fafafa] px-3.5 py-3">
              <p className="mb-1 text-[0.68rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">
                Most frequent · 7 days
              </p>
              <p className="truncate text-[0.8rem] font-semibold text-[#1a1a1a]">
                {data.topIssue.title}
              </p>
              <p className="mt-0.5 text-[0.72rem] tabular-nums text-[#9ca3af]">
                {data.topIssue.count.toLocaleString()} occurrences
              </p>
            </div>
          ) : (data?.unresolved ?? 0) === 0 ? (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3.5 py-3">
              <CheckCircle2 size={15} className="shrink-0 text-emerald-500" />
              <p className="text-[0.8rem] font-semibold text-emerald-700">No unresolved errors</p>
            </div>
          ) : null}
        </div>
      )}

      {/* Footer — loading indicator */}
      {loading && (
        <div className="flex items-center gap-1.5 border-t border-black/[0.04] px-5 py-2.5">
          <Loader2 size={11} className="animate-spin text-[#9ca3af]" />
          <p className="text-[0.72rem] text-[#9ca3af]">Checking Sentry…</p>
        </div>
      )}
    </div>
  );
}
