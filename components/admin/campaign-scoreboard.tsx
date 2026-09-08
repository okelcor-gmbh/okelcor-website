"use client";

/**
 * The campaign feedback tracker — per-marketer scores and per-campaign
 * open/completion rates, from real recipient engagement (open pixel +
 * click redirects on every sent campaign).
 */

import { useCallback, useEffect, useState, useTransition } from "react";
import { AlertTriangle, Award, Loader2, Mail, RefreshCw } from "lucide-react";
import {
  getScoreboard,
  type CampaignScore, type MarketerScore, type ScoreboardMeta,
} from "@/app/admin/campaign-scores/actions";

const scoreCls = (score: number | null) =>
  score === null ? "bg-gray-100 text-gray-500"
  : score >= 30 ? "bg-emerald-100 text-emerald-700"
  : score >= 12 ? "bg-amber-100 text-amber-700"
  : "bg-red-100 text-red-700";

const pct = (n: number | null) => (n === null ? "—" : `${n}%`);

export default function CampaignScoreboard() {
  const [campaigns, setCampaigns] = useState<CampaignScore[]>([]);
  const [marketers, setMarketers] = useState<MarketerScore[]>([]);
  const [meta, setMeta]           = useState<ScoreboardMeta | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [, startTransition]       = useTransition();

  const load = useCallback(() => {
    startTransition(async () => {
      const res = await getScoreboard();
      if (res.error || !res.campaigns) { setError(res.error ?? "Failed to load."); setLoading(false); return; }
      setCampaigns(res.campaigns);
      setMarketers(res.marketers ?? []);
      setMeta(res.meta ?? null);
      setError(null);
      setLoading(false);
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 size={22} className="animate-spin text-[#f4511e]" /></div>;
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
        <AlertTriangle size={32} className="mb-3 text-amber-400" strokeWidth={1.5} />
        <p className="mb-1 text-[1rem] font-bold text-[#1a1a1a]">Scoreboard unavailable</p>
        <p className="mb-5 max-w-sm text-[0.83rem] text-[#6b7280]">{error}</p>
        <button type="button" onClick={() => { setLoading(true); load(); }}
          className="flex items-center gap-2 rounded-full bg-[#f4511e] px-5 py-2.5 text-[0.85rem] font-semibold text-white transition hover:bg-[#df4618]">
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Award size={18} className="text-[#f4511e]" strokeWidth={2} />
          <div>
            <h1 className="text-[1.15rem] font-extrabold text-[#1a1a1a]">Campaign Scores</h1>
            <p className="text-[0.8rem] text-[#6b7280]">{meta?.score_formula}</p>
          </div>
        </div>
        <button type="button" onClick={() => { setLoading(true); load(); }}
          className="flex items-center gap-2 rounded-full bg-[#1a1a1a] px-4 py-2 text-[0.8rem] font-semibold text-white transition hover:bg-[#333]">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Marketer leaderboard */}
      {marketers.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-2.5 text-[0.875rem] font-extrabold text-[#1a1a1a]">Marketers</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {marketers.map((m, i) => (
              <div key={m.name} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/[0.06]">
                <div className="flex items-center justify-between">
                  <p className="text-[0.9rem] font-extrabold text-[#1a1a1a]">{i === 0 && "🏆 "}{m.name}</p>
                  <span className={`rounded-full px-2.5 py-0.5 text-[0.8rem] font-extrabold ${scoreCls(m.score)}`}>{m.score}</span>
                </div>
                <p className="mt-1 text-[0.75rem] text-[#6b7280]">
                  {m.campaigns} campaign(s) · {m.delivered} delivered
                </p>
                <p className="mt-1.5 text-[0.75rem]">
                  <span className="font-semibold">{pct(m.open_rate)}</span> <span className="text-[#9ca3af]">opened</span>
                  <span className="mx-1.5 text-[#d1d5db]">·</span>
                  <span className="font-semibold">{pct(m.completion_rate)}</span> <span className="text-[#9ca3af]">clicked through</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Campaigns */}
      <h2 className="mb-2.5 text-[0.875rem] font-extrabold text-[#1a1a1a]">Campaigns</h2>
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.06]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-[0.8rem]">
            <thead>
              <tr className="border-b border-black/[0.08] bg-[#f8f9fa] text-[#6b7280]">
                <th className="px-3 py-2.5 font-bold">Campaign</th>
                <th className="px-3 py-2.5 font-bold">By</th>
                <th className="px-3 py-2.5 text-right font-bold">Delivered</th>
                <th className="px-3 py-2.5 text-right font-bold">Opened</th>
                <th className="px-3 py-2.5 text-right font-bold">Open rate</th>
                <th className="px-3 py-2.5 text-right font-bold">Clicked</th>
                <th className="px-3 py-2.5 text-right font-bold">Completion</th>
                <th className="px-3 py-2.5 text-right font-bold">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {campaigns.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-[#9ca3af]">No campaigns yet.</td></tr>
              )}
              {campaigns.map((c) => (
                <tr key={c.id}>
                  <td className="max-w-[260px] px-3 py-2.5">
                    <p className="truncate font-semibold text-[#1a1a1a]" title={c.subject}>{c.subject}</p>
                    <p className="text-[0.68rem] text-[#9ca3af]">
                      {c.created_at ? new Date(c.created_at).toLocaleDateString() : ""} · {c.status}
                      {!c.tracked && " · sent before tracking existed"}
                    </p>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-[#5c5e62]">{c.created_by ?? "—"}</td>
                  <td className="px-3 py-2.5 text-right font-mono">{c.delivered}</td>
                  <td className="px-3 py-2.5 text-right font-mono">{c.tracked ? c.opened : "—"}</td>
                  <td className="px-3 py-2.5 text-right font-mono">{pct(c.open_rate)}</td>
                  <td className="px-3 py-2.5 text-right font-mono">{c.tracked ? c.clicked : "—"}</td>
                  <td className="px-3 py-2.5 text-right font-mono">{pct(c.completion_rate)}</td>
                  <td className="px-3 py-2.5 text-right">
                    <span className={`rounded-full px-2.5 py-0.5 text-[0.75rem] font-extrabold ${scoreCls(c.score)}`}>
                      {c.score ?? "—"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-4 flex items-start gap-2 text-[0.72rem] text-[#9ca3af]">
        <Mail size={13} className="mt-0.5 shrink-0" />
        <span>{meta?.caveats} Tracking starts with the first campaign sent after this feature deployed — older campaigns show as untracked, not as zero.</span>
      </p>
    </div>
  );
}
