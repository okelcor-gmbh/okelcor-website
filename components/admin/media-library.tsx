"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import {
  Upload, Search, Trash2, Copy, Check, X, ImageOff, ChevronLeft, ChevronRight,
} from "lucide-react";
import type { MediaItem, MediaCollection } from "@/lib/admin-api";

const COLLECTIONS: { value: "" | MediaCollection; label: string }[] = [
  { value: "",            label: "All" },
  { value: "articles",   label: "Articles" },
  { value: "products",   label: "Products" },
  { value: "hero",       label: "Hero" },
  { value: "brands",     label: "Brands" },
  { value: "categories", label: "Categories" },
  { value: "general",    label: "General" },
];

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

// ── Upload dialog ─────────────────────────────────────────────────────────────

function UploadDialog({ onClose, onUploaded }: { onClose: () => void; onUploaded: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [collection, setCollection] = useState<string>("general");
  const [altText, setAltText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!file) return;
    setUploading(true);
    setError("");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("collection", collection);
    if (altText.trim()) fd.append("alt_text", altText.trim());
    try {
      const res = await fetch("/api/admin/media", { method: "POST", body: fd });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j?.error ?? j?.message ?? "Upload failed.");
        return;
      }
      onUploaded();
      onClose();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-bold uppercase tracking-widest text-[#5c5e62]">Upload Media</p>
          <button type="button" onClick={onClose} className="text-[#aaa] hover:text-[#333]">
            <X size={18} />
          </button>
        </div>

        {/* File picker */}
        <div
          onClick={() => fileRef.current?.click()}
          className="mb-3 flex h-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-black/[0.1] bg-[#fafafa] text-sm text-[#aaa] transition hover:border-[#E85C1A] hover:text-[#E85C1A]"
        >
          <Upload size={20} />
          <span>{file ? file.name : "Click or drag to pick a file"}</span>
          {file && <span className="text-xs">{fmtBytes(file.size)}</span>}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*,.svg"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />

        {/* Collection */}
        <select
          value={collection}
          onChange={(e) => setCollection(e.target.value)}
          className="mb-3 h-9 w-full rounded-lg border border-black/[0.09] bg-white px-2.5 text-sm text-[#1a1a1a] outline-none focus:border-[#E85C1A]"
        >
          {COLLECTIONS.filter((c) => c.value).map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>

        {/* Alt text */}
        <input
          type="text"
          value={altText}
          onChange={(e) => setAltText(e.target.value)}
          placeholder="Alt text (optional)"
          className="mb-3 h-9 w-full rounded-lg border border-black/[0.09] px-2.5 text-sm text-[#1a1a1a] outline-none focus:border-[#E85C1A]"
        />

        {error && <p className="mb-3 text-xs text-red-600">{error}</p>}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!file || uploading}
            className="h-9 flex-1 rounded-lg bg-[#E85C1A] text-sm font-semibold text-white transition hover:bg-[#d14f14] disabled:opacity-50"
          >
            {uploading ? "Uploading…" : "Upload"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-9 flex-1 rounded-lg border border-black/[0.09] bg-white text-sm font-semibold text-[#5c5e62] transition hover:bg-[#f0f2f5]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Media grid item ───────────────────────────────────────────────────────────

function MediaCard({
  item,
  onDelete,
}: {
  item: MediaItem;
  onDelete: (id: number) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isImage = item.mime_type.startsWith("image/");

  const copyUrl = async () => {
    await navigator.clipboard.writeText(item.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${item.original_name}"?`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/media/${item.id}`, { method: "DELETE" });
      if (res.ok) onDelete(item.id);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-xl border border-black/[0.07] bg-white shadow-sm transition hover:shadow-md">
      {/* Thumbnail */}
      <div className="relative aspect-square bg-[#f5f5f5]">
        {isImage ? (
          <Image
            src={item.url}
            alt={item.alt_text ?? item.original_name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[#bbb]">
            <ImageOff size={32} />
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={copyUrl}
            className="flex h-8 w-28 items-center justify-center gap-1.5 rounded-lg bg-white text-xs font-semibold text-[#1a1a1a] shadow transition hover:bg-[#f0f2f5]"
          >
            {copied ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
            {copied ? "Copied!" : "Copy URL"}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="flex h-8 w-28 items-center justify-center gap-1.5 rounded-lg bg-red-600 text-xs font-semibold text-white shadow transition hover:bg-red-700 disabled:opacity-60"
          >
            <Trash2 size={12} />
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="px-2.5 py-2">
        <p className="truncate text-[0.72rem] font-semibold text-[#1a1a1a]">{item.original_name}</p>
        <p className="text-[0.65rem] text-[#9b9b9b]">
          {fmtBytes(item.size_bytes)}
          {item.width && item.height ? ` · ${item.width}×${item.height}` : ""}
        </p>
      </div>
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

export default function MediaLibraryPanel() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [collection, setCollection] = useState<"" | MediaCollection>("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ per_page: "24", page: String(page) });
      if (collection) qs.set("collection", collection);
      if (search) qs.set("search", search);
      const res = await fetch(`/api/admin/media?${qs}`);
      const json = await res.json();
      setItems(json.data ?? []);
      setTotal(json.meta?.total ?? 0);
      setLastPage(json.meta?.last_page ?? 1);
    } finally {
      setLoading(false);
    }
  }, [page, collection, search]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleSearch = () => {
    setPage(1);
    setSearch(searchInput);
  };

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#1a1a1a]">Media Library</h1>
          <p className="text-sm text-[#9b9b9b]">{total} file{total !== 1 ? "s" : ""}</p>
        </div>
        <button
          type="button"
          onClick={() => setShowUpload(true)}
          className="flex h-9 items-center gap-2 rounded-xl bg-[#E85C1A] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#d14f14]"
        >
          <Upload size={15} />
          Upload
        </button>
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {/* Collection tabs */}
        <div className="flex flex-wrap gap-1.5">
          {COLLECTIONS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => { setPage(1); setCollection(c.value as "" | MediaCollection); }}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                collection === c.value
                  ? "bg-[#E85C1A] text-white"
                  : "bg-[#f0f2f5] text-[#5c5e62] hover:bg-[#e8e8e8]"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="ml-auto flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search by filename…"
            className="h-9 w-48 rounded-lg border border-black/[0.09] px-3 text-sm text-[#1a1a1a] outline-none focus:border-[#E85C1A]"
          />
          <button
            type="button"
            onClick={handleSearch}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-black/[0.09] bg-white text-[#5c5e62] transition hover:bg-[#f0f2f5]"
          >
            <Search size={15} />
          </button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex h-48 items-center justify-center text-sm text-[#aaa]">Loading…</div>
      ) : items.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center gap-2 text-sm text-[#aaa]">
          <ImageOff size={28} />
          <span>No media files found</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {items.map((item) => (
            <MediaCard
              key={item.id}
              item={item}
              onDelete={(id) => setItems((prev) => prev.filter((i) => i.id !== id))}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {lastPage > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/[0.09] text-[#5c5e62] transition hover:bg-[#f0f2f5] disabled:opacity-40"
          >
            <ChevronLeft size={15} />
          </button>
          <span className="text-sm text-[#5c5e62]">
            Page {page} of {lastPage}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
            disabled={page >= lastPage}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/[0.09] text-[#5c5e62] transition hover:bg-[#f0f2f5] disabled:opacity-40"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      )}

      {showUpload && (
        <UploadDialog
          onClose={() => setShowUpload(false)}
          onUploaded={() => { setPage(1); fetchItems(); }}
        />
      )}
    </>
  );
}
