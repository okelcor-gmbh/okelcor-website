"use client";

/**
 * Recipient picker for internal messages.
 *
 * Deliberately a picker over a directory, not a free-text address field. The
 * API only accepts admin_user ids — a typed address would make "staff only"
 * unenforceable and let a slip send internal correspondence to a stranger.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { X, Loader2, Search, UserPlus } from "lucide-react";
import type { StaffColleague } from "@/lib/staff-messages";
import { MAX_RECIPIENTS } from "@/lib/staff-messages";

type Props = {
  label: string;
  optional?: boolean;
  selected: number[];
  onChange: (ids: number[]) => void;
  /** Colleagues already chosen in the sibling field, hidden to avoid duplicates. */
  exclude?: number[];
  directory: StaffColleague[];
  loading: boolean;
  error?: string;
};

export default function StaffRecipientPicker({
  label, optional, selected, onChange, exclude = [], directory, loading, error,
}: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const byId = useMemo(
    () => new Map(directory.map((c) => [c.id, c])),
    [directory],
  );

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return directory.filter((c) => {
      if (selected.includes(c.id) || exclude.includes(c.id)) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.job_title ?? "").toLowerCase().includes(q)
      );
    });
  }, [directory, query, selected, exclude]);

  const full = selected.length >= MAX_RECIPIENTS;

  function add(id: number) {
    if (full) return;
    onChange([...selected, id]);
    setQuery("");
  }

  function remove(id: number) {
    onChange(selected.filter((s) => s !== id));
  }

  return (
    <div ref={boxRef} className="relative">
      <label className="mb-1.5 block text-[0.78rem] font-semibold text-[#1a1a1a]">
        {label}{" "}
        {optional
          ? <span className="font-normal text-[#9ca3af]">(optional)</span>
          : <span className="text-[#f4511e]">*</span>}
      </label>

      <div
        className={[
          "flex flex-wrap items-center gap-1.5 rounded-xl border bg-[#fafafa] px-2 py-2 transition",
          error ? "border-red-400" : "border-black/[0.1] focus-within:border-[#f4511e]",
        ].join(" ")}
      >
        {selected.map((id) => {
          const person = byId.get(id);
          return (
            <span
              key={id}
              className="flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[0.75rem] font-medium text-[#1a1a1a] shadow-sm"
            >
              {person?.name ?? `#${id}`}
              <button
                type="button"
                onClick={() => remove(id)}
                aria-label={`Remove ${person?.name ?? id}`}
                className="text-[#9ca3af] transition hover:text-red-500"
              >
                <X size={11} />
              </button>
            </span>
          );
        })}

        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          disabled={full}
          placeholder={
            full
              ? `Maximum ${MAX_RECIPIENTS}`
              : selected.length === 0 ? "Search colleagues by name or role…" : ""
          }
          className="min-w-[160px] flex-1 bg-transparent px-1.5 py-1 text-[0.83rem] text-[#1a1a1a] outline-none disabled:opacity-50"
        />
      </div>

      {error && <p className="mt-1 text-[0.72rem] text-red-500">{error}</p>}

      {open && !full && (
        <div className="absolute z-20 mt-1.5 max-h-64 w-full overflow-y-auto rounded-xl border border-black/[0.08] bg-white shadow-lg">
          {loading ? (
            <div className="flex items-center justify-center gap-2 px-4 py-6 text-[0.8rem] text-[#5c5e62]">
              <Loader2 size={14} className="animate-spin text-[#f4511e]" /> Loading the team…
            </div>
          ) : directory.length === 0 ? (
            <p className="px-4 py-6 text-center text-[0.8rem] text-[#5c5e62]">
              No colleagues found. If this looks wrong, the messaging endpoints may not be
              deployed yet.
            </p>
          ) : matches.length === 0 ? (
            <p className="flex items-center justify-center gap-2 px-4 py-6 text-[0.8rem] text-[#5c5e62]">
              <Search size={13} className="text-[#9ca3af]" />
              Nobody matches “{query}”.
            </p>
          ) : (
            <ul className="divide-y divide-black/[0.04]">
              {matches.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => add(c.id)}
                    className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition hover:bg-[#fafafa]"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f0f2f5] text-[0.7rem] font-bold text-[#5c5e62]">
                      {initials(c.name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[0.83rem] font-semibold text-[#1a1a1a]">{c.name}</span>
                      <span className="block truncate text-[0.72rem] text-[#9ca3af]">
                        {c.job_title || c.role.replace(/_/g, " ")} · {c.email}
                      </span>
                    </span>
                    <UserPlus size={14} className="shrink-0 text-[#9ca3af]" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}
