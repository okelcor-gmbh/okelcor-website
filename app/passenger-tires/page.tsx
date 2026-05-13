import type { Metadata } from "next";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import CatalogueLanding from "@/components/shop/catalogue-landing";
import { SITE_URL } from "@/lib/constants";

const CANONICAL = "https://www.okelcor.com/passenger-tires";

export const metadata: Metadata = {
  title: "Passenger Car Tyres Wholesale — PCR Tyres | Okelcor",
  description:
    "Wholesale passenger car tyres (PCR) from Michelin, Bridgestone, Continental, Pirelli, Goodyear, and Dunlop. Bulk PCR tyre supply with international logistics to 30+ countries.",
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: "Passenger Car Tyres Wholesale — PCR Tyres | Okelcor",
    description:
      "Wholesale PCR tyres from top global brands. Bulk orders with competitive pricing and international logistics to distributors in 30+ countries.",
    url: CANONICAL,
    type: "website",
  },
  twitter: {
    title: "Passenger Car Tyres Wholesale — PCR | Okelcor",
    description:
      "Wholesale PCR passenger car tyres from Michelin, Bridgestone, Continental, and more.",
  },
};

const breadcrumb = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home",                    item: "https://www.okelcor.com" },
    { "@type": "ListItem", position: 2, name: "Shop",                    item: "https://www.okelcor.com/shop" },
    { "@type": "ListItem", position: 3, name: "Passenger Car Tyres",     item: CANONICAL },
  ],
};

export default function PassengerTiresPage() {
  return (
    <main>
      <Navbar />
      <CatalogueLanding
        config={{
          eyebrow: "Tyre Category",
          h1: "Passenger Car Tyres (PCR) — Wholesale Supply",
          intro:
            "Browse our full range of passenger car radial tyres from Michelin, Bridgestone, Continental, Pirelli, and more. Competitive wholesale pricing with global logistics to distributors in over 30 countries.",
          filters: { type: "PCR" },
          breadcrumbSchema: breadcrumb,
          relatedGroups: [
            {
              heading: "Also Available",
              links: [
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
            {
              heading: "Shop by Brand",
              links: [
                { label: "Michelin Tyres",    href: "/michelin-tires" },
                { label: "Bridgestone Tyres", href: "/bridgestone-tires" },
                { label: "Continental Tyres", href: "/continental-tires" },
                { label: "Pirelli Tyres",     href: "/pirelli-tires" },
                { label: "Goodyear Tyres",    href: "/goodyear-tires" },
              ],
            },
          ],
        }}
      />
      <Footer />
    </main>
  );
}
