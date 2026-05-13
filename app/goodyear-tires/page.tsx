import type { Metadata } from "next";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import CatalogueLanding from "@/components/shop/catalogue-landing";

const CANONICAL = "https://www.okelcor.com/goodyear-tires";

export const metadata: Metadata = {
  title: "Goodyear Tyres Wholesale — Bulk Goodyear Tyre Supply | Okelcor",
  description:
    "Wholesale Goodyear tyres — PCR summer and winter — at competitive bulk prices. Okelcor supplies Goodyear passenger tyres to distributors in over 30 countries.",
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: "Goodyear Tyres Wholesale — Bulk Supply | Okelcor",
    description:
      "Wholesale Goodyear PCR tyres from Okelcor. Competitive bulk pricing with reliable international logistics.",
    url: CANONICAL,
    type: "website",
  },
  twitter: {
    title: "Goodyear Tyres Wholesale — Okelcor",
    description: "Wholesale Goodyear tyres for distributors worldwide.",
  },
};

const breadcrumb = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home",            item: "https://www.okelcor.com" },
    { "@type": "ListItem", position: 2, name: "Shop",            item: "https://www.okelcor.com/shop" },
    { "@type": "ListItem", position: 3, name: "Goodyear Tyres",  item: CANONICAL },
  ],
};

export default function GoodyearTiresPage() {
  return (
    <main>
      <Navbar />
      <CatalogueLanding
        config={{
          eyebrow: "Brand",
          h1: "Goodyear Tyres — Wholesale Supply",
          intro:
            "Source Goodyear's trusted tyre range at wholesale prices. From the EfficientGrip Performance summer tyre to the UltraGrip Performance+ winter tyre, Okelcor supplies Goodyear passenger car tyres in bulk for global distribution.",
          filters: { brand: "Goodyear" },
          breadcrumbSchema: breadcrumb,
          relatedGroups: [
            {
              heading: "Other Brands",
              links: [
                { label: "Michelin Tyres",    href: "/michelin-tires" },
                { label: "Bridgestone Tyres", href: "/bridgestone-tires" },
                { label: "Continental Tyres", href: "/continental-tires" },
                { label: "Pirelli Tyres",     href: "/pirelli-tires" },
                { label: "Dunlop Tyres",      href: "/dunlop-tires" },
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
                { label: "Summer Tyres", href: "/summer-tires" },
                { label: "Winter Tyres", href: "/winter-tires" },
              ],
            },
          ],
        }}
      />
      <Footer />
    </main>
  );
}
