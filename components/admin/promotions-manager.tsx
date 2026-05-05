"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Plus,
  Pencil,
  Trash2,
  ImagePlus,
  Check,
  X,
  ToggleLeft,
  ToggleRight,
  Calendar,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { AdminPromotion } from "@/lib/admin-api";
import {
  createPromotion,
  updatePromotion,
  togglePromotion,
  deletePromotion,
} from "@/app/admin/promotions/actions";

// ── Types ──────────────────────────────────────────────────────────────────────

type FormState = {
  title: string;
  subheadline: string;
  short_text: string;
  emoji: string;
  button_text: string;
  button_link: string;
  placement: "announcement_bar" | "shop_inline" | "shop_hero" | "both";
  brand_name: string;
  customer_type_target: "" | "all" | "b2c" | "b2b";
  discount_pct: string;
  promo_code: string;
  is_active: boolean;
  start_date: string;
  end_date: string;
};

const EMPTY_FORM: FormState = {
  title: "",
  subheadline: "",
  short_text: "",
  emoji: "",
  button_text: "",
  button_link: "",
  placement: "shop_inline",
  brand_name: "",
  customer_type_target: "",
  discount_pct: "",
  promo_code: "",
  is_active: false,
  start_date: "",
  end_date: "",
};

function promoToForm(p: AdminPromotion): FormState {
  return {
    title:                p.title ?? "",
    subheadline:          p.subheadline ?? "",
    short_text:           p.short_text ?? "",
    emoji:                p.emoji ?? "",
    button_text:          p.button_text ?? "",
    button_link:          p.button_link ?? "",
    placement:            (p.placement as FormState["placement"]) ?? "shop_inline",
    brand_name:           p.brand_name ?? "",
    customer_type_target: (p.customer_type_target as FormState["customer_type_target"]) ?? "",
    discount_pct:         p.discount_pct != null ? String(p.discount_pct) : "",
    promo_code:           p.promo_code ?? p.code ?? "",
    is_active:            p.is_active,
    start_date:           p.start_date ?? "",
    end_date:             p.end_date ?? "",
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtDate(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function isExpired(p: AdminPromotion): boolean {
  if (!p.end_date) return false;
  return new Date(p.end_date) < new Date();
}

// ── Form panel ─────────────────────────────────────────────────────────────────

function PromotionForm({
  editing,
  form,
  onChange,
  onSave,
  onCancel,
  isBusy,
  error,
}: {
  editing: AdminPromotion | null;
  form: FormState;
  onChange: (f: FormState) => void;
  onSave: () => void;
  onCancel: () => void;
  isBusy: boolean;
  error: string | null;
}) {
  const set = (k: keyof FormState, v: string | boolean) =>
    onChange({ ...form, [k]: v });

  return (
    <div className="mb-6 rounded-2xl border border-black/[0.08] bg-white p-6">
      <h3 className="mb-4 text-[0.9rem] font-bold text-[#1a1a1a]">
        {editing ? "Edit Promotion" : "New Promotion"}
      </h3>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Placement */}
        <div className="sm:col-span-2">
          <label className="mb-1 block text-[0.75rem] font-semibold text-[#5c5e62]">
            Placement <span className="text-red-500">*</span>
          </label>
          <select
            value={form.placement}
            onChange={(e) => set("placement", e.target.value as FormState["placement"])}
            className="w-full rounded-xl border border-black/[0.12] px-3.5 py-2.5 text-[0.875rem] text-[#1a1a1a] outline-none transition focus:border-[#E85C1A] focus:ring-2 focus:ring-[#E85C1A]/15"
          >
            <option value="shop_inline">Shop Inline Banner (between filters and products)</option>
            <option value="shop_hero">Shop Hero Campaign Banner (above filters, with brand + promo code)</option>
            <option value="announcement_bar">Announcement Bar (top of every page)</option>
            <option value="both">Both placements</option>
          </select>
        </div>

        {/* Campaign fields — always visible */}
        <div>
          <label className="mb-1 block text-[0.75rem] font-semibold text-[#5c5e62]">
            Brand Name
          </label>
          <input
            type="text"
            value={form.brand_name}
            onChange={(e) => set("brand_name", e.target.value)}
            placeholder="e.g. Rapid"
            className="w-full rounded-xl border border-black/[0.12] px-3.5 py-2.5 text-[0.875rem] text-[#1a1a1a] outline-none transition focus:border-[#E85C1A] focus:ring-2 focus:ring-[#E85C1A]/15"
          />
          <p className="mt-1 text-[0.72rem] text-[#9ca3af]">
            Must match the brand name on products exactly — used to show discount badges.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-[0.75rem] font-semibold text-[#5c5e62]">
            Customer Target
          </label>
          <select
            value={form.customer_type_target}
            onChange={(e) => set("customer_type_target", e.target.value as FormState["customer_type_target"])}
            className="w-full rounded-xl border border-black/[0.12] px-3.5 py-2.5 text-[0.875rem] text-[#1a1a1a] outline-none transition focus:border-[#E85C1A] focus:ring-2 focus:ring-[#E85C1A]/15"
          >
            <option value="">— No targeting (show to all) —</option>
            <option value="all">All customers</option>
            <option value="b2c">B2C customers only</option>
            <option value="b2b">B2B customers only</option>
          </select>
          <p className="mt-1 text-[0.72rem] text-[#9ca3af]">
            B2C campaigns are hidden from B2B accounts.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-[0.75rem] font-semibold text-[#5c5e62]">
            Discount %
          </label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={form.discount_pct}
            onChange={(e) => set("discount_pct", e.target.value)}
            placeholder="e.g. 5"
            className="w-full rounded-xl border border-black/[0.12] px-3.5 py-2.5 text-[0.875rem] text-[#1a1a1a] outline-none transition focus:border-[#E85C1A] focus:ring-2 focus:ring-[#E85C1A]/15"
          />
          <p className="mt-1 text-[0.72rem] text-[#9ca3af]">
            Shown as a badge on matching brand products in the shop.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-[0.75rem] font-semibold text-[#5c5e62]">
            Promo Code
          </label>
          <input
            type="text"
            value={form.promo_code}
            onChange={(e) => set("promo_code", e.target.value.toUpperCase())}
            placeholder="e.g. RAPID5"
            className="w-full rounded-xl border border-black/[0.12] px-3.5 py-2.5 font-mono text-[0.875rem] text-[#1a1a1a] outline-none transition focus:border-[#E85C1A] focus:ring-2 focus:ring-[#E85C1A]/15"
          />
          <p className="mt-1 text-[0.72rem] text-[#9ca3af]">
            Displayed on the campaign banner with a copy button. Customers apply it at checkout.
          </p>
        </div>

        {/* Title */}
        <div className="sm:col-span-2">
          <label className="mb-1 block text-[0.75rem] font-semibold text-[#5c5e62]">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="e.g. Summer Sale — Up to 30% Off"
            className="w-full rounded-xl border border-black/[0.12] px-3.5 py-2.5 text-[0.875rem] text-[#1a1a1a] outline-none transition focus:border-[#E85C1A] focus:ring-2 focus:ring-[#E85C1A]/15"
          />
        </div>

        {/* Subheadline — for Shop Inline Banner */}
        {(form.placement === "shop_inline" || form.placement === "both") && (
          <div className="sm:col-span-2">
            <label className="mb-1 block text-[0.75rem] font-semibold text-[#5c5e62]">
              Subheadline <span className="text-[#9ca3af]">(Shop Inline)</span>
            </label>
            <input
              type="text"
              value={form.subheadline}
              onChange={(e) => set("subheadline", e.target.value)}
              placeholder="e.g. Premium PCR & TBR tyres — limited stock"
              className="w-full rounded-xl border border-black/[0.12] px-3.5 py-2.5 text-[0.875rem] text-[#1a1a1a] outline-none transition focus:border-[#E85C1A] focus:ring-2 focus:ring-[#E85C1A]/15"
            />
          </div>
        )}

        {/* Short text + Emoji — for Announcement Bar */}
        {(form.placement === "announcement_bar" || form.placement === "both") && (
          <>
            <div>
              <label className="mb-1 block text-[0.75rem] font-semibold text-[#5c5e62]">
                Short Text <span className="text-[#9ca3af]">(Announcement Bar)</span>
              </label>
              <input
                type="text"
                value={form.short_text}
                onChange={(e) => set("short_text", e.target.value)}
                placeholder="e.g. Free shipping on orders over €500"
                className="w-full rounded-xl border border-black/[0.12] px-3.5 py-2.5 text-[0.875rem] text-[#1a1a1a] outline-none transition focus:border-[#E85C1A] focus:ring-2 focus:ring-[#E85C1A]/15"
              />
            </div>
            <div>
              <label className="mb-1 block text-[0.75rem] font-semibold text-[#5c5e62]">
                Emoji <span className="text-[#9ca3af]">(optional)</span>
              </label>
              <input
                type="text"
                value={form.emoji}
                onChange={(e) => set("emoji", e.target.value)}
                placeholder="e.g. 🚚"
                maxLength={4}
                className="w-full rounded-xl border border-black/[0.12] px-3.5 py-2.5 text-[0.875rem] text-[#1a1a1a] outline-none transition focus:border-[#E85C1A] focus:ring-2 focus:ring-[#E85C1A]/15"
              />
            </div>
          </>
        )}

        {/* Button text */}
        <div>
          <label className="mb-1 block text-[0.75rem] font-semibold text-[#5c5e62]">
            Button Text
          </label>
          <input
            type="text"
            value={form.button_text}
            onChange={(e) => set("button_text", e.target.value)}
            placeholder="e.g. Shop Now"
            className="w-full rounded-xl border border-black/[0.12] px-3.5 py-2.5 text-[0.875rem] text-[#1a1a1a] outline-none transition focus:border-[#E85C1A] focus:ring-2 focus:ring-[#E85C1A]/15"
          />
        </div>

        {/* Button link */}
        <div>
          <label className="mb-1 block text-[0.75rem] font-semibold text-[#5c5e62]">
            Button Link
          </label>
          <input
            type="text"
            value={form.button_link}
            onChange={(e) => set("button_link", e.target.value)}
            placeholder="e.g. /shop?type=PCR"
            className="w-full rounded-xl border border-black/[0.12] px-3.5 py-2.5 text-[0.875rem] text-[#1a1a1a] outline-none transition focus:border-[#E85C1A] focus:ring-2 focus:ring-[#E85C1A]/15"
          />
        </div>

        {/* Start date */}
        <div>
          <label className="mb-1 block text-[0.75rem] font-semibold text-[#5c5e62]">
            Start Date
          </label>
          <input
            type="date"
            value={form.start_date}
            onChange={(e) => set("start_date", e.target.value)}
            className="w-full rounded-xl border border-black/[0.12] px-3.5 py-2.5 text-[0.875rem] text-[#1a1a1a] outline-none transition focus:border-[#E85C1A] focus:ring-2 focus:ring-[#E85C1A]/15"
          />
        </div>

        {/* End date */}
        <div>
          <label className="mb-1 block text-[0.75rem] font-semibold text-[#5c5e62]">
            End Date
          </label>
          <input
            type="date"
            value={form.end_date}
            onChange={(e) => set("end_date", e.target.value)}
            className="w-full rounded-xl border border-black/[0.12] px-3.5 py-2.5 text-[0.875rem] text-[#1a1a1a] outline-none transition focus:border-[#E85C1A] focus:ring-2 focus:ring-[#E85C1A]/15"
          />
        </div>

        {/* Active toggle */}
        <div className="sm:col-span-2">
          <label className="flex cursor-pointer items-center gap-3">
            <button
              type="button"
              onClick={() => set("is_active", !form.is_active)}
              className="shrink-0 text-[#E85C1A] transition hover:opacity-80"
            >
              {form.is_active ? (
                <ToggleRight size={28} />
              ) : (
                <ToggleLeft size={28} className="text-[#9ca3af]" />
              )}
            </button>
            <span className="text-[0.875rem] font-medium text-[#1a1a1a]">
              {form.is_active ? "Active — visible to customers" : "Inactive — hidden from customers"}
            </span>
          </label>
        </div>
      </div>

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-[0.8rem] text-red-600">
          {error}
        </p>
      )}

      <div className="mt-5 flex gap-3">
        <button
          type="button"
          onClick={onSave}
          disabled={isBusy || !form.title.trim()}
          className="flex items-center gap-2 rounded-xl bg-[#E85C1A] px-5 py-2.5 text-[0.875rem] font-semibold text-white transition hover:bg-[#d94f14] disabled:opacity-50"
        >
          <Check size={15} />
          {isBusy ? "Saving…" : editing ? "Save Changes" : "Create Promotion"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isBusy}
          className="flex items-center gap-2 rounded-xl border border-black/[0.12] px-5 py-2.5 text-[0.875rem] font-semibold text-[#5c5e62] transition hover:bg-[#f0f2f5]"
        >
          <X size={15} />
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Promotion row ──────────────────────────────────────────────────────────────

function PromotionRow({
  promo,
  onEdit,
  onDeleted,
  onToggled,
  onImageUploaded,
}: {
  promo: AdminPromotion;
  onEdit: () => void;
  onDeleted: () => void;
  onToggled: (active: boolean) => void;
  onImageUploaded: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPending, startTransition]      = useTransition();
  const [error, setError]                 = useState<string | null>(null);
  const [uploading, setUploading]         = useState(false);
  const imgInputRef                       = useRef<HTMLInputElement>(null);

  const expired = isExpired(promo);

  const handleToggle = () => {
    setError(null);
    startTransition(async () => {
      const result = await togglePromotion(promo.id, !promo.is_active);
      if (result.error) setError(result.error);
      else onToggled(!promo.is_active);
    });
  };

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const result = await deletePromotion(promo.id);
      if (result.error) setError(result.error);
      else onDeleted();
    });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    const fd = new FormData();
    fd.append("image", file);
    try {
      const res = await fetch(
        `/api/admin/promotions-upload?promotionId=${promo.id}`,
        { method: "POST", body: fd }
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) setError(json.error || "Upload failed.");
      else onImageUploaded();
    } catch {
      setError("Network error during upload.");
    } finally {
      setUploading(false);
      if (imgInputRef.current) imgInputRef.current.value = "";
    }
  };

  return (
    <div className={[
      "rounded-2xl border bg-white p-5 transition",
      promo.is_active && !expired
        ? "border-[#E85C1A]/30 shadow-sm"
        : "border-black/[0.08]",
    ].join(" ")}>
      <div className="flex items-start gap-4">
        {/* Thumbnail */}
        <div className="relative h-[72px] w-[120px] shrink-0 overflow-hidden rounded-xl bg-[#f0f2f5]">
          {promo.image_url ? (
            <Image
              src={promo.image_url}
              alt={promo.title}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <ImagePlus size={20} className="text-[#9ca3af]" />
            </div>
          )}
          <button
            type="button"
            title="Upload image"
            onClick={() => imgInputRef.current?.click()}
            disabled={uploading}
            className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40 opacity-0 transition hover:opacity-100 disabled:opacity-50"
          >
            <ImagePlus size={18} className="text-white" />
          </button>
          <input
            ref={imgInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-[0.9rem] font-semibold text-[#1a1a1a]">
              {promo.title}
            </span>
            {promo.is_active && !expired && (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-green-700">
                Active
              </span>
            )}
            {expired && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-red-600">
                Expired
              </span>
            )}
            {!promo.is_active && !expired && (
              <span className="rounded-full bg-[#f0f2f5] px-2 py-0.5 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#9ca3af]">
                Inactive
              </span>
            )}
          </div>

          {(promo.subheadline || promo.short_text) && (
            <p className="mt-0.5 truncate text-[0.8rem] text-[#5c5e62]">
              {promo.emoji && <span className="mr-1">{promo.emoji}</span>}
              {promo.short_text || promo.subheadline}
            </p>
          )}

          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {promo.placement === "announcement_bar" && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-amber-700">
                Announcement Bar
              </span>
            )}
            {promo.placement === "shop_inline" && (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-blue-700">
                Shop Inline
              </span>
            )}
            {promo.placement === "shop_hero" && (
              <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-orange-700">
                Shop Hero Campaign
              </span>
            )}
            {promo.placement === "both" && (
              <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-purple-700">
                Both Placements
              </span>
            )}
            {!promo.placement && (
              <span className="rounded-full bg-[#f0f2f5] px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-[#9ca3af]">
                Shop Inline
              </span>
            )}
            {promo.brand_name && (
              <span className="rounded-full bg-[#f0f2f5] px-2 py-0.5 text-[0.65rem] font-semibold text-[#5c5e62]">
                {promo.brand_name}
              </span>
            )}
            {promo.discount_pct != null && (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-[0.65rem] font-bold text-green-700">
                {promo.discount_pct}% OFF
              </span>
            )}
            {promo.promo_code && (
              <span className="rounded-full border border-[#f4511e]/20 bg-[#fff8f6] px-2 py-0.5 font-mono text-[0.65rem] font-bold tracking-widest text-[#f4511e]">
                {promo.promo_code}
              </span>
            )}
            {promo.customer_type_target && promo.customer_type_target !== "all" && (
              <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-sky-700">
                {promo.customer_type_target.toUpperCase()} only
              </span>
            )}
          </div>

          {(promo.start_date || promo.end_date) && (
            <div className="mt-1.5 flex items-center gap-1.5 text-[0.75rem] text-[#9ca3af]">
              <Calendar size={11} />
              <span>
                {fmtDate(promo.start_date)} — {fmtDate(promo.end_date)}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            title={promo.is_active ? "Deactivate" : "Activate"}
            onClick={handleToggle}
            disabled={isPending}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/[0.08] bg-white text-[#5c5e62] transition hover:bg-[#f0f2f5] disabled:opacity-50"
          >
            {promo.is_active ? (
              <ToggleRight size={17} className="text-[#E85C1A]" />
            ) : (
              <ToggleLeft size={17} />
            )}
          </button>

          <button
            type="button"
            title="Edit"
            onClick={onEdit}
            disabled={isPending}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/[0.08] bg-white text-[#5c5e62] transition hover:bg-[#f0f2f5] disabled:opacity-50"
          >
            <Pencil size={15} />
          </button>

          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="flex h-9 items-center gap-1.5 rounded-xl bg-red-600 px-3 text-[0.78rem] font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                <Trash2 size={13} />
                Delete
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                disabled={isPending}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/[0.08] bg-white text-[#5c5e62] transition hover:bg-[#f0f2f5]"
              >
                <X size={15} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              title="Delete"
              onClick={() => setConfirmDelete(true)}
              disabled={isPending}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/[0.08] bg-white text-[#5c5e62] transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-[0.8rem] text-red-600">
          {error}
        </p>
      )}

      {uploading && (
        <p className="mt-2 text-[0.78rem] text-[#9ca3af]">Uploading image…</p>
      )}
    </div>
  );
}

// ── Manager ────────────────────────────────────────────────────────────────────

export default function PromotionsManager({
  promotions: initial,
}: {
  promotions: AdminPromotion[];
}) {
  const router = useRouter();
  const [promotions, setPromotions] = useState<AdminPromotion[]>(initial);
  const [formOpen, setFormOpen]     = useState(false);
  const [editingPromo, setEditingPromo] = useState<AdminPromotion | null>(null);
  const [form, setForm]             = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError]   = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const refresh = () => router.refresh();

  const openCreate = () => {
    setEditingPromo(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setFormOpen(true);
  };

  const openEdit = (p: AdminPromotion) => {
    setEditingPromo(p);
    setForm(promoToForm(p));
    setFormError(null);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingPromo(null);
    setForm(EMPTY_FORM);
    setFormError(null);
  };

  const handleSave = () => {
    if (!form.title.trim()) { setFormError("Title is required."); return; }
    setFormError(null);

    const payload = {
      title:                form.title.trim(),
      subheadline:          form.subheadline.trim() || undefined,
      short_text:           form.short_text.trim() || undefined,
      emoji:                form.emoji.trim() || undefined,
      button_text:          form.button_text.trim() || undefined,
      button_link:          form.button_link.trim() || undefined,
      placement:            form.placement,
      brand_name:           form.brand_name.trim() || undefined,
      customer_type_target: form.customer_type_target || undefined,
      discount_pct:         form.discount_pct !== "" ? Number(form.discount_pct) : undefined,
      promo_code:           form.promo_code.trim() || undefined,
      code:                 form.promo_code.trim() || undefined,
      is_active:            form.is_active,
      start_date:           form.start_date || undefined,
      end_date:             form.end_date || undefined,
    };

    startTransition(async () => {
      if (editingPromo) {
        const result = await updatePromotion(editingPromo.id, payload);
        if (result.error) { setFormError(result.error); return; }
      } else {
        const result = await createPromotion(payload);
        if (result.error) { setFormError(result.error); return; }
      }
      closeForm();
      refresh();
    });
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      {!formOpen && (
        <div className="flex items-center justify-between">
          <p className="text-[0.8rem] text-[#5c5e62]">
            {promotions.length === 0 ? "No promotions yet." : ""}
          </p>
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-2 rounded-xl bg-[#E85C1A] px-4 py-2.5 text-[0.875rem] font-semibold text-white transition hover:bg-[#d94f14]"
          >
            <Plus size={16} />
            New Promotion
          </button>
        </div>
      )}

      {/* Form */}
      {formOpen && (
        <PromotionForm
          editing={editingPromo}
          form={form}
          onChange={setForm}
          onSave={handleSave}
          onCancel={closeForm}
          isBusy={isPending}
          error={formError}
        />
      )}

      {/* Add button when form is open */}
      {formOpen && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={closeForm}
            className="text-[0.8rem] text-[#9ca3af] hover:text-[#5c5e62]"
          >
            Close form
          </button>
        </div>
      )}

      {/* Promotion list */}
      {initial.length === 0 && !formOpen && (
        <div className="rounded-2xl border border-dashed border-black/[0.12] bg-white px-6 py-12 text-center">
          <p className="text-[0.875rem] text-[#9ca3af]">
            No promotions yet. Create one to display a banner on the shop page.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {initial.map((p) => (
          <PromotionRow
            key={p.id}
            promo={p}
            onEdit={() => openEdit(p)}
            onDeleted={refresh}
            onToggled={refresh}
            onImageUploaded={refresh}
          />
        ))}
      </div>
    </div>
  );
}
