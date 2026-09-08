"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Pencil, Trash2, Upload, Check, X,
  Film, Image as ImageIcon, ChevronDown, ChevronUp,
} from "lucide-react";

async function uploadSlideMedia(slideId: number | string, file: File, mediaType: "image" | "video"): Promise<{ error?: string }> {
  const fd = new FormData();
  fd.append("media", file);
  fd.append("media_type", mediaType);

  // Route through the Next.js server-side proxy:
  // - No CORS issues (browser → Next.js → Laravel is server-to-server)
  // - Token is read from the httpOnly cookie server-side
  // - Body is streamed to avoid Vercel body-size buffering limits
  let res: Response;
  try {
    res = await fetch(`/api/admin/hero-slides-upload?slideId=${slideId}`, {
      method: "POST",
      body: fd,
    });
  } catch {
    return { error: "Network error. Could not reach the upload service." };
  }

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    return { error: json.error || json.message || `Upload failed (HTTP ${res.status}).` };
  }
  return {};
}
import {
  createHeroSlide,
  updateHeroSlide,
  deleteHeroSlide,
  type SlideInput,
  type SlideTranslation,
} from "@/app/admin/hero-slides/actions";
import type { AdminHeroSlide } from "@/lib/admin-api";

// ── Translation helpers ────────────────────────────────────────────────────────

type TransLocale = "de" | "fr" | "es";
type TransFields = { title: string; subtitle: string; cta_primary: string; cta_secondary: string };

const EMPTY_TRANS: TransFields = { title: "", subtitle: "", cta_primary: "", cta_secondary: "" };
const TRANS_LOCALES: { locale: TransLocale; label: string }[] = [
  { locale: "de", label: "DE" },
  { locale: "fr", label: "FR" },
  { locale: "es", label: "ES" },
];

function hasTransContent(t: TransFields): boolean {
  return t.title.trim() !== "" || t.subtitle.trim() !== "";
}

function initTranslations(initial?: AdminHeroSlide): Record<TransLocale, TransFields> {
  const base: Record<TransLocale, TransFields> = { de: { ...EMPTY_TRANS }, fr: { ...EMPTY_TRANS }, es: { ...EMPTY_TRANS } };
  const translations = initial?.translations;
  if (!Array.isArray(translations)) return base;
  for (const t of translations) {
    if (t.locale === "de" || t.locale === "fr" || t.locale === "es") {
      base[t.locale] = {
        title: t.title ?? "",
        subtitle: t.subtitle ?? "",
        cta_primary: t.cta_primary ?? "",
        cta_secondary: t.cta_secondary ?? "",
      };
    }
  }
  return base;
}

// ── Slide form (create & edit) ─────────────────────────────────────────────────

function SlideForm({
  initial,
  onSaved,
  onCancel,
}: {
  initial?: AdminHeroSlide;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const isEdit = !!initial;

  const [title, setTitle]               = useState(initial?.title ?? "");
  const [subtitle, setSubtitle]         = useState(initial?.subtitle ?? "");
  const [order, setOrder]               = useState(String(initial?.order ?? "1"));
  const [mediaType, setMediaType]       = useState<"image" | "video">(
    initial?.media_type === "video" ? "video" : "image"
  );
  const [mediaFile, setMediaFile]       = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    isEdit && initial?.media_type !== "video" ? (initial?.image_url ?? null) : null
  );
  const [ctaOpen, setCtaOpen]           = useState(
    !!(initial?.cta_primary_label || initial?.cta_primary_href ||
       initial?.cta_secondary_label || initial?.cta_secondary_href)
  );
  const [ctaPrimaryLabel, setCtaPrimaryLabel]       = useState(initial?.cta_primary_label ?? "");
  const [ctaPrimaryHref, setCtaPrimaryHref]         = useState(initial?.cta_primary_href ?? "");
  const [ctaSecondaryLabel, setCtaSecondaryLabel]   = useState(initial?.cta_secondary_label ?? "");
  const [ctaSecondaryHref, setCtaSecondaryHref]     = useState(initial?.cta_secondary_href ?? "");
  const [transTab, setTransTab]         = useState<TransLocale>("de");
  const [trans, setTrans]               = useState<Record<TransLocale, TransFields>>(() => initTranslations(initial));
  const [error, setError]               = useState<string | null>(null);
  const [isPending, startTransition]    = useTransition();
  const fileInputRef                    = useRef<HTMLInputElement>(null);

  const patchTrans = (locale: TransLocale, patch: Partial<TransFields>) => {
    setTrans((prev) => ({ ...prev, [locale]: { ...prev[locale], ...patch } }));
  };

  const handleMediaTypeChange = (type: "image" | "video") => {
    setMediaType(type);
    setMediaFile(null);
    setImagePreview(isEdit && initial?.media_type !== "video" && type === "image"
      ? (initial?.image_url ?? null)
      : null
    );
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFile(file);
    if (mediaType === "image") {
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSave = () => {
    if (!title.trim())    { setError("Title is required."); return; }
    if (!subtitle.trim()) { setError("Subtitle is required."); return; }
    if (!isEdit && !mediaFile) { setError("Please select a media file."); return; }
    setError(null);

    const builtTranslations: SlideTranslation[] = (["de", "fr", "es"] as TransLocale[])
      .filter((locale) => hasTransContent(trans[locale]))
      .map((locale) => {
        const t = trans[locale];
        return {
          locale,
          ...(t.title.trim()         && { title: t.title.trim() }),
          ...(t.subtitle.trim()      && { subtitle: t.subtitle.trim() }),
          ...(t.cta_primary.trim()   && { cta_primary: t.cta_primary.trim() }),
          ...(t.cta_secondary.trim() && { cta_secondary: t.cta_secondary.trim() }),
        };
      });

    const input: SlideInput = {
      title:    title.trim(),
      subtitle: subtitle.trim(),
      order:    parseInt(order, 10) || 1,
      ...(ctaPrimaryLabel.trim()   && { cta_primary_label:   ctaPrimaryLabel.trim() }),
      ...(ctaPrimaryHref.trim()    && { cta_primary_href:    ctaPrimaryHref.trim() }),
      ...(ctaSecondaryLabel.trim() && { cta_secondary_label: ctaSecondaryLabel.trim() }),
      ...(ctaSecondaryHref.trim()  && { cta_secondary_href:  ctaSecondaryHref.trim() }),
      ...(builtTranslations.length > 0 && { translations: builtTranslations }),
    };

    startTransition(async () => {
      if (isEdit) {
        const result = await updateHeroSlide(initial!.id, input);
        if (result.error) { setError(result.error); return; }

        if (mediaFile) {
          const uploadResult = await uploadSlideMedia(initial!.id, mediaFile, mediaType);
          if (uploadResult.error) { setError(uploadResult.error); return; }
        }
      } else {
        const result = await createHeroSlide(input);
        if (result.error) { setError(result.error); return; }

        if (mediaFile && result.id) {
          const uploadResult = await uploadSlideMedia(result.id, mediaFile, mediaType);
          if (uploadResult.error) { setError(uploadResult.error); return; }
        }
      }

      onSaved();
    });
  };

  return (
    <div className="rounded-2xl border border-[#f4511e]/20 bg-white p-6 shadow-sm">
      <p className="mb-5 text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[#f4511e]">
        {isEdit ? "Edit Slide" : "New Slide"}
      </p>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-[0.78rem] text-red-600">{error}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Title */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[0.72rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Premium Tyre Supply"
            className="h-9 rounded-xl border border-black/[0.09] bg-white px-3 text-[0.875rem] text-[#1a1a1a] outline-none placeholder:text-[#bbb] transition focus:border-[#f4511e] focus:ring-2 focus:ring-[#f4511e]/10"
          />
        </div>

        {/* Order */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[0.72rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">Display Order</label>
          <input
            type="number"
            value={order}
            onChange={(e) => setOrder(e.target.value)}
            min={1}
            className="h-9 rounded-xl border border-black/[0.09] bg-white px-3 text-[0.875rem] text-[#1a1a1a] outline-none transition focus:border-[#f4511e] focus:ring-2 focus:ring-[#f4511e]/10"
          />
        </div>

        {/* Subtitle */}
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className="text-[0.72rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">Subtitle</label>
          <textarea
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="e.g. Sourcing premium tyres for distributors worldwide"
            rows={2}
            className="resize-none rounded-xl border border-black/[0.09] bg-white px-3 py-2 text-[0.875rem] text-[#1a1a1a] outline-none placeholder:text-[#bbb] transition focus:border-[#f4511e] focus:ring-2 focus:ring-[#f4511e]/10"
          />
        </div>

        {/* Media type + file upload */}
        <div className="flex flex-col gap-2 sm:col-span-2">
          <label className="text-[0.72rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">
            {isEdit ? "Replace Media (optional)" : "Media"}
          </label>

          {/* Image / Video toggle */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleMediaTypeChange("image")}
              className={`flex h-8 items-center gap-1.5 rounded-lg px-3 text-[0.78rem] font-semibold transition ${
                mediaType === "image"
                  ? "bg-[#f4511e] text-white"
                  : "border border-black/[0.09] bg-white text-[#5c5e62] hover:bg-[#f0f2f5]"
              }`}
            >
              <ImageIcon size={12} />
              Image
            </button>
            <button
              type="button"
              onClick={() => handleMediaTypeChange("video")}
              className={`flex h-8 items-center gap-1.5 rounded-lg px-3 text-[0.78rem] font-semibold transition ${
                mediaType === "video"
                  ? "bg-[#f4511e] text-white"
                  : "border border-black/[0.09] bg-white text-[#5c5e62] hover:bg-[#f0f2f5]"
              }`}
            >
              <Film size={12} />
              Video
            </button>
          </div>

          {/* Drop zone */}
          <div
            className="flex h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-black/[0.09] bg-[#f9f9f9] transition hover:bg-[#f0f2f5]"
            onClick={() => fileInputRef.current?.click()}
          >
            {mediaType === "image" && imagePreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imagePreview} alt="" className="h-20 w-auto rounded object-contain" />
            ) : mediaFile && mediaType === "video" ? (
              <div className="flex flex-col items-center gap-1">
                <Film size={20} className="text-[#f4511e]" />
                <span className="max-w-[220px] truncate text-[0.72rem] text-[#5c5e62]">{mediaFile.name}</span>
              </div>
            ) : isEdit && initial?.media_type === "video" && !mediaFile ? (
              <div className="flex flex-col items-center gap-1 text-[#aaa]">
                <Film size={20} strokeWidth={1.5} />
                <span className="text-[0.72rem]">Current: video — click to replace</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1 text-[#bbb]">
                <Upload size={18} strokeWidth={1.5} />
                <span className="text-[0.72rem]">
                  Click to upload image or video (JPG, PNG, WebP, MP4, MOV, WebM)
                </span>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/mp4,video/mov,video/avi,video/webm"
              onChange={handleFileSelect}
              className="sr-only"
            />
          </div>
        </div>

        {/* CTA overrides (collapsible) */}
        <div className="sm:col-span-2">
          <button
            type="button"
            onClick={() => setCtaOpen((v) => !v)}
            className="flex items-center gap-1.5 text-[0.72rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62] transition hover:text-[#f4511e]"
          >
            {ctaOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            CTA Button Overrides (optional)
          </button>

          {ctaOpen && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label className="text-[0.68rem] font-semibold text-[#5c5e62]">Primary button label</label>
                <input
                  type="text"
                  value={ctaPrimaryLabel}
                  onChange={(e) => setCtaPrimaryLabel(e.target.value)}
                  placeholder="e.g. Request a Quote"
                  className="h-8 rounded-lg border border-black/[0.09] bg-white px-2.5 text-[0.83rem] text-[#1a1a1a] outline-none placeholder:text-[#bbb] transition focus:border-[#f4511e] focus:ring-2 focus:ring-[#f4511e]/10"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[0.68rem] font-semibold text-[#5c5e62]">Primary button URL</label>
                <input
                  type="text"
                  value={ctaPrimaryHref}
                  onChange={(e) => setCtaPrimaryHref(e.target.value)}
                  placeholder="/quote"
                  className="h-8 rounded-lg border border-black/[0.09] bg-white px-2.5 text-[0.83rem] text-[#1a1a1a] outline-none placeholder:text-[#bbb] transition focus:border-[#f4511e] focus:ring-2 focus:ring-[#f4511e]/10"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[0.68rem] font-semibold text-[#5c5e62]">Secondary button label</label>
                <input
                  type="text"
                  value={ctaSecondaryLabel}
                  onChange={(e) => setCtaSecondaryLabel(e.target.value)}
                  placeholder="e.g. Browse Catalogue"
                  className="h-8 rounded-lg border border-black/[0.09] bg-white px-2.5 text-[0.83rem] text-[#1a1a1a] outline-none placeholder:text-[#bbb] transition focus:border-[#f4511e] focus:ring-2 focus:ring-[#f4511e]/10"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[0.68rem] font-semibold text-[#5c5e62]">Secondary button URL</label>
                <input
                  type="text"
                  value={ctaSecondaryHref}
                  onChange={(e) => setCtaSecondaryHref(e.target.value)}
                  placeholder="/shop"
                  className="h-8 rounded-lg border border-black/[0.09] bg-white px-2.5 text-[0.83rem] text-[#1a1a1a] outline-none placeholder:text-[#bbb] transition focus:border-[#f4511e] focus:ring-2 focus:ring-[#f4511e]/10"
                />
              </div>
            </div>
          )}
        </div>
      </div>

        {/* Translations (DE / FR / ES) */}
        <div className="mt-4">
          <p className="mb-2 text-[0.72rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">
            Translations (optional)
          </p>

          {/* Locale tabs */}
          <div className="flex gap-1.5 border-b border-black/[0.06] pb-0 mb-3">
            {TRANS_LOCALES.map(({ locale, label }) => {
              const filled = hasTransContent(trans[locale]);
              return (
                <button
                  key={locale}
                  type="button"
                  onClick={() => setTransTab(locale)}
                  className={`relative -mb-px flex items-center gap-1.5 rounded-t-lg px-4 py-2 text-[0.78rem] font-bold transition ${
                    transTab === locale
                      ? "border border-b-white border-black/[0.08] bg-white text-[#1a1a1a]"
                      : "text-[#5c5e62] hover:text-[#1a1a1a]"
                  }`}
                >
                  {label}
                  {filled && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                </button>
              );
            })}
          </div>

          {/* Tab fields */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className="text-[0.68rem] font-semibold text-[#5c5e62]">Title ({transTab.toUpperCase()})</label>
              <input
                type="text"
                value={trans[transTab].title}
                onChange={(e) => patchTrans(transTab, { title: e.target.value })}
                placeholder="Translated title"
                className="h-9 rounded-xl border border-black/[0.09] bg-white px-3 text-[0.875rem] text-[#1a1a1a] outline-none placeholder:text-[#bbb] transition focus:border-[#f4511e] focus:ring-2 focus:ring-[#f4511e]/10"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[0.68rem] font-semibold text-[#5c5e62]">CTA Primary ({transTab.toUpperCase()})</label>
              <input
                type="text"
                value={trans[transTab].cta_primary}
                onChange={(e) => patchTrans(transTab, { cta_primary: e.target.value })}
                placeholder="e.g. Katalog ansehen"
                className="h-9 rounded-xl border border-black/[0.09] bg-white px-3 text-[0.875rem] text-[#1a1a1a] outline-none placeholder:text-[#bbb] transition focus:border-[#f4511e] focus:ring-2 focus:ring-[#f4511e]/10"
              />
            </div>
            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="text-[0.68rem] font-semibold text-[#5c5e62]">Subtitle ({transTab.toUpperCase()})</label>
              <textarea
                value={trans[transTab].subtitle}
                onChange={(e) => patchTrans(transTab, { subtitle: e.target.value })}
                placeholder="Translated subtitle"
                rows={2}
                className="resize-none rounded-xl border border-black/[0.09] bg-white px-3 py-2 text-[0.875rem] text-[#1a1a1a] outline-none placeholder:text-[#bbb] transition focus:border-[#f4511e] focus:ring-2 focus:ring-[#f4511e]/10"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[0.68rem] font-semibold text-[#5c5e62]">CTA Secondary ({transTab.toUpperCase()})</label>
              <input
                type="text"
                value={trans[transTab].cta_secondary}
                onChange={(e) => patchTrans(transTab, { cta_secondary: e.target.value })}
                placeholder="e.g. Angebot anfordern"
                className="h-9 rounded-xl border border-black/[0.09] bg-white px-3 text-[0.875rem] text-[#1a1a1a] outline-none placeholder:text-[#bbb] transition focus:border-[#f4511e] focus:ring-2 focus:ring-[#f4511e]/10"
              />
            </div>
          </div>
        </div>

      {/* Form actions */}
      <div className="mt-5 flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="flex h-9 items-center gap-1.5 rounded-full bg-[#f4511e] px-5 text-[0.83rem] font-semibold text-white transition hover:bg-[#df4618] disabled:opacity-60"
        >
          <Check size={13} strokeWidth={2.5} />
          {isPending ? "Saving…" : isEdit ? "Save Changes" : "Create Slide"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="flex h-9 items-center gap-1.5 rounded-full border border-black/10 bg-white px-4 text-[0.83rem] font-semibold text-[#1a1a1a] transition hover:bg-[#f0f2f5] disabled:opacity-50"
        >
          <X size={13} />
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Slide row ──────────────────────────────────────────────────────────────────

function SlideRow({
  slide,
  onEdit,
  onDeleted,
}: {
  slide: AdminHeroSlide;
  onEdit: () => void;
  onDeleted: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError]                 = useState<string | null>(null);
  const [isPending, startTransition]      = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteHeroSlide(slide.id);
      if (result.error) { setError(result.error); setConfirmDelete(false); }
      else onDeleted();
    });
  };

  const isVideo  = slide.media_type === "video";
  const thumbSrc = !isVideo ? (slide.image_url || null) : null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm">
        {/* Thumbnail */}
        <div className="relative flex h-16 w-[5.5rem] shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#f5f5f5]">
          {isVideo ? (
            <div className="flex flex-col items-center gap-1 text-[#bbb]">
              <Film size={20} strokeWidth={1.5} />
              <span className="text-[0.58rem] font-bold uppercase tracking-wide">Video</span>
            </div>
          ) : thumbSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumbSrc} alt={slide.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-1 text-[#bbb]">
              <ImageIcon size={20} strokeWidth={1.5} />
              <span className="text-[0.58rem] font-bold uppercase tracking-wide">No media</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="truncate text-[0.875rem] font-bold text-[#1a1a1a]">{slide.title}</p>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[0.63rem] font-bold uppercase tracking-wide ${
              isVideo ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
            }`}>
              {isVideo ? "Video" : "Image"}
            </span>
            <span className="shrink-0 rounded-full bg-[#f5f5f5] px-2 py-0.5 text-[0.63rem] font-bold text-[#5c5e62]">
              Order #{slide.order}
            </span>
          </div>
          <p className="mt-0.5 line-clamp-1 text-[0.78rem] text-[#5c5e62]">{slide.subtitle}</p>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={onEdit}
            title="Edit slide"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#5c5e62] transition hover:bg-[#f4511e]/10 hover:text-[#f4511e]"
          >
            <Pencil size={13} strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            title="Delete slide"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#5c5e62] transition hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 size={13} strokeWidth={2} />
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-1.5 text-[0.72rem] text-red-600">{error}</p>
      )}

      {confirmDelete && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl bg-red-50 px-4 py-3">
          <p className="flex-1 text-[0.78rem] font-semibold text-[#1a1a1a]">
            Delete <span className="text-[#f4511e]">"{slide.title}"</span>? This removes the slide and its media.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              disabled={isPending}
              className="rounded-full border border-black/10 bg-white px-3 py-1 text-[0.75rem] font-semibold text-[#1a1a1a] transition hover:bg-[#f0f2f5] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="rounded-full bg-red-600 px-3 py-1 text-[0.75rem] font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
            >
              {isPending ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main manager ──────────────────────────────────────────────────────────────

type Mode = "list" | "add" | { editing: AdminHeroSlide };

export default function HeroSlidesManager({ slides }: { slides: AdminHeroSlide[] }) {
  const router       = useRouter();
  const [mode, setMode] = useState<Mode>("list");

  const refresh = () => {
    setMode("list");
    router.push("/admin/hero-slides");
  };

  const isFormOpen = mode === "add" || (typeof mode === "object" && "editing" in mode);

  return (
    <div className="flex flex-col gap-4">
      {/* Form panel */}
      {isFormOpen && (
        <SlideForm
          initial={typeof mode === "object" && "editing" in mode ? mode.editing : undefined}
          onSaved={refresh}
          onCancel={() => setMode("list")}
        />
      )}

      {/* Add button */}
      {!isFormOpen && (
        <button
          type="button"
          onClick={() => setMode("add")}
          className="flex h-10 w-fit items-center gap-2 rounded-full bg-[#f4511e] px-5 text-[0.83rem] font-semibold text-white transition hover:bg-[#df4618]"
        >
          <Plus size={14} strokeWidth={2.5} />
          Add Slide
        </button>
      )}

      {/* Slides list */}
      {slides.length === 0 && !isFormOpen ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-black/[0.08] bg-white py-16 text-center">
          <p className="text-[0.875rem] font-semibold text-[#5c5e62]">No slides yet</p>
          <p className="mt-1 text-[0.78rem] text-[#aaa]">Add your first slide above</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {[...slides]
            .sort((a, b) => a.order - b.order)
            .map((slide) => (
              <SlideRow
                key={slide.id}
                slide={slide}
                onEdit={() => setMode({ editing: slide })}
                onDeleted={refresh}
              />
            ))}
        </div>
      )}
    </div>
  );
}
