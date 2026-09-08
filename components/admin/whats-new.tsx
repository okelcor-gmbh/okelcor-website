"use client";

/**
 * The What's New button — lives in the admin header beside the bells.
 * Shows a dot while there are updates this person has not read, opens a
 * panel of briefs (each optionally linking to the page it describes),
 * and marks everything seen on open. Entries are role-gated the same
 * way the sidebar is: nobody is told about a page they cannot open.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, X } from "lucide-react";
import { WHATS_NEW, getSeenId, markAllSeen, isUnseen, type WhatsNewEntry } from "@/lib/whats-new";
import { canAccessSection } from "@/lib/admin-permissions";
import { useAdminPermissions } from "@/hooks/use-admin-permissions";

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  } catch {
    return iso;
  }
}

export default function WhatsNew() {
  const { role, permissions } = useAdminPermissions();
  const [open, setOpen] = useState(false);
  const [seenId, setSeenId] = useState<string>("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setSeenId(getSeenId()); }, []);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const visible: WhatsNewEntry[] = WHATS_NEW.filter(
    (e) => e.section === null || !role || canAccessSection(role, e.section, permissions)
  );
  const unseenCount = visible.filter((e) => isUnseen(e, seenId)).length;

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && unseenCount > 0) {
      markAllSeen();
      // Keep the NEW pills visible inside the just-opened panel; the dot
      // and sidebar pills clear now, the list still shows what was new.
    }
  };

  if (visible.length === 0) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={toggle}
        aria-label={unseenCount > 0 ? `What's new — ${unseenCount} unread update(s)` : "What's new"}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-[#5c5e62] transition hover:bg-[#f0f2f5] hover:text-[#1a1a1a]"
      >
        <Sparkles size={17} strokeWidth={1.9} />
        {unseenCount > 0 && (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#f4511e] ring-2 ring-white" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-[360px] max-w-[90vw] overflow-hidden rounded-xl border border-black/[0.08] bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-black/[0.06] px-4 py-3">
            <div className="flex items-center gap-2">
              <Sparkles size={14} strokeWidth={2.2} className="text-[#f4511e]" />
              <p className="text-[0.82rem] font-extrabold text-[#1a1a1a]">What&apos;s new</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close"
              className="text-[#9ca3af] transition hover:text-[#1a1a1a]">
              <X size={14} />
            </button>
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {visible.map((e) => {
              const wasUnseen = isUnseen(e, seenId);
              return (
                <div key={e.id} className="border-b border-black/[0.04] px-4 py-3.5 last:border-b-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[0.84rem] font-bold text-[#1a1a1a]">{e.title}</p>
                    {wasUnseen && (
                      <span className="rounded-full bg-[#f4511e] px-1.5 py-0.5 text-[0.58rem] font-extrabold uppercase tracking-wider text-white">
                        New
                      </span>
                    )}
                    <span className="ml-auto shrink-0 text-[0.68rem] text-[#9ca3af]">{fmtDate(e.date)}</span>
                  </div>
                  <p className="mt-1 text-[0.78rem] leading-relaxed text-[#5c5e62]">{e.brief}</p>
                  {e.href && (
                    <Link href={e.href} onClick={() => setOpen(false)}
                      className="mt-1.5 inline-flex items-center gap-1 text-[0.75rem] font-semibold text-[#f4511e] transition hover:gap-1.5">
                      Open it <ArrowRight size={11} strokeWidth={2.6} />
                    </Link>
                  )}
                </div>
              );
            })}
          </div>

          <p className="border-t border-black/[0.06] bg-[#f8f9fa] px-4 py-2 text-[0.68rem] text-[#9ca3af]">
            Updates ship here as the panel improves — you only see what your role can use.
          </p>
        </div>
      )}
    </div>
  );
}
