"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { updateBrandContent } from "@/app/admin/brands/actions";
import type { SpecSheetRow } from "@/app/admin/products/actions";
import type { AdminBrand } from "@/lib/admin-api";
import ArticleRichEditor from "@/components/admin/article-rich-editor";

const inputCls =
  "w-full rounded-xl border border-black/[0.09] bg-white px-4 py-2.5 text-[0.875rem] text-[#1a1a1a] outline-none placeholder:text-[#aaa] transition focus:border-[#f4511e] focus:ring-2 focus:ring-[#f4511e]/10";

const labelCls = "mb-1.5 block text-[0.78rem] font-semibold text-[#1a1a1a]";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="col-span-full text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[#f4511e]">
      {children}
    </p>
  );
}

/**
 * Content defaults for one brand — entered once here, inherited by every
 * product of the brand that has no value of its own. The resolution chain is
 * product → brand → site setting, resolved at read time, so saving this form
 * takes effect on all the brand's products immediately.
 *
 * Only json-backed sheet attributes are offered: a brand does not have one
 * width, one EAN or one load index — those stay per product.
 */
export default function BrandContentForm({
  brand,
  specSheet,
}: {
  brand: AdminBrand;
  specSheet: SpecSheetRow[];
}) {
  const router = useRouter();

  const [descriptionHtml, setDescriptionHtml] = useState(brand.description_html ?? "");
  const [shippingInfo,    setShippingInfo]    = useState(brand.shipping_info ?? "");
  const [returnsInfo,     setReturnsInfo]     = useState(brand.returns_info ?? "");
  const [specs, setSpecs] = useState<Record<string, string | boolean>>(
    (brand.specs as Record<string, string | boolean>) ?? {}
  );

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success,     setSuccess]     = useState(false);
  const [isPending, startTransition]  = useTransition();

  const jsonRows = specSheet.filter((r) => r.source === "json");

  const setSpec = (key: string, value: string | boolean) =>
    setSpecs((prev) => ({ ...prev, [key]: value }));
  const clearSpec = (key: string) =>
    setSpecs((prev) => { const next = { ...prev }; delete next[key]; return next; });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await updateBrandContent(brand.id, {
        name: brand.name,
        description_html: descriptionHtml.trim() || null,
        shipping_info: shippingInfo.trim() || null,
        returns_info: returnsInfo.trim() || null,
        specs,
      });

      if (result.error) { setSubmitError(result.error); return; }

      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    });
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {submitError && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[0.83rem] text-red-700">
          <AlertCircle size={15} className="shrink-0" />
          {submitError}
        </div>
      )}
      {success && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[0.83rem] text-emerald-700">
          <CheckCircle2 size={15} className="shrink-0" />
          Saved. Every {brand.name} product without its own value now shows this content.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

        <SectionHeading>Brand Description</SectionHeading>

        <div className="col-span-full">
          <ArticleRichEditor
            value={descriptionHtml}
            onChange={setDescriptionHtml}
            placeholder={`The ${brand.name} story — shown on every ${brand.name} product page that has no description of its own…`}
            minHeight={200}
          />
          <p className="mt-1.5 text-[0.72rem] text-[#5c5e62]">
            A product with its own rich description keeps it — this fills in everywhere else.
          </p>
        </div>

        {jsonRows.length > 0 && (
          <>
            <SectionHeading>Default Specifications</SectionHeading>

            <p className="col-span-full -mt-2 text-[0.72rem] text-[#5c5e62]">
              Applied to every {brand.name} product that has not set the field itself.
              Physical per-tyre values (width, EAN, load index…) stay on the product —
              a brand does not have one width. Only set what is genuinely true for the
              whole brand; a wrong blanket value is worse than an empty field.
            </p>

            {jsonRows.map((row) => {
              const label = `${row.label_de}${row.label_en !== row.label_de ? ` — ${row.label_en}` : ""}`;

              if (row.input === "select") {
                return (
                  <Field key={row.key} label={label}>
                    <select
                      value={(specs[row.key] as string) ?? ""}
                      onChange={(e) => e.target.value === "" ? clearSpec(row.key) : setSpec(row.key, e.target.value)}
                      className={inputCls}
                    >
                      <option value="">— no brand default —</option>
                      {(row.options ?? []).map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </Field>
                );
              }

              if (row.input === "boolean") {
                const value = specs[row.key];
                return (
                  <Field key={row.key} label={label}>
                    <select
                      value={value === true ? "yes" : value === false ? "no" : ""}
                      onChange={(e) => {
                        if (e.target.value === "") clearSpec(row.key);
                        else setSpec(row.key, e.target.value === "yes");
                      }}
                      className={inputCls}
                    >
                      <option value="">— no brand default —</option>
                      <option value="yes">Ja / Yes</option>
                      <option value="no">Nein / No</option>
                    </select>
                  </Field>
                );
              }

              return (
                <Field key={row.key} label={label}>
                  <input
                    type="text"
                    placeholder="— no brand default —"
                    value={(specs[row.key] as string) ?? ""}
                    onChange={(e) => setSpec(row.key, e.target.value)}
                    className={inputCls}
                  />
                </Field>
              );
            })}
          </>
        )}

        <SectionHeading>Shipping &amp; Returns</SectionHeading>

        <p className="col-span-full -mt-2 text-[0.72rem] text-[#5c5e62]">
          Overrides the site-wide texts from Settings for every {brand.name} product;
          a product&apos;s own text overrides both. Leave empty to use the site-wide text.
        </p>

        <Field label={`Shipping (all ${brand.name} products)`}>
          <textarea
            rows={3}
            placeholder="Leave empty to use the site-wide shipping text…"
            value={shippingInfo}
            onChange={(e) => setShippingInfo(e.target.value)}
            className={`${inputCls} resize-none`}
          />
        </Field>

        <Field label={`Returns (all ${brand.name} products)`}>
          <textarea
            rows={3}
            placeholder="Leave empty to use the site-wide returns text…"
            value={returnsInfo}
            onChange={(e) => setReturnsInfo(e.target.value)}
            className={`${inputCls} resize-none`}
          />
        </Field>
      </div>

      <div className="mt-8 flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="flex h-[46px] items-center justify-center rounded-full bg-[#f4511e] px-8 text-[0.9rem] font-semibold text-white transition hover:bg-[#df4618] disabled:opacity-60"
        >
          {isPending ? "Saving…" : "Save Brand Content"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/brands")}
          className="flex h-[46px] items-center justify-center rounded-full border border-black/10 bg-white px-6 text-[0.9rem] font-semibold text-[#1a1a1a] transition hover:bg-[#f0f2f5]"
        >
          Back to Brands
        </button>
      </div>
    </form>
  );
}
