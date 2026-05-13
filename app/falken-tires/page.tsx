import type { Metadata } from "next";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import CatalogueLanding from "@/components/shop/catalogue-landing";

const CANONICAL = "https://www.okelcor.com/falken-tires";

export const metadata: Metadata = {
  title: "Falken Tyres Wholesale — Bulk Falken Tyre Supply | Okelcor",
  description:
    "Wholesale Falken tyres — PCR and TBR — at competitive bulk prices. Okelcor supplies Falken passenger and commercial tyres to distributors in over 30 countries.",
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: "Falken Tyres Wholesale — Bulk Supply | Okelcor",
    description:
      "Wholesale Falken tyres from Okelcor. Competitive bulk pricing with reliable international logistics.",
    url: CANONICAL,
    type: "website",
  },
  twitter: {
    title: "Falken Tyres Wholesale — Okelcor",
    description: "Wholesale Falken tyres for distributors worldwide.",
  },
};

const breadcrumb = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home",          item: "https://www.okelcor.com" },
    { "@type": "ListItem", position: 2, name: "Shop",          item: "https://www.okelcor.com/shop" },
    { "@type": "ListItem", position: 3, name: "Falken Tyres",  item: CANONICAL },
  ],
};

export default function FalkenTiresPage() {
  return (
    <main>
      <Navbar />
      <CatalogueLanding
        config={{
          eyebrow: "Brand",
          h1: "Falken Tyres — Wholesale Supply",
          intro:
            "Source Falken's value-performance tyre range at wholesale prices. Falken PCR and TBR tyres offer reliable quality at competitive price points, making them a popular choice for distributors serving cost-conscious markets.",
          filters: { brand: "Falken" },
          breadcrumbSchema: breadcrumb,
          relatedGroups: [
            {
              heading: "Other Brands",
              links: [
                { label: "Michelin Tyres",    href: "/michelin-tires" },
                { label: "Bridgestone Tyres", href: "/bridgestone-tires" },
                { label: "Continental Tyres", href: "/continental-tires" },
                { label: "Dunlop Tyres",      href: "/dunlop-tires" },
                { label: "Goodyear Tyres",    href: "/goodyear-tires" },
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
