import type { Metadata } from "next";
import { getServerLocale } from "@/lib/locale";
import { getPageMeta } from "@/lib/metadata-i18n";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import QuoteHero from "@/components/quote/quote-hero";
import QuoteForm from "@/components/quote/quote-form";
import QuoteSummary from "@/components/quote/quote-summary";
import QuoteTrust from "@/components/quote/quote-trust";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const m = getPageMeta("quote", locale);
  return {
    title: m.title,
    description: m.description,
    alternates: { canonical: "https://www.okelcor.com/tyre-supply-quotation" },
    openGraph: {
      title: m.ogTitle,
      description: m.ogDescription,
      url: "https://www.okelcor.com/tyre-supply-quotation",
      type: "website",
    },
    twitter: {
      title: m.twitterTitle,
      description: m.twitterDescription,
    },
  };
}

const breadcrumb = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home",                          item: "https://www.okelcor.com" },
    { "@type": "ListItem", position: 2, name: "Get Instant Tyre Supply Quotation", item: "https://www.okelcor.com/tyre-supply-quotation" },
  ],
};

export default function TyreSupplyQuotationPage() {
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
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
