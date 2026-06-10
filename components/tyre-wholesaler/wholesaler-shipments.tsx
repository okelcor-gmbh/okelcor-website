import { Container, CheckCircle2, Ship, ArrowRight } from "lucide-react";
import Reveal from "@/components/motion/reveal";
import { RECENT_SHIPMENTS } from "./data";

export default function WholesalerShipments() {
  return (
    <section id="shipments" className="w-full border-t border-black/[0.06] bg-[#f5f5f5] py-16 md:py-20">
      <div className="tesla-shell">
        <Reveal>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)] md:text-4xl">
              Proven Global Fulfilment of Wholesale Tyres
            </h2>
            <p className="mt-3 text-[1rem] leading-7 text-[var(--muted)] md:text-[1.05rem]">
              As a reliable global tyre wholesaler, we move thousands of tyres every month. Here is
              a snapshot of wholesale shipments successfully dispatched to our international partners.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {RECENT_SHIPMENTS.map((s, i) => (
            <Reveal key={s.destination} delay={i * 0.08}>
              <div className="overflow-hidden rounded-[18px] border border-black/[0.06] bg-white shadow-sm">
                <div className="flex items-center justify-between bg-[var(--primary)] px-6 py-4 text-white">
                  <span className="text-[1.05rem] font-bold">Destination: {s.destination}</span>
                  <Ship size={20} className="opacity-80" />
                </div>
                <div className="p-6">
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <Container size={18} className="mt-0.5 shrink-0 text-[var(--muted)]" />
                      <div>
                        <span className="block text-[0.72rem] font-medium uppercase tracking-wide text-[var(--muted)]">
                          Container ID
                        </span>
                        <span className="block font-mono font-semibold text-[var(--foreground)]">
                          {s.containerId}
                        </span>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-green-500" />
                      <div>
                        <span className="block text-[0.72rem] font-medium uppercase tracking-wide text-[var(--muted)]">
                          Volume &amp; Cargo
                        </span>
                        <span className="block font-semibold text-[var(--foreground)]">{s.cargo}</span>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-green-500" />
                      <div>
                        <span className="block text-[0.72rem] font-medium uppercase tracking-wide text-[var(--muted)]">
                          Status
                        </span>
                        <span className="block font-semibold text-[var(--foreground)]">{s.status}</span>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="mt-12 text-center">
          <a
            href="#contact"
            className="inline-flex items-center gap-2 text-[1rem] font-bold text-[var(--primary)] transition-colors hover:text-[var(--primary-hover)]"
          >
            Join our network and start receiving high-value shipments
            <ArrowRight size={18} />
          </a>
        </div>
      </div>
    </section>
  );
}
