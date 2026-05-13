import type { Metadata } from "next";
import Link from "next/link";
import {
  Zap, BarChart3, Leaf, Wrench, CheckCircle2,
  Truck, Tractor, Bus, Anchor, Car, Factory,
  ArrowRight, ChevronDown, ShieldCheck, Download, FileText,
} from "lucide-react";
import EngineLookup from "@/components/fet/engine-lookup";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import AmortizationCalculator from "@/components/fet/amortization-calculator";
import FadeUp from "@/components/motion/fade-up";

export const metadata: Metadata = {
  title: "FET Engine Fuel Efficiency for Fleets",
  description:
    "FET Engine Fuel Efficiency — the fuel efficiency device trusted by fleet operators across Europe. Up to 15% fuel savings, reduced emissions, improved engine performance.",
  openGraph: {
    title: "FET Engine Fuel Efficiency – Engine Treatment for Fleets | Okelcor Tires",
    description:
      "FET Engine Fuel Efficiency — up to 15% fuel savings, reduced emissions, improved engine performance. Trusted by fleet operators across Europe.",
    url: "https://www.okelcor.com/fet",
    type: "website",
  },
};

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`w-full py-16 md:py-20 ${className}`}>
      <div className="tesla-shell">{children}</div>
    </section>
  );
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.28em] text-[#22c55e]">
      {children}
    </p>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FetPage() {
  return (
    <main className="min-h-screen bg-[#f0f4f0]">
      <Navbar />

      {/* ── Hero — fullscreen video background ───────────────────────────── */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-5 pt-[76px] text-center lg:pt-20">

        {/* Video — poster attribute handles the fallback natively */}
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster="/images/fet-hero-poster.jpg"
          className="absolute inset-0 h-full w-full object-cover"
          aria-hidden="true"
        >
          <source src="/videos/video with fx desktop.mp4" type="video/mp4" />
        </video>

        {/* Dark overlay for text legibility — sits above video */}
        <div className="absolute inset-0 bg-black/50" />

        {/* Content */}
        <div className="relative z-10 max-w-[760px]">
          {/* Badge */}
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-[#22c55e]/20 px-4 py-1.5 ring-1 ring-[#22c55e]/30 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" />
            <span className="text-[0.78rem] font-bold uppercase tracking-[0.2em] text-[#22c55e]">
              Fuel Efficiency Technology
            </span>
          </div>

          {/* H1 — primary SEO heading */}
          <h1 className="text-4xl font-extrabold leading-[1.1] tracking-[-0.02em] text-white md:text-5xl lg:text-[3.75rem]">
            FET Engine Fuel Efficiency
            <br />
            <span className="text-[#22c55e]">Reduce Consumption Up To 15%</span>
          </h1>

          <p className="mx-auto mt-6 max-w-[520px] text-[0.97rem] leading-[1.75] tracking-[0.01em] text-white/70">
            The catalytic fuel efficiency device that improves combustion, reduces CO₂
            emissions, and cuts fuel costs — compatible with diesel and gasoline engines,
            trusted by fleet operators across Europe.
          </p>

          {/* Benefit pills */}
          <div className="mt-8 flex flex-wrap justify-center gap-2.5">
            {[
              { icon: Zap,       label: "Save Fuel"                  },
              { icon: BarChart3, label: "Improve Engine Performance"  },
              { icon: Leaf,      label: "Reduce Emissions"            },
            ].map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[0.85rem] font-semibold text-white backdrop-blur-sm"
              >
                <Icon size={14} strokeWidth={2} className="text-[#22c55e]" />
                {label}
              </span>
            ))}
          </div>

          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/tyre-supply-quotation"
              className="flex h-[52px] items-center gap-2 rounded-full bg-[#22c55e] px-8 text-[0.95rem] font-semibold text-white shadow-[0_16px_40px_rgba(34,197,94,0.35)] transition hover:bg-[#16a34a]"
            >
              Request a Quote <ArrowRight size={16} strokeWidth={2} />
            </Link>
            <a
              href="#how-it-works"
              className="flex h-[52px] items-center gap-2 rounded-full border border-white/25 bg-white/10 px-8 text-[0.95rem] font-semibold text-white backdrop-blur-sm transition hover:border-white/50 hover:bg-white/20"
            >
              Learn More <ChevronDown size={15} />
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/40">
            Scroll
          </span>
          <div className="animate-bounce">
            <ChevronDown size={20} strokeWidth={2} className="text-white/40" />
          </div>
        </div>

        {/* Bottom fade into page */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#f0f4f0] to-transparent" />
      </section>

      {/* ── How It Works ─────────────────────────────────────────────────── */}
      <Section id="how-it-works" className="bg-white">
        <FadeUp>
          <SectionEyebrow>How It Works</SectionEyebrow>
          <h2 className="mb-12 text-3xl font-extrabold tracking-tight text-[#111111] md:text-4xl">
            Simple install. Immediate impact.
          </h2>
        </FadeUp>

        <div className="grid gap-5 sm:grid-cols-3">
          {[
            {
              step: "01",
              title: "Install in Fuel Line",
              body: "FET is fitted directly into the vehicle's fuel supply line — no engine modifications, no downtime. Compatible with all diesel and petrol engines.",
            },
            {
              step: "02",
              title: "Activates with Engine Heat",
              body: "As the engine reaches operating temperature, FET's catalytic process begins treating the fuel passing through it, restructuring fuel molecules.",
            },
            {
              step: "03",
              title: "Improves Combustion Efficiency",
              body: "Better-structured fuel burns more completely, extracting more energy per litre — translating directly into fuel savings and lower emissions.",
            },
          ].map(({ step, title, body }, i) => (
            <FadeUp key={step} delay={i * 110}>
              <div className="relative h-full rounded-[18px] border border-[#e2e8e2] bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#22c55e]/30 hover:shadow-[0_8px_28px_rgba(34,197,94,0.1)]">
                <span className="mb-4 block font-mono text-[2.5rem] font-extrabold leading-none text-[#22c55e]/20">
                  {step}
                </span>
                <h3 className="text-[1rem] font-extrabold text-[#111111]">{title}</h3>
                <p className="mt-2 text-[0.88rem] leading-6 text-[#6b7280]">{body}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </Section>

      {/* ── Proven Results ── dark green band ────────────────────────────── */}
      <Section className="bg-[#0d2b1a]">
        <FadeUp>
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.28em] text-[#22c55e]">
            Proven Results
          </p>
          <h2 className="mb-10 text-3xl font-extrabold tracking-tight text-white md:text-4xl">
            Documented in real-world conditions.
          </h2>
        </FadeUp>

        <div className="grid gap-5 sm:grid-cols-2">
          {[
            {
              stat: "~10.9%",
              label: "Fuel Savings",
              context: "Field test — Unimog winter operation",
              detail:
                "Measured over an extended field test in cold-weather conditions with a Mercedes-Benz Unimog. Consistent savings across the test period.",
            },
            {
              stat: "Up to 15%",
              label: "Fuel Savings",
              context: "Lab test — constant-speed runs",
              detail:
                "Controlled laboratory testing at constant speed showed up to 15% improvement in fuel consumption versus an untreated baseline vehicle.",
            },
          ].map(({ stat, label, context, detail }, i) => (
            <FadeUp key={context} delay={i * 130}>
              <div className="h-full rounded-[18px] border border-[#22c55e]/20 bg-[#22c55e]/[0.06] p-8 transition-all duration-300 hover:-translate-y-1 hover:border-[#22c55e]/40 hover:shadow-[0_10px_32px_rgba(34,197,94,0.15)]">
                <p className="text-[3.2rem] font-extrabold leading-none tracking-tight text-white">
                  {stat}
                </p>
                <p className="mt-1.5 text-[1rem] font-bold text-white">{label}</p>
                <p className="mt-0.5 text-[0.8rem] font-semibold uppercase tracking-wider text-[#22c55e]/70">
                  {context}
                </p>
                <p className="mt-4 text-[0.88rem] leading-6 text-white/60">{detail}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </Section>

      {/* ── Key Benefits ─────────────────────────────────────────────────── */}
      <Section className="bg-[#f0f4f0]">
        <FadeUp>
          <SectionEyebrow>Key Benefits</SectionEyebrow>
          <h2 className="mb-10 text-3xl font-extrabold tracking-tight text-[#111111] md:text-4xl">
            Built for operational realities.
          </h2>
        </FadeUp>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: Wrench,
              title: "Easy to Retrofit",
              body: "Fits any diesel or petrol engine without mechanical modification. Installation takes under an hour.",
            },
            {
              icon: BarChart3,
              title: "Measurable Impact",
              body: "Savings are documentable. Before/after fuel logs give you clear evidence for fleet reporting.",
            },
            {
              icon: Leaf,
              title: "Reduce Emissions",
              body: "More complete combustion means fewer particulates and lower CO₂ per kilometre driven.",
            },
            {
              icon: Truck,
              title: "Fleet Logic",
              body: "The more vehicles in your fleet, the stronger the ROI. Savings compound across every unit.",
            },
            {
              icon: CheckCircle2,
              title: "Documented & Verifiable",
              body: "Results backed by independent field and lab tests. Not marketing claims — measured data.",
            },
            {
              icon: Factory,
              title: "Ready for Real-World Operation",
              body: "Proven across passenger cars, trucks, agricultural machinery, marine, and construction equipment.",
            },
          ].map(({ icon: Icon, title, body }, i) => (
            <FadeUp key={title} delay={i * 75}>
              <div className="h-full rounded-[18px] border border-[#e2e8e2] bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#22c55e]/30 hover:shadow-[0_8px_24px_rgba(34,197,94,0.1)]">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#dcfce7]">
                  <Icon size={18} strokeWidth={1.8} className="text-[#16a34a]" />
                </div>
                <h3 className="text-[0.95rem] font-extrabold text-[#111111]">{title}</h3>
                <p className="mt-2 text-[0.85rem] leading-6 text-[#6b7280]">{body}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </Section>

      {/* ── Applications ─────────────────────────────────────────────────── */}
      <Section className="bg-white">
        <FadeUp>
          <SectionEyebrow>Applications</SectionEyebrow>
          <h2 className="mb-10 text-3xl font-extrabold tracking-tight text-[#111111] md:text-4xl">
            Who it&apos;s for.
          </h2>
        </FadeUp>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { icon: Car,     label: "Cars & Frequent Drivers" },
            { icon: Truck,   label: "Trucks, Vans & Fleet"     },
            { icon: Tractor, label: "Agriculture / Diesel"     },
            { icon: Factory, label: "Construction Machinery"   },
            { icon: Bus,     label: "Public Transport"         },
            { icon: Anchor,  label: "Marine"                   },
          ].map(({ icon: Icon, label }, i) => (
            <FadeUp key={label} delay={i * 60}>
              <div className="flex h-full flex-col items-center gap-3 rounded-[16px] border border-[#e2e8e2] bg-white p-5 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#22c55e]/30 hover:shadow-[0_6px_20px_rgba(34,197,94,0.1)]">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#dcfce7]">
                  <Icon size={22} strokeWidth={1.7} className="text-[#16a34a]" />
                </div>
                <p className="text-[0.8rem] font-semibold leading-tight text-[#6b7280]">{label}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </Section>

      {/* ── Amortization Calculator ───────────────────────────────────────── */}
      <Section className="bg-[#f0f4f0]">
        <FadeUp>
          <SectionEyebrow>ROI Calculator</SectionEyebrow>
          <h2 className="mb-3 text-3xl font-extrabold tracking-tight text-[#111111] md:text-4xl">
            Calculate your savings.
          </h2>
          <p className="mb-10 max-w-[520px] text-[0.95rem] leading-7 text-[#6b7280]">
            Enter your vehicle details and see how quickly FET pays for itself.
          </p>
        </FadeUp>
        <AmortizationCalculator />
      </Section>

      {/* ── Proof & Certification ────────────────────────────────────────── */}
      <Section className="bg-white">
        <FadeUp>
          <SectionEyebrow>Proof &amp; Certification</SectionEyebrow>
          <h2 className="mb-10 text-3xl font-extrabold tracking-tight text-[#111111] md:text-4xl">
            Certified. Tested. Verified.
          </h2>
        </FadeUp>

        <div className="grid gap-6 md:grid-cols-2">

          {/* ── Left — ISO Certificate ── */}
          <div className="flex flex-col rounded-[20px] border border-[#e2e8e2] bg-white p-8 shadow-sm">
            <div className="mb-5 inline-flex items-center gap-2 self-start rounded-full bg-[#0d2b1a] px-4 py-1.5">
              <ShieldCheck size={13} strokeWidth={2.2} className="text-[#22c55e]" />
              <span className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-[#22c55e]">
                ISO 9001:2015 Certified
              </span>
            </div>

            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#dcfce7]">
              <ShieldCheck size={30} strokeWidth={1.7} className="text-[#16a34a]" />
            </div>

            <div className="flex flex-col gap-4 text-[0.88rem]">
              <div>
                <p className="mb-0.5 text-[0.67rem] font-bold uppercase tracking-wider text-[#6b7280]">Company</p>
                <p className="font-semibold text-[#111111]">Collaborate Together And Invest GmbH (CTI)</p>
              </div>
              <div>
                <p className="mb-0.5 text-[0.67rem] font-bold uppercase tracking-wider text-[#6b7280]">Certified by</p>
                <p className="font-semibold text-[#111111]">qm-solutions GmbH, Germany</p>
              </div>
              <div>
                <p className="mb-0.5 text-[0.67rem] font-bold uppercase tracking-wider text-[#6b7280]">Valid until</p>
                <p className="font-semibold text-[#111111]">30 January 2026</p>
              </div>
            </div>

            <a
              href="/documents/CTI-Certificate-ISO9001.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-auto flex items-center justify-center gap-2 rounded-full border border-[#22c55e] px-6 py-3 text-[0.88rem] font-semibold text-[#16a34a] transition hover:bg-[#22c55e] hover:text-white"
            >
              <Download size={14} strokeWidth={2.2} />
              Download Certificate
            </a>
          </div>

          {/* ── Right — Field Test Report ── */}
          <div className="flex flex-col rounded-[20px] border border-[#e2e8e2] bg-white p-8 shadow-sm">
            <h3 className="text-[1.4rem] font-extrabold leading-tight tracking-tight text-[#111111] md:text-[1.6rem]">
              Independently Verified. Real Results.
            </h3>
            <p className="mt-2 text-[0.85rem] leading-6 text-[#6b7280]">
              Field test conducted on a VW T5 van operated by Landesbaubehörde Stadthagen, a German regional state authority. January to October 2025.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              {([
                { stat: "11.52 → 9.92", unit: "l/100km", label: "Fuel consumption reduction" },
                { stat: "13.9%",        unit: "",         label: "Verified fuel savings"       },
                { stat: "€900–€1,300",  unit: "",         label: "Annual savings estimate"     },
                { stat: "3–5 months",   unit: "",         label: "Full payback period"         },
              ] as const).map(({ stat, unit, label }) => (
                <div key={label} className="rounded-[14px] border border-[#e2e8e2] bg-[#f0f4f0] p-4">
                  <p className="text-[1.2rem] font-extrabold leading-tight text-[#111111]">
                    {stat}
                    {unit && <span className="ml-1 text-[0.7rem] font-bold text-[#6b7280]">{unit}</span>}
                  </p>
                  <p className="mt-1 text-[0.71rem] font-medium text-[#6b7280]">{label}</p>
                </div>
              ))}
            </div>

            <a
              href="/documents/FET-Test-Report-VW-T5.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 flex items-center justify-center gap-2 rounded-full bg-[#22c55e] px-6 py-3 text-[0.88rem] font-semibold text-white transition hover:bg-[#16a34a]"
            >
              <Download size={14} strokeWidth={2.2} />
              Download Full Test Report
            </a>

            <p className="mt-4 text-center text-[0.72rem] leading-5 text-[#9ca3af]">
              Tested under real operating conditions. Signed and certified by CTI GmbH, Lippstadt.
            </p>
          </div>

        </div>
      </Section>

      {/* ── Engine Compatibility ─────────────────────────────────────────── */}
      <Section className="bg-[#f0f4f0]" id="compatibility">
        <FadeUp>
          <SectionEyebrow>Engine Compatibility</SectionEyebrow>
          <h2 className="mb-3 text-3xl font-extrabold tracking-tight text-[#111111] md:text-4xl">
            Compatible with your engine?
          </h2>
          <p className="mb-10 max-w-[560px] text-[0.95rem] leading-7 text-[#6b7280]">
            FET works with all standard diesel and petrol engines. Search the database below or download the full compatibility guide for your vehicle category.
          </p>
        </FadeUp>

        {/* PDF download cards */}
        <FadeUp>
          <div className="mb-8 grid gap-4 sm:grid-cols-2">
            {[
              {
                label: "Cars, SUVs & Sports Cars",
                sub:   "Passenger car engines — comprehensive model listing",
                href:  "/documents/FET-Engine-Overview-Cars-SUV.pdf",
                icon:  Car,
              },
              {
                label: "Commercial Vehicles (up to 40t)",
                sub:   "Trucks, vans, buses & heavy machinery — full engine list",
                href:  "/documents/FET-Engine-Overview-Commercial-Vehicles.pdf",
                icon:  Truck,
              },
            ].map(({ label, sub, href, icon: Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-5 rounded-[18px] border border-[#e2e8e2] bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#22c55e]/40 hover:shadow-md"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#dcfce7]">
                  <Icon size={24} strokeWidth={1.7} className="text-[#16a34a]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-extrabold text-[#111111]">{label}</p>
                  <p className="mt-0.5 text-[0.83rem] text-[#6b7280]">{sub}</p>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#22c55e]/30 bg-[#f0fdf4] transition group-hover:bg-[#22c55e] group-hover:text-white">
                  <Download size={15} strokeWidth={2} className="text-[#16a34a] group-hover:text-white" />
                </div>
              </a>
            ))}
          </div>
        </FadeUp>

        {/* Live engine search */}
        <FadeUp delay={120}>
          <EngineLookup />
        </FadeUp>
      </Section>

      {/* ── Bottom CTA ───────────────────────────────────────────────────── */}
      <section className="w-full bg-[#0d2b1a] py-20">
        <div className="tesla-shell flex flex-col items-center text-center">
          <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#22c55e]/15">
            <Zap size={24} strokeWidth={1.8} className="text-[#22c55e]" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
            Get non-binding advice
          </h2>
          <p className="mt-3 max-w-[420px] text-[0.95rem] leading-7 text-white/60">
            Not sure if FET is right for your fleet or vehicle? Our team will answer your questions and provide a tailored recommendation — no commitment required.
          </p>
          <Link
            href="/tyre-supply-quotation"
            className="mt-8 flex h-[54px] items-center gap-2 rounded-full bg-[#22c55e] px-10 text-[1rem] font-semibold text-white shadow-[0_16px_40px_rgba(34,197,94,0.3)] transition hover:bg-[#16a34a]"
          >
            Request a Quote <ArrowRight size={16} strokeWidth={2} />
          </Link>
          <Link
            href="/shop"
            className="mt-4 text-[0.85rem] font-medium text-white/40 transition hover:text-white/70"
          >
            Back to Tyre Catalogue →
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
