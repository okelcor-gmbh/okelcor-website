"use client";

import { X, ArrowLeftRight } from "lucide-react";
import { useCompare } from "@/context/compare-context";

const PLACEHOLDER = "/images/tyre-placeholder.svg";

export default function CompareBar() {
  const { products, remove, clear, openModal } = useCompare();

  if (products.length === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-4 sm:pb-5">
      <div className="flex w-full max-w-2xl items-center gap-3 rounded-2xl border border-black/[0.08] bg-white/95 px-4 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.16)] backdrop-blur-xl">
        <div className="flex flex-1 items-center gap-2 overflow-x-auto">
          {products.map((p) => (
            <div key={p.id} className="relative shrink-0 rounded-xl border border-gray-100 bg-white p-1">
              <img
                src={p.primary_image ? p.image : (p.brand_image ?? PLACEHOLDER)}
                alt={p.name}
                className="h-10 w-10 object-contain"
              />
              <button
                type="button"
                onClick={() => remove(p.id)}
                aria-label={`Remove ${p.name} from comparison`}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gray-700 text-white shadow"
              >
                <X size={11} />
              </button>
            </div>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={clear}
            className="hidden text-[0.78rem] font-semibold text-[var(--muted)] transition hover:text-[var(--foreground)] sm:block"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={openModal}
            disabled={products.length < 2}
            className="flex h-10 items-center gap-1.5 rounded-full bg-[var(--primary)] px-4 text-[0.82rem] font-semibold text-white transition hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowLeftRight size={14} />
            Compare {products.length > 1 ? `(${products.length})` : ""}
          </button>
        </div>
      </div>
    </div>
  );
}
