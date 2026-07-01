"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { X, Search, ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import type { MediaItem, MediaCollection } from "@/lib/admin-api";

const COLLECTION_OPTS: { value: "" | MediaCollection; label: string }[] = [
  { value: "",            label: "All" },
  { value: "articles",   label: "Articles" },
  { value: "products",   label: "Products" },
  { value: "hero",       label: "Hero" },
  { value: "brands",     label: "Brands" },
  { value: "categories", label: "Categories" },
  { value: "general",    label: "General" },
];

type Props = {
  /** Called with the image URL and alt text when the user picks an image. */
  onSelect: (url: string, alt: string) => void;
  onClose: () => void;
};

export default function MediaPickerModal({ onSelect, onClose }: Props) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [collection, setCollection] = useState<"" | MediaCollection>("articles");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ per_page: "20", page: String(page) });
      if (collection) qs.set("collection", collection);
      if (search) qs.set("search", search);
      const res = await fetch(`/api/admin/media?${qs}`);
      const json = await res.json();
      setItems(json.data ?? []);
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="flex h-[90vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-black/[0.07] px-5 py-4">
          <p className="text-sm font-bold uppercase tracking-widest text-[#5c5e62]">Browse Media Library</p>
          <button type="button" onClick={onClose} className="text-[#aaa] hover:text-[#333]">
            <X size={18} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-shrink-0 flex-wrap items-center gap-2 border-b border-black/[0.07] px-5 py-3">
          {COLLECTION_OPTS.map((c) => (
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
          <div className="ml-auto flex gap-2">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search…"
              className="h-8 w-40 rounded-lg border border-black/[0.09] px-2.5 text-sm text-[#1a1a1a] outline-none focus:border-[#E85C1A]"
            />
            <button
              type="button"
              onClick={handleSearch}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/[0.09] bg-white text-[#5c5e62] transition hover:bg-[#f0f2f5]"
            >
              <Search size={14} />
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="flex h-40 items-center justify-center text-sm text-[#aaa]">Loading…</div>
          ) : items.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center gap-2 text-sm text-[#aaa]">
              <ImageOff size={24} />
              <span>No images found</span>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
              {items.map((item) => {
                const isImage = item.mime_type.startsWith("image/");
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelect(item.url, item.alt_text ?? "")}
                    onMouseEnter={() => setHovered(item.id)}
                    onMouseLeave={() => setHovered(null)}
                    className={`group relative overflow-hidden rounded-xl border-2 transition ${
                      hovered === item.id ? "border-[#E85C1A] shadow-md" : "border-black/[0.07]"
                    }`}
                  >
                    <div className="relative aspect-square bg-[#f5f5f5]">
                      {isImage ? (
                        <Image
                          src={item.url}
                          alt={item.alt_text ?? item.original_name}
                          fill
                          className="object-cover"
                          sizes="160px"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[#bbb]">
                          <ImageOff size={20} />
                        </div>
                      )}
                      {hovered === item.id && (
                        <div className="absolute inset-0 flex items-center justify-center bg-[#E85C1A]/60">
                          <span className="rounded-full bg-white px-2 py-0.5 text-[0.65rem] font-bold text-[#E85C1A]">
                            Insert
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="truncate px-1.5 py-1 text-left text-[0.65rem] text-[#5c5e62]">
                      {item.original_name}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {lastPage > 1 && (
          <div className="flex flex-shrink-0 items-center justify-center gap-3 border-t border-black/[0.07] py-3">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-black/[0.09] text-[#5c5e62] transition hover:bg-[#f0f2f5] disabled:opacity-40"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs text-[#5c5e62]">Page {page} of {lastPage}</span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
              disabled={page >= lastPage}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-black/[0.09] text-[#5c5e62] transition hover:bg-[#f0f2f5] disabled:opacity-40"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
