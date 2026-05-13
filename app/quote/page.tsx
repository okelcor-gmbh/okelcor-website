import type { Metadata } from "next";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import QuoteHero from "@/components/quote/quote-hero";
import QuoteForm from "@/components/quote/quote-form";
import QuoteSummary from "@/components/quote/quote-summary";
import QuoteTrust from "@/components/quote/quote-trust";

export const metadata: Metadata = {
  title: "Get Instant Tyre Supply Quotation With Competitive Prices",
  description:
    "Get a competitive bulk tyre supply quotation from Okelcor. We supply PCR, TBR, and used tyres at wholesale prices with international logistics to over 30 countries.",
  openGraph: {
    title: "Get Instant Tyre Supply Quotation With Competitive Prices | Okelcor",
    description:
      "Competitive bulk tyre supply pricing for PCR, TBR, and used tyres. Okelcor delivers globally with trusted international logistics. Response within 1 business day.",
    url: "https://www.okelcor.com/quote",
    type: "website",
  },
  twitter: {
    title: "Get Instant Tyre Supply Quotation — Okelcor",
    description:
      "Bulk PCR, TBR, and used tyre supplies at competitive prices. International logistics. Response within 1 business day.",
  },
};

export default function QuotePage() {
  return (
    <main>
      <Navbar />

      <QuoteHero />

      {/* ── Main two-column section ── */}
      <section className="w-full bg-[#f5f5f5] py-10 md:py-14">
        <div className="tesla-shell">
          <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr] lg:items-start">
            <QuoteForm />
            <div className="lg:sticky lg:top-[96px]">
              <QuoteSummary />
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust + FAQ ── */}
      <QuoteTrust />

      <Footer />
    </main>
  );
}
