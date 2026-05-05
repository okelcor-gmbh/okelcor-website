"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Copy, Check } from "lucide-react";

export type CampaignPromotion = {
  id: number;
  title: string;
  subheadline?: string | null;
  button_text?: string | null;
  button_link?: string | null;
  image_url?: string | null;
  brand_name?: string | null;
  discount_pct?: number | null;
  promo_code?: string | null;
  customer_type_target?: "b2c" | "b2b" | "all" | null;
};

export default function ShopCampaignBanner({ promo }: { promo: CampaignPromotion }) {
  const discountLabel = promo.discount_pct != null ? `${promo.discount_pct}% OFF` : null;
  const hasCta = !!(promo.button_text && promo.button_link);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!promo.promo_code) return;
    navigator.clipboard.writeText(promo.promo_code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-[#f4511e]/20 bg-white shadow-[0_2px_12px_rgba(244,81,30,0.06)]">
      <div className="relative flex min-h-[130px] items-stretch sm:min-h-[152px]">

        {/* Left accent bar */}
        <div className="absolute inset-y-0 left-0 w-1.5 bg-[#f4511e]" aria-hidden="true" />

        {/* Image — desktop only */}
        {promo.image_url && (
          <div className="relative hidden w-[220px] shrink-0 overflow-hidden sm:block md:w-[260px]">
            <Image
              src={promo.image_url}
              alt={promo.title}
              fill
              className="object-cover"
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/30" />
          </div>
        )}

        {/* Text */}
        <div className="flex flex-1 flex-col justify-center py-6 pl-7 pr-5 sm:pl-8">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.22em] text-[#f4511e]">
              {promo.brand_name ?? "Campaign"}
            </p>
            {discountLabel && (
              <span className="rounded-full bg-[#f4511e] px-2.5 py-0.5 text-[0.65rem] font-extrabold uppercase tracking-widest text-white">
                {discountLabel}
              </span>
            )}
          </div>

          <p className="mt-1.5 text-[1.05rem] font-extrabold leading-snug text-[#171a20] sm:text-[1.15rem]">
            {promo.title}
          </p>

          {promo.subheadline && (
            <p className="mt-1 text-[0.83rem] leading-relaxed text-[#5c5e62]">
              {promo.subheadline}
            </p>
          )}

          {/* Promo code copy row */}
          {promo.promo_code && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-full border border-[#f4511e]/20 bg-[#fff8f6] px-3 py-1.5">
                <span className="text-[0.7rem] text-[#5c5e62]">Code:</span>
                <span className="font-mono text-[0.82rem] font-extrabold tracking-widest text-[#171a20]">
                  {promo.promo_code}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#f4511e]/20 bg-[#fff8f6] px-3 py-1.5 text-[0.73rem] font-semibold text-[#f4511e] transition hover:bg-[#fee2d8] active:scale-[0.97]"
              >
                {copied ? <Check size={11} strokeWidth={2.5} /> : <Copy size={11} strokeWidth={2.2} />}
                {copied ? "Copied!" : "Copy code"}
              </button>
            </div>
          )}

          {hasCta && (
            <div className="mt-4">
              <Link
                href={promo.button_link!}
                className="inline-flex h-9 items-center gap-2 rounded-full bg-[#f4511e] px-5 text-[0.82rem] font-bold text-white shadow-sm transition hover:bg-[#e04018] active:scale-[0.97]"
              >
                {promo.button_text}
                <ArrowRight size={13} strokeWidth={2.5} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
