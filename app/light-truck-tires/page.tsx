import type { Metadata } from "next";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import CatalogueLanding from "@/components/shop/catalogue-landing";

const CANONICAL = "https://www.okelcor.com/light-truck-tires";

export const metadata: Metadata = {
  title: "Truck & Bus Radial Tyres Wholesale — TBR Tyres | Okelcor",
  description:
    "Wholesale TBR tyres (truck & bus radial) from Michelin, Bridgestone, Continental, and more. Bulk commercial tyre supply with global logistics for fleets and distributors in 30+ countries.",
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: "Truck & Bus Radial Tyres Wholesale — TBR | Okelcor",
    description:
      "Wholesale TBR commercial tyres — drive, steer, and trailer axle. Competitive bulk pricing with international logistics for commercial fleet operators and distributors.",
    url: CANONICAL,
    type: "website",
  },
  twitter: {
    title: "Truck & Bus Radial Tyres Wholesale — TBR | Okelcor",
    description:
      "Wholesale TBR tyres from Michelin, Bridgestone, Continental, and more. Global commercial tyre supply.",
  },
};

const breadcrumb = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home",                     item: "https://www.okelcor.com" },
    { "@type": "ListItem", position: 2, name: "Shop",                     item: "https://www.okelcor.com/shop" },
    { "@type": "ListItem", position: 3, name: "Truck & Bus Radial Tyres", item: CANONICAL },
  ],
};

export default function LightTruckTiresPage() {
  return (
    <main>
      <Navbar />
      <CatalogueLanding
        config={{
          eyebrow: "Tyre Category",
          h1: "Truck & Bus Radial Tyres (TBR) — Wholesale Supply",
          intro:
            "Source heavy-duty TBR tyres for your commercial fleet or distribution network. We supply drive, steer, and trailer axle tyres from Michelin, Bridgestone, Continental, and other leading manufacturers, with reliable global logistics.",
          filters: { type: "TBR" },
          breadcrumbSchema: breadcrumb,
          relatedGroups: [
            {
              heading: "Also Available",
              links: [
                { label: "Passenger Car Tyres (PCR)", href: "/passenger-tires" },
                { label: "Full Tyre Catalogue",       href: "/shop" },
              ],
            },
            {
              heading: "Shop by Season",
              links: [
                { label: "All-Season Tyres", href: "/all-season-tires" },
                { label: "Summer Tyres",     href: "/summer-tires" },
                { label: "Winter Tyres",     href: "/winter-tires" },
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
