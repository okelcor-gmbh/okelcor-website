"use client";

import { useState } from "react";
import { Loader2, Paperclip, X } from "lucide-react";
import type { StaffContribution } from "@/lib/admin-api";

/**
 * Logging work the system could not see.
 *
 * Two deliberate restraints in here, both from the backend contract:
 *
 * `minutes` is optional and stays optional. Making someone account for their
 * hours turns a contribution log into a timesheet, which is a different product
 * with a very different reception.
 *
 * Evidence is invited, never required. A supplier phone call leaves no artifact,
 * and refusing to record it would only mean it goes unrecorded — so the form
 * says so rather than blocking submission.
 */

const CATEGORIES: { value: string; label: string; hint: string }[] = [
  { value: "social_media",   label: "Social media & content", hint: "A post, a reel, a newsletter piece" },
  { value: "supplier",       label: "Supplier relations",     hint: "A call, a negotiation, a factory visit" },
  { value: "customer_visit", label: "Customer visit or call", hint: "Anything outside the inbox" },
  { value: "trade_fair",     label: "Trade fair & events",    hint: "Stand duty, travel, follow-ups" },
  { value: "training",       label: "Training & learning",    hint: "A course, a certification, teaching someone" },
  { value: "internal",       label: "Internal & admin",       hint: "Process work, documentation, onboarding" },
  // Design and technical work that leaves no commit behind. Commits themselves
  // arrive automatically through `staff:import-commits` and appear under
  // Recorded, not here.
  { value: "development",    label: "Development & technical", hint: "An architecture decision, a spec, pairing on someone's bug" },
  { value: "other",          label: "Other",                  hint: "Anything the list above misses" },
];

type FieldErrors = Record<string, string[]>;

export default function StaffContributionForm({
  existing,
  onClose,
  onSaved,
}: {
  existing?: StaffContribution | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const editing = Boolean(existing);

  const [category, setCategory]     = useState(existing?.category ?? "supplier");
  const [title, setTitle]           = useState(existing?.title ?? "");
  const [description, setDesc]      = useState(existing?.description ?? "");
  const [performedOn, setPerformed] = useState(existing?.performed_on ?? today());
  const [minutes, setMinutes]       = useState(existing?.minutes ? String(existing.minutes) : "");
  const [link, setLink]             = useState(existing?.link ?? "");
  const [file, setFile]             = useState<File | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const [fields, setFields] = useState<FieldErrors>({});

  const chosen = CATEGORIES.find((c) => c.value === category);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setFields({});

    try {
      const res = editing
        ? await fetch(`/api/admin/staff/contributions/${existing!.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              category,
              title,
              description: description || null,
              performed_on: performedOn,
              minutes: minutes ? Number(minutes) : null,
              link: link || null,
            }),
          })
        : await sendCreate();

      const json = await res.json().catch(() => ({}));

      if (res.status === 404 || res.status === 405) {
        setError("Logging work isn't available on the server yet — the API needs deploying first.");
        return;
      }
      if (res.status === 409) {
        // A manager has already ruled on this. Rewording it would change what
        // they agreed to, so the answer is a new entry, not a retry.
        setError(json?.message ?? "This entry has already been reviewed and can no longer be edited.");
        return;
      }
      if (res.status === 422) {
        setFields((json?.errors ?? {}) as FieldErrors);
        setError(json?.message ?? "Please check the highlighted fields.");
        return;
      }
      if (!res.ok) {
        setError(json?.message ?? json?.error ?? `Could not save (${res.status}).`);
        return;
      }

      // A 201 can still carry bad news — the entry saved but the attachment did
      // not. Passing the server's own message through means that never reads as
      // a plain success.
      onSaved(json?.message ?? (editing ? "Entry updated." : "Work logged."));
    } catch {
      setError("Could not reach the server.");
    } finally {
      setSaving(false);
    }
  }

  function sendCreate() {
    // One request, not two: people have the artifact in front of them while
    // they are writing the entry.
    if (file) {
      const form = new FormData();
      form.set("category", category);
      form.set("title", title);
      form.set("performed_on", performedOn);
      if (description) form.set("description", description);
      if (minutes) form.set("minutes", minutes);
      if (link) form.set("link", link);
      form.set("file", file);
      return fetch("/api/admin/staff/contributions", { method: "POST", body: form });
    }

    return fetch("/api/admin/staff/contributions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category,
        title,
        description: description || null,
        performed_on: performedOn,
        minutes: minutes ? Number(minutes) : null,
        link: link || null,
      }),
    });
  }

  const label = "mb-1 block text-[0.72rem] font-bold uppercase tracking-wider text-[#5c5e62]";
  const input =
    "w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-[0.85rem] text-[#171a20] " +
    "outline-none transition focus:border-[#f4511e] focus:ring-2 focus:ring-[#f4511e]/25";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:p-8">
      <form onSubmit={submit} className="w-full max-w-xl rounded-2xl bg-white p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-[1rem] font-bold text-[#171a20]">
              {editing ? "Edit entry" : "Log work"}
            </h3>
            <p className="mt-0.5 text-[0.78rem] leading-snug text-[#5c5e62]">
              For work the system can&apos;t see. It stays marked as self-reported, before and
              after anyone reviews it.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-[#8c8f94] transition hover:bg-[#f0f2f5] hover:text-[#171a20]"
          >
            <X size={16} />
          </button>
        </div>

        {error && (
          <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-[0.8rem] leading-snug text-red-800">
            {error}
          </p>
        )}

        <div className="flex flex-col gap-3.5">
          <div>
            <label className={label} htmlFor="sc-category">Kind of work</label>
            <select
              id="sc-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={input}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            {chosen && <p className="mt-1 text-[0.72rem] text-[#8c8f94]">{chosen.hint}</p>}
          </div>

          <div>
            <label className={label} htmlFor="sc-title">What did you do?</label>
            <input
              id="sc-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={160}
              required
              placeholder="Called Zhengxin about Q4 TBR allocation"
              className={input}
            />
            {fields.title && <p className="mt-1 text-[0.72rem] text-red-700">{fields.title[0]}</p>}
          </div>

          <div>
            <label className={label} htmlFor="sc-desc">
              Detail <span className="font-normal normal-case tracking-normal text-[#8c8f94]">— optional</span>
            </label>
            <textarea
              id="sc-desc"
              value={description ?? ""}
              onChange={(e) => setDesc(e.target.value)}
              maxLength={2000}
              rows={3}
              placeholder="What came of it, who else was involved, what happens next."
              className={input}
            />
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2">
            <div>
              <label className={label} htmlFor="sc-date">When</label>
              <input
                id="sc-date"
                type="date"
                value={performedOn}
                max={today()}
                onChange={(e) => setPerformed(e.target.value)}
                required
                className={input}
              />
              {fields.performed_on && (
                <p className="mt-1 text-[0.72rem] text-red-700">{fields.performed_on[0]}</p>
              )}
            </div>

            <div>
              <label className={label} htmlFor="sc-minutes">
                Time spent{" "}
                <span className="font-normal normal-case tracking-normal text-[#8c8f94]">— optional</span>
              </label>
              <input
                id="sc-minutes"
                type="number"
                min={1}
                max={1440}
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                placeholder="Minutes"
                className={input}
              />
              {/* Said plainly, because a blank number field reads as one you
                  forgot rather than one you were never asked for. */}
              <p className="mt-1 text-[0.72rem] text-[#8c8f94]">Leave blank — this isn&apos;t a timesheet.</p>
            </div>
          </div>

          <div>
            <label className={label} htmlFor="sc-link">
              Link <span className="font-normal normal-case tracking-normal text-[#8c8f94]">— optional</span>
            </label>
            <input
              id="sc-link"
              type="url"
              value={link ?? ""}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://www.linkedin.com/posts/…"
              className={input}
            />
            {fields.link && <p className="mt-1 text-[0.72rem] text-red-700">{fields.link[0]}</p>}
          </div>

          {!editing && (
            <div>
              <label className={label} htmlFor="sc-file">
                Evidence <span className="font-normal normal-case tracking-normal text-[#8c8f94]">— optional</span>
              </label>
              <div className="flex items-center gap-2">
                <label
                  htmlFor="sc-file"
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-black/10 px-3 py-2 text-[0.8rem] text-[#171a20] transition hover:bg-[#f7f7f8]"
                >
                  <Paperclip size={13} />
                  {file ? "Change file" : "Attach a file"}
                </label>
                <input
                  id="sc-file"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="sr-only"
                />
                {file && <span className="truncate text-[0.78rem] text-[#5c5e62]">{file.name}</span>}
              </div>
              <p className="mt-1 text-[0.72rem] leading-snug text-[#8c8f94]">
                Nothing to attach is fine — a phone call has no paperwork. Reviewers are shown
                whether an entry has anything behind it.
              </p>
            </div>
          )}
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-[0.83rem] font-semibold text-[#5c5e62] transition hover:bg-[#f0f2f5]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !title.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#f4511e] px-4 py-2 text-[0.83rem] font-semibold text-white transition hover:bg-[#d24f13] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving && <Loader2 size={13} className="animate-spin" />}
            {editing ? "Save changes" : "Log it"}
          </button>
        </div>
      </form>
    </div>
  );
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}
