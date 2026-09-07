"use client";

import Image from "next/image";
import Link from "next/link";
import { productPath, type Product } from "./data";

/**
 * One tyre as a table row, the trade view. Heuver's webshop shows results
 * this way because a wholesale buyer comparing forty candidates scans a
 * dense list far faster than a wall of cards. The grid stays for people
 * who shop with their eyes; this view is for people who shop with a
 * spreadsheet open.
 */

const eur = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });

export default function ProductListRow({
  product,
  displayPrice,
}: {
  product: Product;
  displayPrice: number;
}) {
  const isOut = product.in_stock === false;

  return (
    <Link
      href={productPath(product)}
      className="group grid grid-cols-[56px_1fr_auto] items-center gap-3 border-b border-black/10 bg-white px-3 py-2.5 transition-colors last:border-b-0 hover:bg-[#fafafa] sm:grid-cols-[56px_1.6fr_1fr_1fr_auto] sm:gap-4 sm:px-4"
    >
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded bg-[#f5f5f5]">
        {product.image && (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="56px"
            className={`object-contain p-1 ${isOut ? "opacity-50" : ""}`}
          />
        )}
      </div>

      <div className="min-w-0">
        <p className="text-[0.7rem] font-bold uppercase tracking-wide text-[#8c8f94]">{product.brand}</p>
        <p className="truncate text-[0.9rem] font-semibold text-[#171a20] group-hover:underline group-hover:decoration-black/30 group-hover:underline-offset-2">
          {product.name}
        </p>
        <p className="font-mono text-[0.74rem] text-[#8c8f94] sm:hidden">{product.size}</p>
      </div>

      <p className="hidden font-mono text-[0.82rem] text-[#5c5e62] sm:block">{product.size}</p>

      <div className="hidden items-center gap-2 sm:flex">
        {product.season && (
          <span className="rounded border border-black/10 px-1.5 py-0.5 text-[0.7rem] font-semibold text-[#5c5e62]">
            {product.season}
          </span>
        )}
        <span
          className={`text-[0.75rem] font-semibold ${isOut ? "text-red-600" : "text-[#15803d]"}`}
        >
          {isOut ? "Out of stock" : "In stock"}
        </span>
      </div>

      <p className="text-right text-[0.98rem] font-bold tabular-nums text-[#171a20]">
        {displayPrice > 0 ? eur.format(displayPrice) : ""}
      </p>
    </Link>
  );
}
