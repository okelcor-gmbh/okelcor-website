import type { Metadata } from "next";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import CatalogueLanding from "@/components/shop/catalogue-landing";

const CANONICAL = "https://www.okelcor.com/summer-tires";

export const metadata: Metadata = {
  title: "Summer Tyres Wholesale — Bulk Summer Tyre Supply | Okelcor",
  description:
    "Wholesale summer tyres from Michelin, Bridgestone, Pirelli, Goodyear, and Dunlop. Bulk summer PCR and TBR tyre supply for distributors worldwide with international logistics.",
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: "Summer Tyres Wholesale — Bulk Supply | Okelcor",
    description:
      "Wholesale summer tyres — PCR and TBR — from all major brands. Competitive bulk pricing with reliable international logistics for distributors in 30+ countries.",
    url: CANONICAL,
    type: "website",
  },
  twitter: {
    title: "Summer Tyres Wholesale — Okelcor",
    description:
      "Wholesale summer tyres from Michelin, Bridgestone, Pirelli, Goodyear, and Dunlop. Global bulk supply.",
  },
};

const breadcrumb = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home",          item: "https://www.okelcor.com" },
    { "@type": "ListItem", position: 2, name: "Shop",          item: "https://www.okelcor.com/shop" },
    { "@type": "ListItem", position: 3, name: "Summer Tyres",  item: CANONICAL },
  ],
};

export default function SummerTiresPage() {
  return (
    <main>
      <Navbar />
      <CatalogueLanding
        config={{
          eyebrow: "Season",
          h1: "Summer Tyres — Wholesale Bulk Supply",
          intro:
            "High-performance summer tyres for passenger cars and commercial vehicles. Our wholesale summer tyre range covers PCR and TBR categories from all major brands, available for bulk export with competitive pricing.",
          filters: { season: "Summer" },
          breadcrumbSchema: breadcrumb,
          relatedGroups: [
            {
              heading: "Other Seasons",
              links: [
                { label: "Winter Tyres",     href: "/winter-tires" },
                { label: "All-Season Tyres", href: "/all-season-tires" },
              ],
            },
            {
              heading: "Tyre Categories",
              links: [
                { label: "Passenger Car Tyres (PCR)",     href: "/passenger-tires" },
                { label: "Truck & Bus Radial Tyres (TBR)", href: "/light-truck-tires" },
                { label: "Full Tyre Catalogue",            href: "/shop" },
              ],
            },
            {
              heading: "Shop by Brand",
              links: [
                { label: "Michelin Tyres",    href: "/michelin-tires" },
                { label: "Bridgestone Tyres", href: "/bridgestone-tires" },
                { label: "Pirelli Tyres",     href: "/pirelli-tires" },
                { label: "Goodyear Tyres",    href: "/goodyear-tires" },
                { label: "Dunlop Tyres",      href: "/dunlop-tires" },
              ],
            },
          ],
        }}
      />
      <Footer />
    </main>
  );
}
