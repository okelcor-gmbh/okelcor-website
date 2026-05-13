import type { Metadata } from "next";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import CatalogueLanding from "@/components/shop/catalogue-landing";

const CANONICAL = "https://www.okelcor.com/winter-tires";

export const metadata: Metadata = {
  title: "Winter Tyres Wholesale — Bulk Winter Tyre Supply | Okelcor",
  description:
    "Wholesale winter tyres from Goodyear, Michelin, Continental, and more. Bulk cold-weather PCR tyre supply for distributors in northern, Alpine, and Eastern European markets.",
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: "Winter Tyres Wholesale — Bulk Supply | Okelcor",
    description:
      "Wholesale winter tyres for northern and Alpine markets — PCR from all major brands. Bulk pricing with international logistics from Europe.",
    url: CANONICAL,
    type: "website",
  },
  twitter: {
    title: "Winter Tyres Wholesale — Okelcor",
    description:
      "Wholesale winter tyres from Goodyear, Michelin, Continental, and more. Global bulk supply.",
  },
};

const breadcrumb = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home",         item: "https://www.okelcor.com" },
    { "@type": "ListItem", position: 2, name: "Shop",         item: "https://www.okelcor.com/shop" },
    { "@type": "ListItem", position: 3, name: "Winter Tyres", item: CANONICAL },
  ],
};

export default function WinterTiresPage() {
  return (
    <main>
      <Navbar />
      <CatalogueLanding
        config={{
          eyebrow: "Season",
          h1: "Winter Tyres — Wholesale Bulk Supply",
          intro:
            "Cold-weather and Nordic-rated winter tyres for passenger cars and light commercial vehicles. Stock winter tyres from leading brands for distribution to northern, Alpine, and Eastern European markets.",
          filters: { season: "Winter" },
          breadcrumbSchema: breadcrumb,
          relatedGroups: [
            {
              heading: "Other Seasons",
              links: [
                { label: "Summer Tyres",     href: "/summer-tires" },
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
                { label: "Goodyear Tyres",    href: "/goodyear-tires" },
                { label: "Michelin Tyres",    href: "/michelin-tires" },
                { label: "Continental Tyres", href: "/continental-tires" },
                { label: "Bridgestone Tyres", href: "/bridgestone-tires" },
                { label: "Falken Tyres",      href: "/falken-tires" },
              ],
            },
          ],
        }}
      />
      <Footer />
    </main>
  );
}
