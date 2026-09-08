"use client";

/**
 * The CSV round-trip guide, in the panel where the buttons are — "read
 * before export". Content mirrors docs/PRODUCT_CSV_ROUND_TRIP.md in the
 * API repo; keep the two in step when either changes.
 */

import { BookOpen, X, ShieldCheck, AlertTriangle } from "lucide-react";

export default function CsvGuideModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label="CSV export and import guide">
      <div className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-[0_24px_64px_rgba(0,0,0,0.18)]">

        <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-4">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-[#f4511e]" />
            <p className="text-[0.95rem] font-extrabold text-[#1a1a1a]">Editing products by CSV — read before you export</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-[#9ca3af] transition hover:text-[#1a1a1a]">
            <X size={16} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 text-[0.85rem] leading-relaxed text-[#1a1a1a]">

          <p className="mb-3 font-bold">The loop</p>
          <ol className="mb-5 list-decimal space-y-2 pl-5">
            <li><strong>Export.</strong> Pick a brand in the dropdown (e.g. MICHELIN), then Export CSV — you get only that brand&apos;s rows.</li>
            <li><strong>Edit the file</strong> in your script or spreadsheet. Rows are matched back to products <strong>by the <code className="rounded bg-[#f5f5f7] px-1 font-mono">sku</code> column — never change it.</strong> Everything else on a row belongs to that product.</li>
            <li><strong>Import.</strong> Import CSV → choose your edited file. Existing SKUs are <strong>updated in place</strong> (never duplicated); rows you removed from the file are left untouched; a new SKU would create a new product. Nothing is ever deleted by an import.</li>
          </ol>

          <p className="mb-2 font-bold">The columns</p>
          <div className="mb-5 overflow-x-auto rounded-lg ring-1 ring-black/[0.06]">
            <table className="w-full min-w-[520px] text-left text-[0.8rem]">
              <thead>
                <tr className="border-b border-black/[0.06] bg-[#fafafa] text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#5c5e62]">
                  <th className="px-3 py-2">Column</th>
                  <th className="px-3 py-2">Rule</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04]">
                <tr><td className="px-3 py-2 font-mono font-bold">sku</td><td className="px-3 py-2 font-semibold text-red-600">The key — do not touch.</td></tr>
                <tr><td className="px-3 py-2 font-mono">description</td><td className="px-3 py-2">The main event for content editing. Plain text.</td></tr>
                <tr><td className="px-3 py-2 font-mono">name</td><td className="px-3 py-2">Exported as &ldquo;BRAND Name&rdquo;; the import strips the brand prefix back off — keep that format if you edit it.</td></tr>
                <tr><td className="px-3 py-2 font-mono">price</td><td className="px-3 py-2">Careful: if the Tyre Pricing formula manages this brand, leave it — the pricing tool overwrites it anyway.</td></tr>
                <tr><td className="px-3 py-2 font-mono">cost</td><td className="px-3 py-2">The Tyre100 supplier price — feeds the pricing formula. Change only deliberately.</td></tr>
                <tr><td className="px-3 py-2 font-mono">visible</td><td className="px-3 py-2">True / False.</td></tr>
                <tr><td className="px-3 py-2 font-mono">season · type · size · spec · width…</td><td className="px-3 py-2">Tyre identity — keep consistent or leave alone.</td></tr>
                <tr><td className="px-3 py-2 font-mono">inventory</td><td className="px-3 py-2">Stock count.</td></tr>
                <tr><td className="px-3 py-2 font-mono">created_at</td><td className="px-3 py-2">Ignored on import.</td></tr>
              </tbody>
            </table>
          </div>

          <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-[0.8rem] text-emerald-800">
            <ShieldCheck size={15} className="mt-0.5 shrink-0" />
            <span>
              Import can never break: <strong>images, product URLs (slugs), eBay listing state, rich HTML descriptions, spec sheets</strong> — none of these
              are in the file, so a description round-trip cannot damage them.
            </span>
          </div>

          <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3 text-[0.8rem] text-amber-800">
            <AlertTriangle size={15} className="mt-0.5 shrink-0" />
            <span>
              Keep the header row exactly as exported (lowercase), save as UTF-8 CSV (pandas: <code className="font-mono">df.to_csv(path, index=False)</code>),
              and <strong>test with 3 rows first</strong> — export, edit three, import, check them in the panel, then run the whole brand.
            </span>
          </div>
        </div>

        <div className="border-t border-black/[0.06] px-5 py-3 text-right">
          <button type="button" onClick={onClose}
            className="rounded-full bg-[#1a1a1a] px-5 py-2 text-[0.83rem] font-semibold text-white transition hover:bg-[#333]">
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
