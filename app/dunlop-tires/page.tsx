import type { Metadata } from "next";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import CatalogueLanding from "@/components/shop/catalogue-landing";

const CANONICAL = "https://www.okelcor.com/dunlop-tires";

export const metadata: Metadata = {
  title: "Dunlop Tyres Wholesale — Bulk Dunlop Tyre Supply | Okelcor",
  description:
    "Wholesale Dunlop tyres — PCR — at competitive bulk prices. Okelcor supplies Dunlop sport and performance passenger tyres to distributors in over 30 countries.",
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: "Dunlop Tyres Wholesale — Bulk Supply | Okelcor",
    description:
      "Wholesale Dunlop PCR tyres from Okelcor. Competitive bulk pricing with reliable international logistics.",
    url: CANONICAL,
    type: "website",
  },
  twitter: {
    title: "Dunlop Tyres Wholesale — Okelcor",
    description: "Wholesale Dunlop tyres for distributors worldwide.",
  },
};

const breadcrumb = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home",          item: "https://www.okelcor.com" },
    { "@type": "ListItem", position: 2, name: "Shop",          item: "https://www.okelcor.com/shop" },
    { "@type": "ListItem", position: 3, name: "Dunlop Tyres",  item: CANONICAL },
  ],
};

export default function DunlopTiresPage() {
  return (
    <main>
      <Navbar />
      <CatalogueLanding
        config={{
          eyebrow: "Brand",
          h1: "Dunlop Tyres — Wholesale Supply",
          intro:
            "Source Dunlop's sport and performance tyre range at wholesale prices. The Sport Maxx RT2 and other Dunlop ultra-high-performance tyres are available in bulk from Okelcor for global distribution.",
          filters: { brand: "Dunlop" },
          breadcrumbSchema: breadcrumb,
          relatedGroups: [
            {
              heading: "Other Brands",
              links: [
                { label: "Michelin Tyres",    href: "/michelin-tires" },
                { label: "Bridgestone Tyres", href: "/bridgestone-tires" },
                { label: "Continental Tyres", href: "/continental-tires" },
                { label: "Pirelli Tyres",     href: "/pirelli-tires" },
                { label: "Falken Tyres",      href: "/falken-tires" },
              ],
            },
            {
              heading: "Tyre Categories",
              links: [
                { label: "Passenger Car Tyres (PCR)", href: "/passenger-tires" },
                { label: "Full Tyre Catalogue",       href: "/shop" },
              ],
            },
            {
              heading: "Shop by Season",
              links: [
                { label: "Summer Tyres",     href: "/summer-tires" },
                { label: "All-Season Tyres", href: "/all-season-tires" },
              ],
            },
          ],
        }}
      />
      <Footer />
    </main>
  );
}
