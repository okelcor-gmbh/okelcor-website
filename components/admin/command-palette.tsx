"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CornerDownLeft, Search } from "lucide-react";
import { NAV_GROUPS, type NavItem } from "@/lib/admin-nav";
import { canAccess } from "@/lib/admin-permissions";

/**
 * Jump to any admin page by typing.
 *
 * The panel now has thirty-odd destinations across eight groups, and the honest
 * problem with a sidebar that size is not that it looks bad — it is that finding
 * "Finance Invoices" means remembering it lives under Insights rather than under
 * Commerce. A search box removes the need to know the taxonomy at all, which is
 * why it beats reorganising the groups: any arrangement is somebody's wrong
 * guess.
 *
 * Matches on the label, the path and a `keywords` string, because people search
 * for what they want rather than for what a page is called — "invoice" should
 * find Finance Invoices, "staff" should find My Contribution, "kpi" should find
 * both.
 *
 * Only offers pages this role can actually open. A palette that suggests a
 * destination and then bounces you to /admin/unauthorized is worse than one that
 * finds nothing.
 */

type Entry = NavItem & { group: string | null };

export default function CommandPalette({ role }: { role: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const entries = useMemo<Entry[]>(
    () =>
      NAV_GROUPS.flatMap((group) =>
        group.items
          .filter(({ section }) => section === null || !role || canAccess(role, section))
          .map((item) => ({ ...item, group: group.label })),
      ),
    [role],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries.slice(0, 8);

    const terms = q.split(/\s+/);

    return entries
      .map((entry) => {
        const haystack = `${entry.label} ${entry.href} ${entry.keywords ?? ""}`.toLowerCase();
        if (!terms.every((t) => haystack.includes(t))) return null;

        // A label match beats a keyword match, and a label that *starts* with
        // the query beats one that merely contains it — typing "or" should
        // offer Orders before Reported Sales.
        const label = entry.label.toLowerCase();
        const score = label.startsWith(q) ? 0 : label.includes(q) ? 1 : 2;
        return { entry, score };
      })
      .filter((r): r is { entry: Entry; score: number } => r !== null)
      .sort((a, b) => a.score - b.score)
      .slice(0, 10)
      .map((r) => r.entry);
  }, [query, entries]);

  // ── open / close ────────────────────────────────────────────────────────
  //
  // The reset lives in the setter rather than in an effect keyed on `open`.
  // Resetting from an effect costs a second render pass and trips the
  // set-state-in-effect rule this codebase already enforces; a ref carries the
  // current state into the key handler so the toggle stays a plain read.
  const openRef = useRef(false);

  const setPaletteOpen = useCallback((next: boolean) => {
    openRef.current = next;
    setOpen(next);

    if (next) {
      setQuery("");
      setCursor(0);
      // Focus after paint, or the browser hands it straight back to whatever
      // had it when the key was pressed.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(!openRef.current);
        return;
      }
      if (e.key === "Escape") setPaletteOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setPaletteOpen]);

  const go = useCallback(
    (entry: Entry | undefined) => {
      if (!entry) return;
      setPaletteOpen(false);
      router.push(entry.href);
    },
    [router, setPaletteOpen],
  );

  function onInputKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(results[cursor]);
    }
  }

  // Keep the highlighted row in view when arrowing past the fold.
  useEffect(() => {
    const el = listRef.current?.children[cursor] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center bg-black/40 p-4 pt-[12vh]"
      onClick={() => setPaletteOpen(false)}
      role="presentation"
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Search the admin panel"
      >
        <div className="flex items-center gap-2.5 border-b border-black/[0.08] px-4">
          <Search size={16} className="shrink-0 text-[#8c8f94]" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              // A new query means a new result list; leaving the cursor where
              // it was would highlight an unrelated row.
              setCursor(0);
            }}
            onKeyDown={onInputKey}
            placeholder="Search pages — try “invoice”, “campaign”, “staff”…"
            aria-label="Search pages"
            className="w-full bg-transparent py-3.5 text-[0.92rem] text-[#171a20] outline-none placeholder:text-[#a6a9ae]"
          />
          <kbd className="hidden shrink-0 rounded border border-black/10 px-1.5 py-0.5 text-[0.65rem] font-semibold text-[#8c8f94] sm:block">
            ESC
          </kbd>
        </div>

        {results.length === 0 ? (
          <p className="px-4 py-8 text-center text-[0.85rem] text-[#8c8f94]">
            Nothing matches “{query}”.
          </p>
        ) : (
          <ul ref={listRef} className="max-h-[52vh] overflow-y-auto py-1.5">
            {results.map((entry, i) => {
              const Icon = entry.icon;
              const active = i === cursor;
              return (
                <li key={entry.href}>
                  <button
                    type="button"
                    onMouseEnter={() => setCursor(i)}
                    onClick={() => go(entry)}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition ${
                      active ? "bg-[#f5f5f7]" : ""
                    }`}
                  >
                    <Icon
                      size={16}
                      strokeWidth={1.9}
                      className={active ? "shrink-0 text-[#f4511e]" : "shrink-0 text-[#8c8f94]"}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[0.88rem] font-medium text-[#171a20]">
                        {entry.label}
                      </span>
                      {entry.group && (
                        <span className="block truncate text-[0.72rem] text-[#8c8f94]">
                          {entry.group}
                        </span>
                      )}
                    </span>
                    {active && (
                      <CornerDownLeft size={13} className="shrink-0 text-[#8c8f94]" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <div className="flex items-center gap-4 border-t border-black/[0.08] bg-[#fafafa] px-4 py-2 text-[0.7rem] text-[#8c8f94]">
          <span>↑↓ to move</span>
          <span>↵ to open</span>
          <span className="ml-auto">{results.length} of {entries.length} pages</span>
        </div>
      </div>
    </div>
  );
}
