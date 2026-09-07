import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { apiFetch, type ApiResponse } from "@/lib/api";
import { productPath } from "@/components/shop/data";

/**
 * Real tyres, ready to ship, with real prices. Every volume platform runs a
 * product row on the homepage because a visible price is what separates a
 * shop from a brochure. Fed by the live catalogue filtered to in-stock, so
 * a tyre that sells out falls off the homepage by itself.
 */

type ProductRow = {
  id: number;
  slug?: string | null;
  brand?: string | null;
  name: string;
  size?: string | null;
  price?: number | null;
  season?: string | null;
  type?: string | null;
  primary_image?: string | null;
};

const eur = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });

export default async function FeaturedStock() {
  let items: ProductRow[] = [];
  let total: number | null = null;

  try {
    const res: ApiResponse<ProductRow[]> = await apiFetch<ProductRow[]>("/products", {
      params: { in_stock: "1", per_page: "4" },
      revalidate: 300,
      tags: ["featured-stock"],
    });
    items = (res.data ?? []).filter((p) => p.primary_image && p.price);
    const t = res.meta?.total;
    total = typeof t === "number" && t > 0 ? t : null;
  } catch {
    return null;
  }

  if (items.length < 4) return null;

  return (
    <section aria-label="In stock now" className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-14 lg:px-8">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-balance text-2xl font-bold tracking-tight text-[#171a20] sm:text-[1.7rem]">
              In stock and ready to ship
            </h2>
            <p className="mt-1.5 text-[0.95rem] text-[#5c5e62]">
              {total
                ? `${new Intl.NumberFormat("en-GB").format(total)} tyres on the shelf right now. Here are four of them.`
                : "Live stock from the warehouse, updated as it sells."}
            </p>
          </div>
          <Link
            href="/shop?in_stock=1"
            className="hidden shrink-0 items-center gap-1.5 text-[0.9rem] font-semibold text-[#171a20] underline decoration-black/20 underline-offset-4 transition-colors hover:decoration-[#f4511e] sm:flex"
          >
            See everything in stock
            <ArrowRight size={14} strokeWidth={2.4} aria-hidden />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {items.slice(0, 4).map((p) => (
            <Link
              key={p.id}
              href={productPath(p)}
              className="group rounded-lg border border-black/10 bg-white p-4 transition-shadow hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4511e]"
            >
              <div className="relative mb-3 aspect-square overflow-hidden rounded-md bg-[#f5f5f5]">
                <Image
                  src={p.primary_image as string}
                  alt={p.name}
                  fill
                  sizes="(min-width: 1024px) 25vw, 50vw"
                  className="object-contain p-3 transition-transform duration-300 group-hover:scale-[1.04]"
                />
                <span className="absolute left-2 top-2 rounded bg-[#15803d]/10 px-1.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-[#15803d]">
                  In stock
                </span>
              </div>
              {p.brand && (
                <p className="text-[0.72rem] font-semibold uppercase tracking-wide text-[#8c8f94]">{p.brand}</p>
              )}
              <p className="mt-0.5 line-clamp-2 text-[0.9rem] font-semibold leading-snug text-[#171a20]">{p.name}</p>
              <p className="mt-2 flex items-baseline justify-between">
                <span className="text-[1.05rem] font-bold tabular-nums text-[#171a20]">
                  {p.price ? eur.format(p.price) : ""}
                </span>
                {p.season && <span className="text-[0.75rem] text-[#5c5e62]">{p.season}</span>}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
