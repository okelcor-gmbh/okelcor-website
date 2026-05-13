import type { Metadata } from "next";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import CatalogueLanding from "@/components/shop/catalogue-landing";

const CANONICAL = "https://www.okelcor.com/pirelli-tires";

export const metadata: Metadata = {
  title: "Pirelli Tyres Wholesale — Bulk Pirelli Tyre Supply | Okelcor",
  description:
    "Wholesale Pirelli tyres — PCR — at competitive bulk prices. Okelcor supplies Pirelli passenger tyres to distributors in over 30 countries with international logistics.",
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: "Pirelli Tyres Wholesale — Bulk Supply | Okelcor",
    description:
      "Wholesale Pirelli PCR tyres from Okelcor. Competitive bulk pricing with reliable international logistics.",
    url: CANONICAL,
    type: "website",
  },
  twitter: {
    title: "Pirelli Tyres Wholesale — Okelcor",
    description: "Wholesale Pirelli tyres for distributors worldwide.",
  },
};

const breadcrumb = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home",           item: "https://www.okelcor.com" },
    { "@type": "ListItem", position: 2, name: "Shop",           item: "https://www.okelcor.com/shop" },
    { "@type": "ListItem", position: 3, name: "Pirelli Tyres",  item: CANONICAL },
  ],
};

export default function PirelliTiresPage() {
  return (
    <main>
      <Navbar />
      <CatalogueLanding
        config={{
          eyebrow: "Brand",
          h1: "Pirelli Tyres — Wholesale Supply",
          intro:
            "Source Pirelli's iconic performance tyre range at wholesale prices. The Cinturato P7 and other Pirelli passenger car tyres are available in bulk from Okelcor with competitive pricing and global export logistics.",
          filters: { brand: "Pirelli" },
          breadcrumbSchema: breadcrumb,
          relatedGroups: [
            {
              heading: "Other Brands",
              links: [
                { label: "Michelin Tyres",    href: "/michelin-tires" },
                { label: "Bridgestone Tyres", href: "/bridgestone-tires" },
                { label: "Continental Tyres", href: "/continental-tires" },
                { label: "Goodyear Tyres",    href: "/goodyear-tires" },
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
