"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Sparkles, X } from "lucide-react";
import type { AdminInsight } from "@/lib/admin-api";
import { severityStyle, categoryLabel, renderInsightDetail } from "@/lib/admin-insights";

// ── AI-generated insights: topbar bell + dropdown + toast popups ──────────────
// Single poll drives both surfaces. Backend endpoint (docs/BACKEND_NOTE_ai_insights.md)
// doesn't exist yet — /api/admin/insights degrades to an empty list, so this
// renders nothing until it's live. No frontend deploy needed to activate.

const POLL_MS = 120_000; // backend refreshes its own cache every 10–15 min
const SEEN_KEY = "okelcor-admin-seen-insights";
const MAX_TOASTS = 2;

function loadSeen(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function saveSeen(ids: Set<string>) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...ids].slice(-200)));
  } catch {
    // Storage unavailable — non-critical, just means toasts may repeat
  }
}

export default function InsightsBell() {
  const [open, setOpen] = useState(false);
  const [insights, setInsights] = useState<AdminInsight[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [toastQueue, setToastQueue] = useState<AdminInsight[]>([]);
  const seenRef = useRef<Set<string>>(loadSeen());
  const isFirstRef = useRef(true);
  const ref = useRef<HTMLDivElement>(null);

  const poll = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/insights", { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json().catch(() => null);
      const data: AdminInsight[] = Array.isArray(json?.data) ? json.data : [];
      setInsights(data);

      if (isFirstRef.current) {
        // Seed the seen-set on first load — no toast burst for pre-existing insights
        data.forEach((i) => seenRef.current.add(i.id));
        saveSeen(seenRef.current);
        isFirstRef.current = false;
        return;
      }

      const fresh = data.filter((i) => !seenRef.current.has(i.id));
      if (fresh.length > 0) {
        fresh.forEach((i) => seenRef.current.add(i.id));
        saveSeen(seenRef.current);
        setToastQueue((prev) => [...prev, ...fresh].slice(-MAX_TOASTS));
      }
    } catch {
      // Network error — silently skip
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount + poll, same pattern as cart-context.tsx
    void poll();
    const t = setInterval(() => void poll(), POLL_MS);
    return () => clearInterval(t);
  }, [poll]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToastQueue((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismiss = useCallback((id: string) => {
    setDismissedIds((prev) => new Set(prev).add(id));
  }, []);

  const visible = insights.filter((i) => !dismissedIds.has(i.id));

  return (
    <>
      <div className="relative" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Insights"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-[#1a1a1a] transition hover:bg-[#f0f2f5]"
        >
          <Sparkles size={17} strokeWidth={1.8} />
          {visible.length > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#E85C1A] px-1 text-[9px] font-extrabold text-white">
              {visible.length > 9 ? "9+" : visible.length}
            </span>
          )}
        </button>

        {open && (
          <div className="absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-2xl border border-black/[0.08] bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-black/[0.06] px-4 py-3">
              <p className="text-[0.83rem] font-bold text-[#1a1a1a]">Insights</p>
              {visible.length > 0 && (
                <button
                  type="button"
                  onClick={() => setDismissedIds(new Set(insights.map((i) => i.id)))}
                  className="text-[0.72rem] font-semibold text-[#E85C1A] transition hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {visible.length === 0 ? (
                <p className="px-4 py-6 text-center text-[0.8rem] text-[#9ca3af]">
                  Nothing to flag right now.
                </p>
              ) : (
                visible.map((i) => (
                  <InsightRow key={i.id} insight={i} onDismiss={dismiss} onNavigate={() => setOpen(false)} />
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {toastQueue.length > 0 && (
        <div role="status" aria-live="polite" className="fixed top-20 right-4 z-[190] flex flex-col gap-2">
          {toastQueue.map((i) => (
            <InsightToast key={i.id} insight={i} onDismiss={dismissToast} />
          ))}
        </div>
      )}
    </>
  );
}

// ── Dropdown row ────────────────────────────────────────────────────────────────

function InsightRow({
  insight,
  onDismiss,
  onNavigate,
}: {
  insight: AdminInsight;
  onDismiss: (id: string) => void;
  onNavigate: () => void;
}) {
  const sev = severityStyle(insight.severity);

  const inner = (
    <div className="flex items-start gap-2.5 px-4 py-3 text-left transition hover:bg-[#f0f2f5]">
      <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${sev.chip}`}>
        <Sparkles size={13} className={sev.icon} />
      </span>
      <div className="min-w-0 flex-1">
        <p className={`text-[0.64rem] font-bold uppercase tracking-[0.1em] ${sev.icon}`}>
          {categoryLabel(insight.category)}
        </p>
        <p className="mt-0.5 text-[0.82rem] font-semibold text-[#1a1a1a]">{insight.headline}</p>
        <p className="mt-0.5 line-clamp-2 text-[0.76rem] leading-[1.5] text-[#5c5e62]">
          {renderInsightDetail(insight.detail)}
        </p>
      </div>
    </div>
  );

  return (
    <div className="group relative">
      {insight.action_url ? (
        <Link href={insight.action_url} onClick={onNavigate} className="block">
          {inner}
        </Link>
      ) : (
        inner
      )}
      <button
        type="button"
        aria-label="Dismiss insight"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDismiss(insight.id);
        }}
        className="absolute right-2 top-2 hidden h-6 w-6 items-center justify-center rounded-md text-[#9ca3af] transition hover:bg-black/[0.06] hover:text-[#1a1a1a] group-hover:flex"
      >
        <X size={13} strokeWidth={2} />
      </button>
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────

const AUTO_DISMISS_MS = 9000;

function InsightToast({
  insight,
  onDismiss,
}: {
  insight: AdminInsight;
  onDismiss: (id: string) => void;
}) {
  const sev = severityStyle(insight.severity);

  useEffect(() => {
    const t = setTimeout(() => onDismiss(insight.id), AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [insight.id, onDismiss]);

  const progressRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = progressRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.style.transition = `width ${AUTO_DISMISS_MS}ms linear`;
      el.style.width = "0%";
    });
  }, []);

  return (
    <>
      <style>{`
        @keyframes insightSlideIn {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div
        className="relative flex w-[320px] items-start gap-3 overflow-hidden rounded-2xl border border-black/[0.08] bg-white p-4 shadow-[0_12px_32px_rgba(0,0,0,0.14)]"
        style={{ animation: "insightSlideIn 0.25s ease-out forwards" }}
      >
        <div className={`absolute left-0 top-0 h-full w-1 ${sev.bar}`} />

        <div className={`ml-1 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${sev.chip}`}>
          <Sparkles size={16} className={sev.icon} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-1">
            <p className={`text-[0.64rem] font-bold uppercase tracking-[0.12em] ${sev.icon}`}>
              {categoryLabel(insight.category)} insight
            </p>
            <button
              type="button"
              onClick={() => onDismiss(insight.id)}
              aria-label="Dismiss insight"
              className="mt-0.5 shrink-0 rounded p-0.5 text-[#9ca3af] transition hover:bg-[#f0f2f5] hover:text-[#1a1a1a]"
            >
              <X size={13} strokeWidth={2} />
            </button>
          </div>

          <p className="mt-1 text-[0.83rem] font-semibold text-[#1a1a1a]">{insight.headline}</p>
          <p className="mt-1 line-clamp-2 text-[0.75rem] leading-[1.5] text-[#5c5e62]">
            {renderInsightDetail(insight.detail)}
          </p>

          {insight.action_url && (
            <Link
              href={insight.action_url}
              onClick={() => onDismiss(insight.id)}
              className="mt-2 inline-flex items-center gap-1 text-[0.75rem] font-semibold text-[#E85C1A] transition hover:underline"
            >
              View →
            </Link>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#f0f2f5]">
          <div ref={progressRef} className={`h-full opacity-50 ${sev.bar}`} style={{ width: "100%" }} />
        </div>
      </div>
    </>
  );
}
