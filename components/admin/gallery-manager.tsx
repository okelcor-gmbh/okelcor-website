"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Trash2, X, Upload } from "lucide-react";
import { uploadProductImages, deleteProductImage } from "@/app/admin/products/actions";
import type { AdminProductImage } from "@/lib/admin-api";

type Props = {
  productId: number;
  images: AdminProductImage[];
};

export default function GalleryManager({ productId, images }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  // ── File selection ────────────────────────────────────────────────────────

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setSelectedFiles(files);
    setPreviews(files.map((f) => URL.createObjectURL(f)));
    setUploadError(null);
  };

  const clearSelection = () => {
    setSelectedFiles([]);
    setPreviews([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Upload ────────────────────────────────────────────────────────────────

  const handleUpload = () => {
    if (!selectedFiles.length) return;
    setUploadError(null);

    const fd = new FormData();
    selectedFiles.forEach((file) => fd.append("images[]", file));

    startTransition(async () => {
      const result = await uploadProductImages(productId, fd);
      if (result.error) {
        setUploadError(result.error);
      } else {
        clearSelection();
        router.refresh();
      }
    });
  };

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = (imageId: number) => {
    setDeleteError(null);
    setDeletingId(imageId);

    startTransition(async () => {
      const result = await deleteProductImage(productId, imageId);
      if (result.error) {
        setDeleteError(result.error);
      } else {
        setConfirmDeleteId(null);
        router.refresh();
      }
      setDeletingId(null);
    });
  };

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[#f4511e]">
            Gallery
          </p>
          <h2 className="mt-0.5 text-[0.95rem] font-extrabold text-[#1a1a1a]">
            Product Images
          </h2>
        </div>
        <span className="text-[0.78rem] text-[#5c5e62]">
          {images.length} image{images.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Error banners */}
      {uploadError && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[0.83rem] text-red-700">
          <span>{uploadError}</span>
          <button type="button" onClick={() => setUploadError(null)}><X size={13} /></button>
        </div>
      )}
      {deleteError && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[0.83rem] text-red-700">
          <span>{deleteError}</span>
          <button type="button" onClick={() => setDeleteError(null)}><X size={13} /></button>
        </div>
      )}

      {/* Existing images */}
      {images.length > 0 ? (
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {images.map((img) => {
            const isDeleting = deletingId === img.id;
            const pendingDelete = confirmDeleteId === img.id;
            return (
              <div key={img.id} className="group relative overflow-hidden rounded-xl bg-[#f0f2f5]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt=""
                  className="aspect-square w-full object-cover"
                />

                {/* Delete overlay */}
                {pendingDelete ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70 p-3 text-center">
                    <p className="text-[0.72rem] font-semibold text-white">Delete?</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        disabled={isDeleting}
                        className="rounded-lg bg-white/20 px-2.5 py-1 text-[0.7rem] font-semibold text-white hover:bg-white/30"
                      >
                        No
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(img.id)}
                        disabled={isDeleting}
                        className="rounded-lg bg-red-600 px-2.5 py-1 text-[0.7rem] font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                      >
                        {isDeleting ? "…" : "Yes"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(img.id)}
                    className="absolute right-1.5 top-1.5 hidden h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition hover:bg-red-600 group-hover:flex"
                    title="Delete image"
                  >
                    <Trash2 size={12} strokeWidth={2} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mb-5 flex items-center justify-center rounded-xl border border-dashed border-black/[0.12] bg-[#fafafa] py-8 text-center">
          <div>
            <ImagePlus size={24} className="mx-auto mb-2 text-[#ccc]" />
            <p className="text-[0.83rem] text-[#5c5e62]">No gallery images yet.</p>
          </div>
        </div>
      )}

      {/* Upload section */}
      <div className="rounded-xl border border-dashed border-black/[0.12] bg-[#fafafa] p-5">
        <p className="mb-3 text-[0.78rem] font-semibold text-[#1a1a1a]">
          Add gallery images
        </p>

        {/* File input */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-black/[0.09] bg-white px-4 py-2.5 text-[0.83rem] font-semibold text-[#1a1a1a] transition hover:border-[#f4511e] hover:text-[#f4511e]"
          >
            <ImagePlus size={14} strokeWidth={2} />
            Choose images
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/mp4,video/mov,video/avi,video/webm"
            multiple
            onChange={handleFileChange}
            className="sr-only"
          />
          {selectedFiles.length > 0 && (
            <span className="text-[0.78rem] text-[#5c5e62]">
              {selectedFiles.length} file{selectedFiles.length !== 1 ? "s" : ""} selected
            </span>
          )}
        </div>

        {/* Previews */}
        {previews.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {previews.map((src, i) => (
              <div key={i} className="h-16 w-16 overflow-hidden rounded-lg bg-[#f0f2f5]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        )}

        {/* Upload button */}
        {selectedFiles.length > 0 && (
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={handleUpload}
              disabled={isPending}
              className="flex items-center gap-2 rounded-full bg-[#f4511e] px-5 py-2 text-[0.83rem] font-semibold text-white transition hover:bg-[#df4618] disabled:opacity-60"
            >
              <Upload size={13} strokeWidth={2.5} />
              {isPending ? "Uploading…" : "Upload"}
            </button>
            <button
              type="button"
              onClick={clearSelection}
              disabled={isPending}
              className="rounded-full border border-black/10 bg-white px-4 py-2 text-[0.83rem] font-semibold text-[#5c5e62] transition hover:bg-[#f0f2f5]"
            >
              Clear
            </button>
          </div>
        )}

        <p className="mt-2.5 text-[0.72rem] text-[#aaa]">
          JPG, PNG, WebP or MP4/MOV · Max 50 MB per file
        </p>
      </div>
    </div>
  );
}
