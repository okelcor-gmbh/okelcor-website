import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, ArrowRight } from "lucide-react";
import Reveal from "@/components/motion/reveal";

const TRUST_BADGES = [
  "Fresh DOT Inventory",
  "Manufacturer Warranties",
  "ISO 9001:2015 Certified",
];

export default function WholesalerHero() {
  return (
    <section className="w-full pt-[76px] lg:pt-20">
      <div className="relative min-h-[72vh] overflow-hidden bg-[#171a20]">
        <Image
          src="/images/pexels-einfoto-2091159.jpg"
          alt="Okelcor tyre wholesale warehouse with stacked premium tyres"
          fill
          priority
          className="object-cover opacity-40"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#171a20] via-[#171a20]/80 to-transparent" />

        <div className="relative z-10 flex min-h-[72vh] items-center">
          <div className="tesla-shell">
            <Reveal>
              <div className="max-w-3xl py-20">
                <p className="text-[13px] font-bold uppercase tracking-[0.28em] text-white/70">
                  Global Tyre Wholesaler
                </p>
                <h1 className="mt-4 max-w-2xl text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl">
                  Never Run Out of Stock with a Reliable Tyre Wholesaler
                </h1>
                <p className="mt-5 max-w-2xl text-[1rem] leading-7 text-white/85 md:text-[1.08rem] md:leading-8">
                  As your global tyre wholesaler, you get premium access to high-value PCR, TBR,
                  and OTR tyres. Enjoy fresh DOT codes, reliable fulfilment, and duty-free imports
                  backed by our REX certification.
                </p>

                <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                  <a
                    href="#contact"
                    className="inline-flex items-center justify-center rounded-full bg-[var(--primary)] px-8 py-4 text-[0.95rem] font-semibold text-white transition hover:bg-[var(--primary-hover)]"
                  >
                    Request a Bulk Quote
                  </a>
                  <Link
                    href="/shop"
                    className="inline-flex items-center justify-center rounded-full border-2 border-white/80 px-8 py-4 text-[0.95rem] font-semibold text-white transition hover:bg-white hover:text-[#171a20]"
                  >
                    View Current Stocklist
                  </Link>
                </div>

                <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-[0.8rem] font-semibold uppercase tracking-wider text-white/80">
                  {TRUST_BADGES.map((badge) => (
                    <span key={badge} className="flex items-center gap-2">
                      <CheckCircle2 size={18} className="text-[var(--primary)]" />
                      {badge}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>

      {/* Sourcing trust bar */}
      <div className="w-full border-b border-black/[0.07] bg-white py-8">
        <div className="tesla-shell">
          <p className="text-center text-[0.78rem] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
            Sourcing the world&rsquo;s most trusted brands
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-[1.05rem] font-black tracking-tight text-[#171a20]/55 md:gap-x-16">
            <span>MICHELIN</span>
            <span>BRIDGESTONE</span>
            <span>CONTINENTAL</span>
            <span>GOODYEAR</span>
            <span>PIRELLI</span>
            <span>DUNLOP</span>
          </div>
        </div>
      </div>

      {/* subtle hint arrow for first inventory anchor */}
      <a href="#capabilities" className="sr-only">
        Skip to capabilities <ArrowRight size={14} />
      </a>
    </section>
  );
}
