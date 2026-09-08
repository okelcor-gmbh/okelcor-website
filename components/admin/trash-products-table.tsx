"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, X } from "lucide-react";
import { restoreProduct } from "@/app/admin/products/actions";
import type { AdminProduct } from "@/lib/admin-api";

function shortDate(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function TrashProductsTable({ products }: { products: AdminProduct[] }) {
  const router = useRouter();
  const [actionError, setActionError] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  const handleRestore = (id: number) => {
    setActionError(null);
    setRestoringId(id);
    startTransition(async () => {
      const result = await restoreProduct(id);
      if (result.error) {
        setActionError(result.error);
      } else {
        router.push("/admin/products/trash");
      }
      setRestoringId(null);
    });
  };

  if (products.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-xl bg-white py-16 shadow-sm">
        <div className="text-center">
          <p className="text-[0.95rem] font-semibold text-[#1a1a1a]">Trash is empty</p>
          <p className="mt-1 text-[0.83rem] text-[#5c5e62]">Deleted products will appear here.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {actionError && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[0.83rem] text-red-700">
          <span>{actionError}</span>
          <button type="button" onClick={() => setActionError(null)}><X size={14} /></button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left">
            <thead>
              <tr className="border-b border-black/[0.06] bg-[#fafafa]">
                {["Image", "SKU / Name", "Brand", "Type", "Deleted On", ""].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-[0.7rem] font-bold uppercase tracking-[0.12em] text-[#5c5e62]"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {products.map((product) => {
                const isRestoring = restoringId === product.id;
                return (
                  <tr key={product.id} className="opacity-70 transition hover:opacity-100">
                    {/* Thumbnail */}
                    <td className="px-4 py-3">
                      <div className="h-11 w-11 overflow-hidden rounded-lg bg-[#f0f2f5]">
                        {(product.image_url || product.primary_image) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={product.image_url ?? product.primary_image ?? ""}
                            alt={product.name}
                            className="h-full w-full object-cover grayscale"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[0.6rem] font-bold text-[#aaa]">
                            IMG
                          </div>
                        )}
                      </div>
                    </td>

                    {/* SKU + Name */}
                    <td className="px-4 py-3">
                      <p className="text-[0.82rem] font-extrabold text-[#1a1a1a]">{product.name}</p>
                      <p className="text-[0.73rem] font-mono text-[#5c5e62]">{product.sku}</p>
                    </td>

                    {/* Brand */}
                    <td className="px-4 py-3 text-[0.875rem] text-[#1a1a1a]">{product.brand}</td>

                    {/* Type */}
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[0.68rem] font-bold uppercase tracking-wide text-gray-500">
                        {product.type}
                      </span>
                    </td>

                    {/* Deleted on */}
                    <td className="px-4 py-3 text-[0.83rem] text-[#5c5e62]">
                      {shortDate(product.deleted_at)}
                    </td>

                    {/* Restore */}
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleRestore(product.id)}
                        disabled={isRestoring}
                        className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-[0.78rem] font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
                      >
                        <RotateCcw size={12} strokeWidth={2.5} className={isRestoring ? "animate-spin" : ""} />
                        {isRestoring ? "Restoring…" : "Restore"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
