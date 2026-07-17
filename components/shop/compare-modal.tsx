"use client";

import Link from "next/link";
import { X, Check, Minus } from "lucide-react";
import { useCompare } from "@/context/compare-context";
import type { Product } from "./data";

const PLACEHOLDER = "/images/tyre-placeholder.svg";

function resolveImage(product: Product): string {
  if (product.primary_image) return product.image;
  if (product.brand_image) return product.brand_image;
  return PLACEHOLDER;
}

type Row = { label: string; render: (p: Product) => React.ReactNode };

const ROWS: Row[] = [
  { label: "Brand", render: (p) => <span className="font-semibold">{p.brand}</span> },
  { label: "Size", render: (p) => p.size || "—" },
  { label: "Spec", render: (p) => p.spec || "—" },
  { label: "Season", render: (p) => p.season || "—" },
  { label: "Type", render: (p) => p.type || "—" },
  { label: "SKU", render: (p) => <span className="font-mono text-[0.78rem]">{p.sku}</span> },
  {
    label: "Price",
    render: (p) => (
      <span className="text-[1.05rem] font-extrabold text-[var(--foreground)]">
        €{(p.price_b2c ?? p.price).toFixed(2)}
      </span>
    ),
  },
  {
    label: "Availability",
    render: (p) =>
      p.in_stock === false ? (
        <span className="inline-flex items-center gap-1 text-[0.8rem] font-semibold text-red-600"><Minus size={13} /> Out of stock</span>
      ) : (
        <span className="inline-flex items-center gap-1 text-[0.8rem] font-semibold text-emerald-600"><Check size={13} /> In stock</span>
      ),
  },
];

export default function CompareModal() {
  const { products, remove, modalOpen, closeModal } = useCompare();

  if (!modalOpen || products.length < 2) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
      <div className="flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-black/[0.07] px-6 py-4">
          <p className="text-[1rem] font-extrabold text-[var(--foreground)]">Compare Tyres</p>
          <button type="button" onClick={closeModal} aria-label="Close comparison" className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted)] transition hover:bg-black/[0.05] hover:text-[var(--foreground)]">
            <X size={17} />
          </button>
        </div>

        <div className="overflow-auto">
          <table className="w-full min-w-[560px] table-fixed border-collapse text-left">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 w-[110px] bg-white px-4 py-3" />
                {products.map((p) => (
                  <th key={p.id} className="min-w-[180px] border-l border-black/[0.05] px-4 py-3 align-top">
                    <div className="relative flex flex-col items-center gap-2">
                      <button
                        type="button"
                        onClick={() => remove(p.id)}
                        aria-label={`Remove ${p.name} from comparison`}
                        className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200"
                      >
                        <X size={13} />
                      </button>
                      <img src={resolveImage(p)} alt={p.name} className="h-16 w-16 object-contain" />
                      <p className="line-clamp-2 text-center text-[0.82rem] font-bold leading-snug text-[var(--foreground)]">{p.name}</p>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.05]">
              {ROWS.map((row) => (
                <tr key={row.label}>
                  <td className="sticky left-0 z-10 bg-white px-4 py-3 text-[0.72rem] font-bold uppercase tracking-wide text-[var(--muted)]">
                    {row.label}
                  </td>
                  {products.map((p) => (
                    <td key={p.id} className="border-l border-black/[0.05] px-4 py-3 text-[0.85rem] text-[var(--foreground)]">
                      {row.render(p)}
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td className="sticky left-0 z-10 bg-white px-4 py-3" />
                {products.map((p) => (
                  <td key={p.id} className="border-l border-black/[0.05] px-4 py-4">
                    <Link
                      href={`/shop/${p.id}`}
                      onClick={closeModal}
                      className="flex h-10 w-full items-center justify-center rounded-full bg-[var(--primary)] text-[0.8rem] font-semibold text-white transition hover:bg-[var(--primary-hover)]"
                    >
                      View Details
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
