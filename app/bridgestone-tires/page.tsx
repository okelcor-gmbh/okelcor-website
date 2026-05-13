import type { Metadata } from "next";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import CatalogueLanding from "@/components/shop/catalogue-landing";

const CANONICAL = "https://www.okelcor.com/bridgestone-tires";

export const metadata: Metadata = {
  title: "Bridgestone Tyres Wholesale — Bulk Bridgestone Supply | Okelcor",
  description:
    "Wholesale Bridgestone tyres — PCR and TBR — at competitive bulk prices. Okelcor supplies Bridgestone passenger and commercial tyres to distributors in over 30 countries.",
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: "Bridgestone Tyres Wholesale — Bulk Supply | Okelcor",
    description:
      "Wholesale Bridgestone PCR and TBR tyres from Okelcor. Competitive bulk pricing with reliable international logistics.",
    url: CANONICAL,
    type: "website",
  },
  twitter: {
    title: "Bridgestone Tyres Wholesale — Okelcor",
    description: "Wholesale Bridgestone tyres — PCR and TBR — for distributors worldwide.",
  },
};

const breadcrumb = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home",              item: "https://www.okelcor.com" },
    { "@type": "ListItem", position: 2, name: "Shop",              item: "https://www.okelcor.com/shop" },
    { "@type": "ListItem", position: 3, name: "Bridgestone Tyres", item: CANONICAL },
  ],
};

export default function BridgestoneTiresPage() {
  return (
    <main>
      <Navbar />
      <CatalogueLanding
        config={{
          eyebrow: "Brand",
          h1: "Bridgestone Tyres — Wholesale Supply",
          intro:
            "Source Bridgestone's premium tyre range at wholesale prices. From the Turanza T005 touring tyre to the Ecopia R192 fuel-efficient truck tyre, Okelcor supplies Bridgestone PCR and TBR to distributors across Europe and internationally.",
          filters: { brand: "Bridgestone" },
          breadcrumbSchema: breadcrumb,
          relatedGroups: [
            {
              heading: "Other Brands",
              links: [
                { label: "Michelin Tyres",    href: "/michelin-tires" },
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
