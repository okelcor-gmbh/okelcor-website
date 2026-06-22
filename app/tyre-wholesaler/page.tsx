import type { Metadata } from "next";
import WholesalerHeader from "@/components/tyre-wholesaler/wholesaler-header";
import WholesalerFooter from "@/components/tyre-wholesaler/wholesaler-footer";
import WholesalerLeadForm from "@/components/tyre-wholesaler/wholesaler-lead-form";
import WholesalerHero from "@/components/tyre-wholesaler/wholesaler-hero";
import WholesalerCapabilities from "@/components/tyre-wholesaler/wholesaler-capabilities";
import WholesalerInventory from "@/components/tyre-wholesaler/wholesaler-inventory";
import WholesalerShipments from "@/components/tyre-wholesaler/wholesaler-shipments";
import WholesalerFaq from "@/components/tyre-wholesaler/wholesaler-faq";
import { WHOLESALER_FAQS } from "@/components/tyre-wholesaler/data";

const CANONICAL = "https://www.okelcor.com/tyre-wholesaler";

const TITLE = "Tyre Wholesaler | Premium Global Supplies | Okelcor";
const DESCRIPTION =
  "As your tyre wholesaler, you'll get steady supply of premium and value PCR, TBR, and OTR tyres at competitive rates. Get fresh DOT codes, reliable fulfilment, and duty-free imports.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: CANONICAL },
  openGraph: { title: TITLE, description: DESCRIPTION, url: CANONICAL, type: "website" },
  twitter: { title: TITLE, description: DESCRIPTION },
};

// ── Structured data ───────────────────────────────────────────────────────────

const wholesaleStore = {
  "@context": "https://schema.org",
  "@type": "WholesaleStore",
  name: "Okelcor",
  url: "https://www.okelcor.com/",
  logo: "https://www.okelcor.com/logo/okelcor-logo.png",
  image: "https://www.okelcor.com/images/pexels-einfoto-2091159.jpg",
  description:
    "Your reliable global tyre wholesaler. Supplying premium and value PCR, TBR, and OTR tyres to distributors across 40+ countries with fresh DOT codes and REX certified duty-free exports.",
  telephone: "+49-89-545-583-60",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Landsberger Str. 155",
    addressLocality: "Munich",
    addressRegion: "Bavaria",
    postalCode: "80687",
    addressCountry: "DE",
  },
  areaServed: [
    { "@type": "Place", name: "Worldwide" },
    { "@type": "Country", name: "United Kingdom" },
    { "@type": "Country", name: "Canada" },
    { "@type": "Place", name: "West Africa" },
  ],
  knowsAbout: [
    "Tyre Wholesale",
    "PCR Tyres",
    "TBR Tyres",
    "OTR Tyres",
    "REX Certification DEREX76000242",
    "ISO 9001:2015",
  ],
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Global Tyre Wholesale Inventory",
    itemListElement: [
      { "@type": "OfferCatalog", name: "PCR Tyres", description: "Premium passenger car tyres for everyday road performance and safety." },
      { "@type": "OfferCatalog", name: "TBR Tyres", description: "Heavy-duty truck and bus tyres engineered for commercial durability and high mileage." },
      { "@type": "OfferCatalog", name: "OTR Tyres", description: "Rugged, specialised tyres for construction, mining, and industrial operations." },
      { "@type": "OfferCatalog", name: "Budget & Value Brand Tyres", description: "High-margin, reliable new tyres engineered for cost-conscious consumers." },
    ],
  },
};

const breadcrumb = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://www.okelcor.com" },
    { "@type": "ListItem", position: 2, name: "Tyre Wholesaler", item: CANONICAL },
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: WHOLESALER_FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function TyreWholesalerPage() {
  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([wholesaleStore, breadcrumb, faqSchema]) }}
      />
      <WholesalerHeader />

      <WholesalerHero />
      <WholesalerCapabilities />
      <WholesalerInventory />
      <WholesalerShipments />

      {/* ── Conversion engine — real quote backend ── */}
      <section id="contact" className="w-full scroll-mt-24 bg-[#f5f5f5] pt-4 pb-16 md:pb-20">
        <div className="tesla-shell">
          <div className="mx-auto mb-8 max-w-2xl text-center">
            <h2 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)] md:text-4xl">
              Ready to secure your supply chain?
            </h2>
            <p className="mt-3 text-[1rem] leading-7 text-[var(--muted)] md:text-[1.05rem]">
              Speak with our Munich-based wholesale team to discuss your container requirements,
              brand preferences, and logistics.
            </p>
          </div>
          <div className="mx-auto max-w-3xl">
            <WholesalerLeadForm />
          </div>
        </div>
      </section>

      <WholesalerFaq />

      <WholesalerFooter />
    </main>
  );
}
