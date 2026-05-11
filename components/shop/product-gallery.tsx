"use client";

import { useState } from "react";
import type { Product } from "./data";

const PLACEHOLDER = "/images/tyre-placeholder.svg";
const MAX_THUMBS = 4;

export default function ProductGallery({ product }: { product: Product }) {
  // product.images is already full URLs with primary_image first (set in toProduct)
  const images = product.images.length ? product.images : [product.image].filter(Boolean);
  const [selected, setSelected] = useState(0);

  const mainUrl = images[selected] || PLACEHOLDER;

  return (
    <div className="flex flex-col gap-3">
      {/* Main large image */}
      <div className="relative w-full overflow-hidden rounded-[22px] bg-[#efefef]" style={{ aspectRatio: "4/3", maxHeight: "420px" }}>
        <img
          src={mainUrl}
          alt={`${product.brand} ${product.name}`}
          onError={(e) => { e.currentTarget.src = PLACEHOLDER; }}
          className="h-full w-full object-contain transition-opacity duration-300"
        />
        <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[12px] font-semibold text-[var(--foreground)] shadow-sm backdrop-blur-sm">
          {product.type}
        </span>
      </div>

      {/* Thumbnail strip — show when there are multiple images, max 4 */}
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {images.slice(0, MAX_THUMBS).map((imgUrl, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSelected(i)}
              aria-label={`View image ${i + 1}`}
              className={`h-[80px] w-[80px] shrink-0 overflow-hidden rounded-[12px] border-2 transition-all ${
                selected === i
                  ? "border-[var(--primary)]"
                  : "border-transparent opacity-60 hover:opacity-90"
              }`}
            >
              <img
                src={imgUrl}
                alt={`Thumbnail ${i + 1}`}
                onError={(e) => { e.currentTarget.src = PLACEHOLDER; }}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
