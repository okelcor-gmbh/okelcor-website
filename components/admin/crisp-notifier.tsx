"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MessageCircle, X } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type Convo = {
  session_id: string;
  updated_at: number;
  state: string;
  last_message?: { content?: string; from?: string };
  participants?: { nickname?: string; email?: string }[];
};

type Toast = { id: number; name: string; preview: string };

// ── Audio ─────────────────────────────────────────────────────────────────────

function playDing() {
  try {
    type WebkitWin = typeof window & { webkitAudioContext: typeof AudioContext };
    const Ctx = window.AudioContext ?? (window as WebkitWin).webkitAudioContext;
    const ctx = new Ctx();

    const note = (freq: number, start: number, dur: number, vol: number) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(vol, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur);
    };

    note(880,  0,    0.35, 0.28); // A5
    note(1318, 0.18, 0.45, 0.18); // E6

    setTimeout(() => { ctx.close().catch(() => {}); }, 1500);
  } catch {
    // AudioContext blocked or unavailable — silently skip
  }
}

// ── Notifier (polling + toast) ────────────────────────────────────────────────

const POLL_MS = 20_000;

export default function CrispNotifier({
  onPendingCount,
}: {
  onPendingCount?: (n: number) => void;
}) {
  const seenRef    = useRef<Map<string, number>>(new Map());
  const isFirstRef = useRef(true);
  const toastId    = useRef(0);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const poll = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/crisp?action=conversations", { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json();
      if (!Array.isArray(json?.data)) return;

      const all: Convo[] = json.data;
      const open = all.filter(c => c.state !== "resolved");

      // Update pending badge count for sidebar
      onPendingCount?.(open.filter(c => c.state === "pending").length);

      if (isFirstRef.current) {
        // Seed map on first load — no alerts for existing conversations
        open.forEach(c => seenRef.current.set(c.session_id, c.updated_at));
        isFirstRef.current = false;
        return;
      }

      const newToasts: Toast[] = [];

      open.forEach(c => {
        const prev      = seenRef.current.get(c.session_id);
        const isNew     = prev === undefined;
        const isUpdated = prev !== undefined && c.updated_at > prev;
        // Only alert for visitor messages, not operator replies
        const fromVisitor = c.last_message?.from !== "operator";

        if ((isNew || isUpdated) && fromVisitor) {
          const name    = c.participants?.[0]?.nickname
                       ?? c.participants?.[0]?.email
                       ?? "Visitor";
          const preview = typeof c.last_message?.content === "string"
            ? c.last_message.content.slice(0, 90)
            : "New message";
          newToasts.push({ id: ++toastId.current, name, preview });
        }

        seenRef.current.set(c.session_id, c.updated_at);
      });

      if (newToasts.length > 0) {
        playDing();
        setToasts(prev => [...prev, ...newToasts].slice(-4)); // cap at 4 visible
      }
    } catch {
      // Network error — silently skip
    }
  }, [onPendingCount]);

  useEffect(() => {
    void poll();
    const t = setInterval(() => void poll(), POLL_MS);
    return () => clearInterval(t);
  }, [poll]);

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-[200] flex flex-col-reverse gap-2"
    >
      {toasts.map(t => (
        <ToastCard key={t.id} toast={t} onDismiss={dismiss} />
      ))}
    </div>
  );
}

// ── Toast card ────────────────────────────────────────────────────────────────

const AUTO_DISMISS_MS = 8000;

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: number) => void;
}) {
  // Auto-dismiss after 8 seconds
  useEffect(() => {
    const t = setTimeout(() => onDismiss(toast.id), AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [toast.id, onDismiss]);

  // Progress bar width (100 → 0 over 8 seconds via CSS)
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
      {/* Keyframe for smooth entry — injected once per component tree */}
      <style>{`
        @keyframes crispSlideIn {
          from { opacity: 0; transform: translateX(16px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      <div
        className="relative flex w-[300px] items-start gap-3 overflow-hidden rounded-xl border border-black/[0.07] bg-white p-4 shadow-[0_8px_32px_rgba(0,0,0,0.14)]"
        style={{ animation: "crispSlideIn 0.25s ease-out forwards" }}
      >
        {/* Orange left accent stripe */}
        <div className="absolute left-0 top-0 h-full w-1 bg-[#f4511e]" />

        {/* Icon */}
        <div className="ml-1 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f4511e]/10">
          <MessageCircle size={16} className="text-[#f4511e]" />
        </div>

        {/* Body */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-1">
            <div>
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.13em] text-[#f4511e]">
                New Message
              </p>
              <p className="mt-0.5 text-[0.82rem] font-semibold text-[#1a1a1a]">
                {toast.name}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label="Dismiss notification"
              className="mt-0.5 shrink-0 rounded p-0.5 text-[#9ca3af] transition hover:bg-[#f0f2f5] hover:text-[#1a1a1a]"
            >
              <X size={13} strokeWidth={2} />
            </button>
          </div>

          <p className="mt-1.5 line-clamp-2 text-[0.73rem] leading-[1.5] text-[#5c5e62]">
            {toast.preview}
          </p>

          <Link
            href="/admin/chats"
            onClick={() => onDismiss(toast.id)}
            className="mt-2.5 inline-flex items-center gap-1 text-[0.75rem] font-semibold text-[#f4511e] transition hover:underline"
          >
            Open chat →
          </Link>
        </div>

        {/* Auto-dismiss progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#f0f2f5]">
          <div
            ref={progressRef}
            className="h-full bg-[#f4511e] opacity-50"
            style={{ width: "100%" }}
          />
        </div>
      </div>
    </>
  );
}
