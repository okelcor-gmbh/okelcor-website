"use client";

import { useState } from "react";
import { X, RefreshCw, AlertTriangle } from "lucide-react";
import type { CampaignBlock } from "@/lib/admin-api";
import { themeToWire, type CampaignThemeOverrides } from "@/lib/campaign-design";

export default function SaveTemplateModal({
  blocks,
  theme,
  themeOverrides,
  onClose,
  onSaved,
}: {
  blocks: CampaignBlock[];
  theme: string;
  themeOverrides?: CampaignThemeOverrides | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName]         = useState("");
  const [description, setDesc]  = useState("");
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState<string | null>(null);

  async function save() {
    if (!name.trim()) { setError("Give the design a name."); return; }
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/campaign-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          blocks,
          // An object, never a bare preset string — this endpoint validates
          // `theme` as an array, so a string is a 422.
          theme: themeToWire(theme, themeOverrides),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? json.message ?? `Could not save the design (${res.status}).`);
        return;
      }
      onSaved();
      onClose();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "h-9 w-full rounded-lg border border-black/[0.10] bg-white px-3 text-[0.83rem] text-[#171a20] placeholder:text-[#8c8f94] focus:border-[#f4511e] focus:outline-none";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-4">
          <h2 className="font-bold text-[#171a20]">Save as a reusable design</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-[#5c5e62] hover:bg-[#f0f2f5]">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3 p-5">
          <p className="text-[0.83rem] text-[#5c5e62]">
            Saves the {blocks.length} block{blocks.length === 1 ? "" : "s"} and colours you have now.
            The wording stays as written — edit it after you start the next campaign from it.
          </p>
          <div>
            <label className="mb-1 block text-[0.78rem] font-semibold text-[#5c5e62]">Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Monthly stock announcement"
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-[0.78rem] font-semibold text-[#5c5e62]">Description</label>
            <input
              value={description}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Optional — what it's for"
              className={inputClass}
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-[0.83rem] text-red-700">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" /> {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-black/[0.06] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2 text-[0.83rem] font-semibold text-[#5c5e62] hover:bg-[#f0f2f5]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving || !name.trim()}
            className="flex items-center gap-1.5 rounded-full bg-[#f4511e] px-4 py-2 text-[0.83rem] font-semibold text-white transition hover:bg-[#df4618] disabled:opacity-60"
          >
            {saving && <RefreshCw size={12} className="animate-spin" />}
            {saving ? "Saving…" : "Save design"}
          </button>
        </div>
      </div>
    </div>
  );
}
