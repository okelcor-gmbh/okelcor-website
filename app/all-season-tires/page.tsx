import type { Metadata } from "next";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import CatalogueLanding from "@/components/shop/catalogue-landing";

const CANONICAL = "https://www.okelcor.com/all-season-tires";

export const metadata: Metadata = {
  title: "All-Season Tyres Wholesale — Bulk Year-Round Supply | Okelcor",
  description:
    "Wholesale all-season tyres for passenger and commercial vehicles. Year-round PCR and TBR tyre solutions from leading brands, available for bulk export to distributors in 30+ countries.",
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: "All-Season Tyres Wholesale — Bulk Supply | Okelcor",
    description:
      "Wholesale all-season tyres — PCR and TBR — for simplified fleet management. Bulk pricing with international logistics from Europe.",
    url: CANONICAL,
    type: "website",
  },
  twitter: {
    title: "All-Season Tyres Wholesale — Okelcor",
    description:
      "Wholesale all-season tyres for passenger and commercial vehicles. Global bulk supply.",
  },
};

const breadcrumb = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home",             item: "https://www.okelcor.com" },
    { "@type": "ListItem", position: 2, name: "Shop",             item: "https://www.okelcor.com/shop" },
    { "@type": "ListItem", position: 3, name: "All-Season Tyres", item: CANONICAL },
  ],
};

export default function AllSeasonTiresPage() {
  return (
    <main>
      <Navbar />
      <CatalogueLanding
        config={{
          eyebrow: "Season",
          h1: "All-Season Tyres — Wholesale Bulk Supply",
          intro:
            "Year-round tyre solutions for passenger cars and commercial vehicles. Our all-season range offers reliable performance across PCR and TBR categories from leading brands, simplifying fleet management with a single tyre choice.",
          filters: { season: "All Season" },
          breadcrumbSchema: breadcrumb,
          relatedGroups: [
            {
              heading: "Other Seasons",
              links: [
                { label: "Summer Tyres", href: "/summer-tires" },
                { label: "Winter Tyres", href: "/winter-tires" },
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
              heading: "Shop by Brand",
              links: [
                { label: "Michelin Tyres",    href: "/michelin-tires" },
                { label: "Bridgestone Tyres", href: "/bridgestone-tires" },
                { label: "Continental Tyres", href: "/continental-tires" },
                { label: "Dunlop Tyres",      href: "/dunlop-tires" },
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
