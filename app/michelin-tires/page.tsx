import type { Metadata } from "next";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import CatalogueLanding from "@/components/shop/catalogue-landing";

const CANONICAL = "https://www.okelcor.com/michelin-tires";

export const metadata: Metadata = {
  title: "Michelin Tyres Wholesale — Bulk Michelin Tyre Supply | Okelcor",
  description:
    "Wholesale Michelin tyres — PCR and TBR — at competitive bulk prices. Okelcor supplies Michelin passenger and commercial tyres to distributors in over 30 countries with international logistics.",
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: "Michelin Tyres Wholesale — Bulk Supply | Okelcor",
    description:
      "Wholesale Michelin PCR and TBR tyres from Okelcor. Competitive bulk pricing with reliable international logistics.",
    url: CANONICAL,
    type: "website",
  },
  twitter: {
    title: "Michelin Tyres Wholesale — Okelcor",
    description: "Wholesale Michelin tyres — PCR and TBR — for distributors worldwide.",
  },
};

const breadcrumb = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home",            item: "https://www.okelcor.com" },
    { "@type": "ListItem", position: 2, name: "Shop",            item: "https://www.okelcor.com/shop" },
    { "@type": "ListItem", position: 3, name: "Michelin Tyres",  item: CANONICAL },
  ],
};

export default function MichelinTiresPage() {
  return (
    <main>
      <Navbar />
      <CatalogueLanding
        config={{
          eyebrow: "Brand",
          h1: "Michelin Tyres — Wholesale Supply",
          intro:
            "Stock Michelin's world-renowned tyre range at wholesale prices. From the Energy Saver+ for passenger cars to the X MultiWay for long-haul trucks, Okelcor supplies Michelin PCR and TBR tyres to distributors across Europe, Africa, and beyond.",
          filters: { brand: "Michelin" },
          breadcrumbSchema: breadcrumb,
          relatedGroups: [
            {
              heading: "Other Brands",
              links: [
                { label: "Bridgestone Tyres", href: "/bridgestone-tires" },
                { label: "Continental Tyres", href: "/continental-tires" },
                { label: "Pirelli Tyres",     href: "/pirelli-tires" },
                { label: "Goodyear Tyres",    href: "/goodyear-tires" },
                { label: "Dunlop Tyres",      href: "/dunlop-tires" },
              ],
            },
            {
              heading: "Tyre Categories",
              links: [
                { label: "Passenger Car Tyres (PCR)",      href: "/passenger-tires" },
                { label: "Truck & Bus Radial Tyres (TBR)", href: "/light-truck-tires" },
                { label: "Full Tyre Catalogue",            href: "/shop" },
              ],
            },
            {
              heading: "Shop by Season",
              links: [
                { label: "Summer Tyres",     href: "/summer-tires" },
                { label: "Winter Tyres",     href: "/winter-tires" },
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
