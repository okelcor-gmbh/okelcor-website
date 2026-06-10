import { ShieldCheck, BadgeCheck, Globe } from "lucide-react";
import Reveal from "@/components/motion/reveal";

const CAPABILITIES = [
  {
    icon: ShieldCheck,
    title: "Fresh Rubber & Full Warranties",
    body: "We guarantee recent DOT production dates and facilitate standard manufacturer warranties. Never worry about stagnant stock — give your customers the safety and performance they expect.",
  },
  {
    icon: BadgeCheck,
    title: "Duty-Free REX Exports",
    body: "We are a REX Certified Exporter (DEREX76000242). Eligible clients in markets such as the UK and Canada can import our tyres duty-free, significantly protecting your profit margins.",
  },
  {
    icon: Globe,
    title: "Consistent Global Supply Lines",
    body: "Avoid stockouts. With dependable international logistics supporting buyers in over 40 countries, we provide the steady pipeline of inventory your business needs to scale.",
  },
];

export default function WholesalerCapabilities() {
  return (
    <section id="capabilities" className="w-full bg-[#f5f5f5] py-16 md:py-20">
      <div className="tesla-shell">
        <Reveal>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)] md:text-4xl">
              Built for Global Tyre Distribution
            </h2>
            <p className="mt-3 text-[1rem] leading-7 text-[var(--muted)] md:text-[1.05rem]">
              Delivering the inventory, logistical precision, and financial advantages high-volume
              buyers require.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {CAPABILITIES.map(({ icon: Icon, title, body }, i) => (
            <Reveal key={title} delay={i * 0.08}>
              <div className="flex h-full flex-col rounded-[22px] bg-[#efefef] p-7">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--primary)]/10">
                  <Icon size={22} strokeWidth={1.8} className="text-[var(--primary)]" />
                </div>
                <h3 className="mt-5 text-[1.05rem] font-extrabold text-[var(--foreground)]">
                  {title}
                </h3>
                <p className="mt-2 text-[0.9rem] leading-7 text-[var(--muted)]">{body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
