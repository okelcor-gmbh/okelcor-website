"use client";

import Link from "next/link";
import type { Product } from "./data";
import Reveal from "@/components/motion/reveal";
import { StaggerParent, StaggerChild } from "@/components/motion/stagger";
import { useLanguage } from "@/context/language-context";
const PLACEHOLDER = "/images/tyre-placeholder.svg";

export default function RelatedProducts({ products }: { products: Product[] }) {
  const { t } = useLanguage();
  if (products.length === 0) return null;

  return (
    <section className="w-full bg-[#f5f5f5] py-10">
      <div className="tesla-shell">
        <Reveal className="mb-6">
          <p className="text-[13px] font-bold uppercase tracking-[0.28em] text-[var(--primary)]">
            {t.shop.related.eyebrow}
          </p>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[var(--foreground)] md:text-3xl">
            {t.shop.related.heading}
          </h2>
        </Reveal>

        <StaggerParent className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <StaggerChild key={product.id}>
              <Link
                href={`/shop/${product.id}`}
                className="group flex flex-col overflow-hidden rounded-[22px] bg-[#efefef] transition-shadow hover:shadow-[0_8px_28px_rgba(0,0,0,0.10)]"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-[#e0e0e0]">
                  <img
                    src={product.image || PLACEHOLDER}
                    alt={`${product.brand} ${product.name}`}
                    loading="lazy"
                    onError={(e) => { e.currentTarget.src = PLACEHOLDER; }}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                  <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-[var(--foreground)] shadow-sm backdrop-blur-sm">
                    {product.type}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--primary)]">
                    {product.brand}
                  </p>
                  <h3 className="mt-1 text-[0.95rem] font-semibold text-[var(--foreground)]">
                    {product.name}
                  </h3>
                  <p className="mt-0.5 text-[0.82rem] text-[var(--muted)]">
                    {product.size} · {product.spec}
                  </p>
                  <p className="mt-auto pt-3 text-[1.2rem] font-extrabold text-[var(--foreground)]">
                    €{product.price.toFixed(2)}
                  </p>
                </div>
              </Link>
            </StaggerChild>
          ))}
        </StaggerParent>
      </div>
    </section>
  );
}
