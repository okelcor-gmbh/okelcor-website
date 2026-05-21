"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Upload, X } from "lucide-react";
import { createArticle, updateArticle, uploadArticleImage } from "@/app/admin/articles/actions";
import type { AdminArticleFull, ArticleTranslation } from "@/lib/admin-api";
import ArticleRichEditor from "@/components/admin/article-rich-editor";

// ── Types ─────────────────────────────────────────────────────────────────────

type Locale = "en" | "de" | "fr" | "es";

type LocaleData = {
  category: string;
  title: string;
  readTime: string;
  summary: string;
  /** HTML string */
  body: string;
};

type Props =
  | { mode: "create" }
  | { mode: "edit"; article: AdminArticleFull };

// ── Slug helper ───────────────────────────────────────────────────────────────

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const EMPTY_LOCALE: LocaleData = {
  category: "",
  title: "",
  readTime: "",
  summary: "",
  body: "",
};

function bodyToHtml(body: string | string[] | undefined | null): string {
  if (!body) return "";
  if (typeof body === "string") return body;
  // Legacy plain-text array → wrap each paragraph in <p>
  return body.filter((p) => p.trim()).map((p) => `<p>${p}</p>`).join("\n");
}

function fromTranslation(t?: ArticleTranslation): LocaleData {
  if (!t) return EMPTY_LOCALE;
  return {
    category: t.category ?? "",
    title: t.title ?? "",
    readTime: t.read_time ?? "",
    summary: t.summary ?? "",
    body: bodyToHtml(t.body),
  };
}

function hasContent(ld: LocaleData): boolean {
  const stripped = ld.body.replace(/<[^>]*>/g, "").trim();
  return ld.title.trim() !== "" || ld.summary.trim() !== "" || stripped !== "";
}

// ── Field helpers ─────────────────────────────────────────────────────────────

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[0.78rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "h-10 w-full rounded-xl border border-black/[0.09] bg-white px-3.5 text-[0.875rem] text-[#1a1a1a] outline-none placeholder:text-[#aaa] transition focus:border-[#E85C1A] focus:ring-2 focus:ring-[#E85C1A]/10";

const textareaCls =
  "w-full resize-y rounded-xl border border-black/[0.09] bg-white px-3.5 py-2.5 text-[0.875rem] text-[#1a1a1a] outline-none placeholder:text-[#aaa] transition focus:border-[#E85C1A] focus:ring-2 focus:ring-[#E85C1A]/10";

// ── Main component ─────────────────────────────────────────────────────────────

export default function ArticleForm(props: Props) {
  const router = useRouter();
  const isEdit = props.mode === "edit";
  const article = isEdit ? props.article : null;

  // ── Global state ────────────────────────────────────────────────────────────

  const [date, setDate] = useState(article?.published_at ?? new Date().toISOString().slice(0, 10));
  const [isPublished, setIsPublished] = useState(article?.is_published ?? false);
  const [sortOrder, setSortOrder] = useState(article?.sort_order ?? 0);
  const [slug, setSlug] = useState(article?.slug ?? "");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(isEdit);
  const [imagePreview, setImagePreview] = useState<string | null>(article?.image || null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Sync preview when server sends fresh props after router.refresh()
  useEffect(() => {
    if (!imageFile) {
      setImagePreview(article?.image || null);
    }
  }, [article?.image]);

  // ── Locale state ────────────────────────────────────────────────────────────

  const [activeTab, setActiveTab] = useState<Locale>("en");
  const [localeData, setLocaleData] = useState<Record<Locale, LocaleData>>({
    en: fromTranslation(article?.translations?.en),
    de: fromTranslation(article?.translations?.de),
    fr: fromTranslation(article?.translations?.fr),
    es: fromTranslation(article?.translations?.es),
  });

  // ── UI state ────────────────────────────────────────────────────────────────

  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({});
  const [, startTransition] = useTransition();
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Locale helpers ──────────────────────────────────────────────────────────

  const setLocale = (locale: Locale, patch: Partial<LocaleData>) => {
    setLocaleData((prev) => {
      const next = { ...prev, [locale]: { ...prev[locale], ...patch } };
      // Auto-generate slug from EN title while user hasn't manually edited it
      if (locale === "en" && patch.title !== undefined && !slugManuallyEdited) {
        setSlug(toSlug(patch.title));
      }
      return next;
    });
  };

  const cur = localeData[activeTab];

  // ── Image handling ──────────────────────────────────────────────────────────

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  // ── Validation ──────────────────────────────────────────────────────────────

  const validate = (): boolean => {
    const errors: Partial<Record<string, string>> = {};
    if (!date.trim()) errors.date = "Date is required.";
    if (!slug.trim()) errors.slug = "Slug is required.";
    if (!localeData.en.title.trim()) errors.en_title = "EN title is required.";
    if (!localeData.en.summary.trim()) errors.en_summary = "EN summary is required.";
    const enBodyText = localeData.en.body.replace(/<[^>]*>/g, "").trim();
    if (!enBodyText) errors.en_body = "EN body is required.";
    if (!isEdit && !imageFile) errors.image = "Cover image is required.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setError(null);
    setSaving(true);

    startTransition(async () => {
      const buildLocale = (ld: LocaleData) => ({
        category: ld.category.trim(),
        title: ld.title.trim(),
        read_time: ld.readTime.trim(),
        summary: ld.summary.trim(),
        body: ld.body,
      });

      const payload = {
        slug: slug.trim(),
        date,
        is_published: isPublished,
        sort_order: Number(sortOrder),
        translations: {
          en: buildLocale(localeData.en),
          ...(hasContent(localeData.de) ? { de: buildLocale(localeData.de) } : {}),
          ...(hasContent(localeData.fr) ? { fr: buildLocale(localeData.fr) } : {}),
          ...(hasContent(localeData.es) ? { es: buildLocale(localeData.es) } : {}),
        },
      };

      let articleId: number;

      if (isEdit) {
        const res = await updateArticle(article!.id, payload);
        if (res.error) { setError(res.error); setSaving(false); return; }
        articleId = article!.id;
      } else {
        const res = await createArticle(payload);
        if (res.error) { setError(res.error); setSaving(false); return; }
        if (!res.id) { setError("Article was created but no ID was returned. Please refresh and try uploading the image from the edit page."); setSaving(false); return; }
        articleId = res.id;
      }

      // Upload image if selected
      if (imageFile) {
        const fd = new FormData();
        fd.append("image", imageFile);
        const imgRes = await uploadArticleImage(articleId, fd);
        if (imgRes.error) { setError(imgRes.error); setSaving(false); return; }
      }

      setSaving(false);

      if (isEdit) {
        setSaved(true);
        setTimeout(() => setSaved(false), 4000);
        router.refresh();
      } else {
        router.push(`/admin/articles/${articleId}`);
      }
    });
  };

  // ── Locale tab config ───────────────────────────────────────────────────────

  const tabs: { locale: Locale; label: string; required?: boolean }[] = [
    { locale: "en", label: "EN", required: true },
    { locale: "de", label: "DE" },
    { locale: "fr", label: "FR" },
    { locale: "es", label: "ES" },
  ];

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* ── Success banner ── */}
      {saved && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[0.83rem] text-emerald-700">
          <span>Article saved successfully.</span>
          <button type="button" onClick={() => setSaved(false)}><X size={14} /></button>
        </div>
      )}

      {/* ── Global error ── */}
      {error && (
        <div className="flex items-start justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[0.83rem] text-red-700">
          <pre className="whitespace-pre-wrap font-sans">{error}</pre>
          <button type="button" onClick={() => setError(null)} className="ml-3 shrink-0"><X size={14} /></button>
        </div>
      )}

      {/* ── Global settings ── */}
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <p className="mb-5 text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#5c5e62]">
          Global Settings
        </p>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* Cover image */}
          <div className="sm:col-span-2 lg:col-span-3">
            <Field label="Cover Image" required={!isEdit}>
              <div className="flex items-start gap-4">
                {imagePreview ? (
                  <div className="relative h-24 w-36 shrink-0 overflow-hidden rounded-xl bg-[#f0f2f5]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imagePreview} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => { setImagePreview(null); setImageFile(null); }}
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ) : (
                  <div className="flex h-24 w-36 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-black/[0.1] bg-[#fafafa] text-[0.7rem] font-semibold text-[#bbb]">
                    No image
                  </div>
                )}
                <div>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 rounded-xl border border-black/[0.1] bg-white px-4 py-2 text-[0.83rem] font-semibold text-[#1a1a1a] transition hover:border-[#E85C1A] hover:text-[#E85C1A]"
                  >
                    <Upload size={13} />
                    {imagePreview ? "Replace image" : "Upload image"}
                  </button>
                  {fieldErrors.image && <p className="mt-1.5 text-[0.78rem] text-red-500">{fieldErrors.image}</p>}
                </div>
              </div>
            </Field>
          </div>

          {/* Slug */}
          <Field label="Slug" required>
            <input
              type="text"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugManuallyEdited(true);
              }}
              placeholder="e.g. tyre-supply-trends-2026"
              className={inputCls}
            />
            {fieldErrors.slug && <p className="mt-1 text-[0.78rem] text-red-500">{fieldErrors.slug}</p>}
            {!isEdit && !slugManuallyEdited && (
              <p className="mt-1 text-[0.72rem] text-[#5c5e62]">Auto-generated from EN title</p>
            )}
          </Field>

          {/* Date */}
          <Field label="Date" required>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputCls}
            />
            {fieldErrors.date && <p className="mt-1 text-[0.78rem] text-red-500">{fieldErrors.date}</p>}
          </Field>

          {/* Sort order */}
          <Field label="Sort Order">
            <input
              type="number"
              min={0}
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              className={inputCls}
            />
          </Field>

          {/* Published */}
          <Field label="Status">
            <div className="flex h-10 items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={isPublished}
                onClick={() => setIsPublished((v) => !v)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-[#E85C1A]/30 ${isPublished ? "bg-emerald-500" : "bg-gray-200"}`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${isPublished ? "translate-x-5" : "translate-x-0"}`}
                />
              </button>
              <span className={`text-[0.875rem] font-semibold ${isPublished ? "text-emerald-600" : "text-[#5c5e62]"}`}>
                {isPublished ? "Published" : "Draft"}
              </span>
            </div>
          </Field>
        </div>
      </div>

      {/* ── Locale tabs ── */}
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        {/* Tab bar */}
        <div className="mb-6 flex gap-2 border-b border-black/[0.06] pb-0">
          {tabs.map(({ locale, label, required }) => {
            const filled = hasContent(localeData[locale]);
            const isActive = activeTab === locale;
            return (
              <button
                key={locale}
                type="button"
                onClick={() => setActiveTab(locale)}
                className={`relative -mb-px flex items-center gap-1.5 rounded-t-lg px-4 py-2.5 text-[0.8rem] font-bold transition ${
                  isActive
                    ? "border border-b-white border-black/[0.08] bg-white text-[#1a1a1a]"
                    : "text-[#5c5e62] hover:text-[#1a1a1a]"
                }`}
              >
                {label}
                {required && <span className="text-red-500">*</span>}
                {filled && (
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Category">
              <input
                type="text"
                value={cur.category}
                onChange={(e) => setLocale(activeTab, { category: e.target.value })}
                placeholder="e.g. Industry News"
                className={inputCls}
              />
            </Field>

            <Field label="Read Time">
              <input
                type="text"
                value={cur.readTime}
                onChange={(e) => setLocale(activeTab, { readTime: e.target.value })}
                placeholder="e.g. 5 min read"
                className={inputCls}
              />
            </Field>

            <div className="sm:col-span-2">
              <Field label="Title" required={activeTab === "en"}>
                <input
                  type="text"
                  value={cur.title}
                  onChange={(e) => setLocale(activeTab, { title: e.target.value })}
                  placeholder="Article title"
                  className={inputCls}
                />
                {activeTab === "en" && fieldErrors.en_title && (
                  <p className="mt-1 text-[0.78rem] text-red-500">{fieldErrors.en_title}</p>
                )}
              </Field>
            </div>

            <div className="sm:col-span-2">
              <Field label="Summary" required={activeTab === "en"}>
                <textarea
                  value={cur.summary}
                  onChange={(e) => setLocale(activeTab, { summary: e.target.value })}
                  rows={3}
                  placeholder="Short summary shown in article cards"
                  className={textareaCls}
                />
                {activeTab === "en" && fieldErrors.en_summary && (
                  <p className="mt-1 text-[0.78rem] text-red-500">{fieldErrors.en_summary}</p>
                )}
              </Field>
            </div>
          </div>

          {/* Rich text editor */}
          <div>
            <p className="mb-2 text-[0.78rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">
              Article Body
              {activeTab === "en" && <span className="ml-0.5 text-red-500">*</span>}
            </p>
            <ArticleRichEditor
              value={cur.body}
              onChange={(html) => setLocale(activeTab, { body: html })}
              placeholder={`Write the ${activeTab.toUpperCase()} article body…`}
              minHeight={340}
            />
            {activeTab === "en" && fieldErrors.en_body && (
              <p className="mt-2 text-[0.78rem] text-red-500">{fieldErrors.en_body}</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="h-10 rounded-full border border-black/10 bg-white px-5 text-[0.875rem] font-semibold text-[#1a1a1a] transition hover:bg-[#f0f2f5]"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="h-10 rounded-full bg-[#E85C1A] px-6 text-[0.875rem] font-semibold text-white transition hover:bg-[#d44f12] disabled:opacity-60"
        >
          {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Article"}
        </button>
      </div>
    </form>
  );
}
