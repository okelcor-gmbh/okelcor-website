import type { Metadata } from "next";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import CatalogueLanding from "@/components/shop/catalogue-landing";

const CANONICAL = "https://www.okelcor.com/continental-tires";

export const metadata: Metadata = {
  title: "Continental Tyres Wholesale — Bulk Continental Supply | Okelcor",
  description:
    "Wholesale Continental tyres — PCR and TBR — at competitive bulk prices. Okelcor supplies Continental passenger and commercial tyres to distributors in over 30 countries.",
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: "Continental Tyres Wholesale — Bulk Supply | Okelcor",
    description:
      "Wholesale Continental PCR and TBR tyres from Okelcor. Competitive bulk pricing with reliable international logistics.",
    url: CANONICAL,
    type: "website",
  },
  twitter: {
    title: "Continental Tyres Wholesale — Okelcor",
    description: "Wholesale Continental tyres — PCR and TBR — for distributors worldwide.",
  },
};

const breadcrumb = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home",               item: "https://www.okelcor.com" },
    { "@type": "ListItem", position: 2, name: "Shop",               item: "https://www.okelcor.com/shop" },
    { "@type": "ListItem", position: 3, name: "Continental Tyres",  item: CANONICAL },
  ],
};

export default function ContinentalTiresPage() {
  return (
    <main>
      <Navbar />
      <CatalogueLanding
        config={{
          eyebrow: "Brand",
          h1: "Continental Tyres — Wholesale Supply",
          intro:
            "Source Continental's high-performance tyre range at wholesale prices. From the ContiPremiumContact 6 for premium passenger cars to the Hybrid HS3+ for mixed-service trucks, Okelcor supplies Continental tyres globally.",
          filters: { brand: "Continental" },
          breadcrumbSchema: breadcrumb,
          relatedGroups: [
            {
              heading: "Other Brands",
              links: [
                { label: "Michelin Tyres",    href: "/michelin-tires" },
                { label: "Bridgestone Tyres", href: "/bridgestone-tires" },
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
