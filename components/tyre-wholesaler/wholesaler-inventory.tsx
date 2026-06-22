import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Reveal from "@/components/motion/reveal";
import { INVENTORY_CATEGORIES } from "./data";

export default function WholesalerInventory() {
  return (
    <section id="inventory" className="w-full scroll-mt-24 bg-white py-16 md:py-20">
      <div className="tesla-shell">
        <Reveal>
          <div className="border-l-4 border-[var(--primary)] pl-6">
            <h2 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)] md:text-4xl">
              Comprehensive New Inventory for Every Market
            </h2>
            <p className="mt-2 max-w-3xl text-[1rem] leading-7 text-[var(--muted)] md:text-[1.05rem]">
              Whether you need everyday passenger fitments (195/65R15, 205/55R16) or heavy-duty
              truck sizes (295/80R22.5, 315/80R22.5), our warehouses are equipped to fulfil your
              orders. Have a specific packing list?{" "}
              <Link href="/tyre-supply-quotation" className="font-semibold text-[var(--primary)] hover:underline">
                Submit an inquiry
              </Link>{" "}
              with your required sizes, brands, and target volumes for a custom wholesale quote.
            </p>
          </div>
        </Reveal>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {INVENTORY_CATEGORIES.map((cat, i) => (
            <Reveal key={cat.title} delay={i * 0.06}>
              <div className="group relative h-72 overflow-hidden rounded-[18px] bg-[#171a20] shadow-sm">
                <Image
                  src={cat.image}
                  alt={cat.imageAlt}
                  fill
                  className="object-cover opacity-80 transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
                {/* Readability overlay — stronger gradient so text stays legible */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/25 transition-colors duration-300 group-hover:from-black/90 group-hover:via-black/60" />
                <div className="absolute inset-0 flex flex-col justify-end p-6">
                  <h3 className="text-[1.3rem] font-extrabold text-white">{cat.title}</h3>
                  <p className="mt-2 text-[0.82rem] leading-6 text-white/85">{cat.description}</p>
                  <a
                    href="#contact"
                    className="mt-4 inline-flex items-center gap-2 text-[0.85rem] font-semibold text-[var(--primary)] transition-all group-hover:gap-3"
                  >
                    Receive a Quote
                    <ArrowRight size={15} />
                  </a>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
