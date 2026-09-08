"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Pencil, Trash2, Upload, Check, X, ImagePlus, FileText } from "lucide-react";
import {
  createBrand,
  updateBrand,
  uploadBrandLogo,
  deleteBrand,
} from "@/app/admin/brands/actions";
import type { AdminBrand } from "@/lib/admin-api";

// ── Brand card ────────────────────────────────────────────────────────────────

function BrandCard({
  brand,
  onDeleted,
  onUpdated,
}: {
  brand: AdminBrand;
  onDeleted: () => void;
  onUpdated: () => void;
}) {
  const [editingName, setEditingName]     = useState(false);
  const [nameInput, setNameInput]         = useState(brand.name);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError]                 = useState<string | null>(null);
  const [isPending, startTransition]      = useTransition();
  const logoInputRef                      = useRef<HTMLInputElement>(null);

  const handleSaveName = () => {
    if (!nameInput.trim() || nameInput.trim() === brand.name) {
      setEditingName(false);
      setNameInput(brand.name);
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await updateBrand(brand.id, nameInput.trim());
      if (result.error) { setError(result.error); }
      else { setEditingName(false); onUpdated(); }
    });
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    const fd = new FormData();
    fd.append("logo", file);
    startTransition(async () => {
      const result = await uploadBrandLogo(brand.id, fd);
      if (result.error) setError(result.error);
      else onUpdated();
    });
    e.target.value = "";
  };

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const result = await deleteBrand(brand.id);
      if (result.error) { setError(result.error); setConfirmDelete(false); }
      else onDeleted();
    });
  };

  return (
    <div className="relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm">
      {/* Logo area */}
      <div className="flex h-36 items-center justify-center bg-[#f5f5f5] p-4">
        {brand.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={brand.logo_url}
            alt={brand.name}
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-[#ccc]">
            <ImagePlus size={28} strokeWidth={1.5} />
            <span className="text-[0.7rem] font-semibold">No logo</span>
          </div>
        )}

        {/* Replace logo button */}
        <button
          type="button"
          onClick={() => logoInputRef.current?.click()}
          disabled={isPending}
          title="Replace logo"
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-[#f4511e] disabled:opacity-50"
        >
          <Upload size={12} strokeWidth={2.5} />
        </button>
        <input
          ref={logoInputRef}
          type="file"
          accept="image/*"
          onChange={handleLogoChange}
          className="sr-only"
        />
      </div>

      {/* Name + actions */}
      <div className="flex flex-col gap-2 p-4">
        {error && (
          <p className="rounded-lg bg-red-50 px-2.5 py-1.5 text-[0.72rem] text-red-600">{error}</p>
        )}

        {editingName ? (
          <div className="flex gap-1.5">
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSaveName(); if (e.key === "Escape") { setEditingName(false); setNameInput(brand.name); } }}
              autoFocus
              className="h-8 flex-1 rounded-lg border border-[#f4511e] bg-white px-2.5 text-[0.83rem] font-semibold text-[#1a1a1a] outline-none ring-2 ring-[#f4511e]/10"
            />
            <button
              type="button"
              onClick={handleSaveName}
              disabled={isPending}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-white transition hover:bg-emerald-600 disabled:opacity-50"
            >
              <Check size={13} strokeWidth={2.5} />
            </button>
            <button
              type="button"
              onClick={() => { setEditingName(false); setNameInput(brand.name); }}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/[0.09] bg-white text-[#5c5e62] transition hover:bg-[#f0f2f5]"
            >
              <X size={13} />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-[0.875rem] font-bold text-[#1a1a1a]">{brand.name}</p>
            <div className="flex shrink-0 gap-1">
              {/* Session 93 — content defaults inherited by every product of
                  the brand: rich description, spec defaults, shipping/returns. */}
              <Link
                href={`/admin/brands/${brand.id}`}
                title="Brand content — description, spec defaults, shipping & returns for all its products"
                className="flex h-7 w-7 items-center justify-center rounded-lg text-[#5c5e62] transition hover:bg-[#f4511e]/10 hover:text-[#f4511e]"
              >
                <FileText size={13} strokeWidth={2} />
              </Link>
              <button
                type="button"
                onClick={() => { setEditingName(true); setNameInput(brand.name); }}
                title="Edit name"
                className="flex h-7 w-7 items-center justify-center rounded-lg text-[#5c5e62] transition hover:bg-[#f4511e]/10 hover:text-[#f4511e]"
              >
                <Pencil size={13} strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                title="Delete"
                className="flex h-7 w-7 items-center justify-center rounded-lg text-[#5c5e62] transition hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 size={13} strokeWidth={2} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete confirmation overlay */}
      {confirmDelete && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl bg-white/95 p-5 text-center backdrop-blur-sm">
          <p className="text-[0.83rem] font-semibold text-[#1a1a1a]">Delete <span className="text-[#f4511e]">{brand.name}</span>?</p>
          <p className="text-[0.75rem] text-[#5c5e62]">This removes the brand and its logo.</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              disabled={isPending}
              className="rounded-full border border-black/10 bg-white px-4 py-1.5 text-[0.78rem] font-semibold text-[#1a1a1a] transition hover:bg-[#f0f2f5] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="rounded-full bg-red-600 px-4 py-1.5 text-[0.78rem] font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
            >
              {isPending ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Add brand form ────────────────────────────────────────────────────────────

function AddBrandCard({ onAdded }: { onAdded: () => void }) {
  const [name, setName]               = useState("");
  const [logoFile, setLogoFile]       = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [error, setError]             = useState<string | null>(null);
  const [isPending, startTransition]  = useTransition();
  const fileInputRef                  = useRef<HTMLInputElement>(null);

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleAdd = () => {
    if (!name.trim()) { setError("Brand name is required."); return; }
    setError(null);
    startTransition(async () => {
      const result = await createBrand(name.trim());
      if (result.error) { setError(result.error); return; }

      // Upload logo if selected
      if (logoFile && result.id) {
        const fd = new FormData();
        fd.append("logo", logoFile);
        const logoResult = await uploadBrandLogo(result.id, fd);
        if (logoResult.error) { setError(logoResult.error); return; }
      }

      setName("");
      setLogoFile(null);
      setLogoPreview(null);
      onAdded();
    });
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border-2 border-dashed border-black/[0.1] bg-white shadow-sm">
      {/* Logo preview / picker */}
      <div
        className="flex h-36 cursor-pointer flex-col items-center justify-center gap-2 bg-[#f9f9f9] transition hover:bg-[#f0f2f5]"
        onClick={() => fileInputRef.current?.click()}
      >
        {logoPreview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoPreview} alt="" className="max-h-full max-w-full object-contain p-4" />
        ) : (
          <>
            <ImagePlus size={24} strokeWidth={1.5} className="text-[#bbb]" />
            <span className="text-[0.72rem] font-semibold text-[#aaa]">Click to add logo</span>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleLogoSelect}
          className="sr-only"
        />
      </div>

      {/* Name input + add button */}
      <div className="flex flex-col gap-2.5 p-4">
        {error && (
          <p className="rounded-lg bg-red-50 px-2.5 py-1.5 text-[0.72rem] text-red-600">{error}</p>
        )}
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
          placeholder="Brand name"
          className="h-8 w-full rounded-lg border border-black/[0.09] bg-white px-2.5 text-[0.83rem] text-[#1a1a1a] outline-none placeholder:text-[#bbb] transition focus:border-[#f4511e] focus:ring-2 focus:ring-[#f4511e]/10"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={isPending}
          className="flex h-8 items-center justify-center gap-1.5 rounded-lg bg-[#f4511e] text-[0.8rem] font-semibold text-white transition hover:bg-[#df4618] disabled:opacity-60"
        >
          <Plus size={13} strokeWidth={2.5} />
          {isPending ? "Adding…" : "Add Brand"}
        </button>
      </div>
    </div>
  );
}

// ── Main manager ──────────────────────────────────────────────────────────────

export default function BrandsManager({ brands }: { brands: AdminBrand[] }) {
  const router = useRouter();

  const refresh = () => router.push("/admin/brands");

  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {/* Add brand card — always first */}
      <AddBrandCard onAdded={refresh} />

      {/* Existing brands */}
      {brands.map((brand) => (
        <BrandCard
          key={brand.id}
          brand={brand}
          onDeleted={refresh}
          onUpdated={refresh}
        />
      ))}
    </div>
  );
}
