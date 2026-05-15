import type { Metadata } from "next";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import CatalogueLanding from "@/components/shop/catalogue-landing";

const CANONICAL = "https://www.okelcor.com/bridgestone-tires";

export const metadata: Metadata = {
  title: "Buy Affordable Bridgestone Tires for Passenger cars and SUVs and Light Truck",
  description:
    "Shop Bridgestone tires for cars, SUVs, light trucks and fleets. Find premium all-season, summer, and winter tires at competitive prices.",
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: "Buy Affordable Bridgestone Tires for Passenger cars and SUVs and Light Truck",
    description:
      "Shop Bridgestone tires for cars, SUVs, light trucks and fleets. Find premium all-season, summer, and winter tires at competitive prices.",
    url: CANONICAL,
    type: "website",
  },
  twitter: {
    title: "Buy Affordable Bridgestone Tires for Passenger cars and SUVs and Light Truck",
    description:
      "Shop Bridgestone tires for cars, SUVs, light trucks and fleets. Find premium all-season, summer, and winter tires at competitive prices.",
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
          h1: "Bridgestone Tires for Sale – Passenger, SUV & Light Truck Tyres",
          intro: [
            "Find premium Bridgestone tires for passenger cars, SUVs, vans, light trucks and fleet vehicles at exclusive affordable prices. Go through our available all-season, summer, winter, and fuel-efficient tires, designed for safety, comfort, and durability. We supply Bridgestone tires for both retail customers and wholesale buyers such as tire dealers, workshops, and export businesses. Browse the catalog below or use the filters to quickly find the right tire size, model, and performance category for your needs.",
          ],
          filters: { brand: "Bridgestone" },
          breadcrumbSchema: breadcrumb,
          popularSizes: [
            { label: "225/45R17",   href: "/shop?brand=Bridgestone&size=225%2F45R17" },
            { label: "205/55R16",   href: "/shop?brand=Bridgestone&size=205%2F55R16" },
            { label: "195/65R15",   href: "/shop?brand=Bridgestone&size=195%2F65R15" },
            { label: "235/35R19",   href: "/shop?brand=Bridgestone&size=235%2F35R19" },
            { label: "245/40R18",   href: "/shop?brand=Bridgestone&size=245%2F40R18" },
            { label: "315/70R22.5", href: "/shop?brand=Bridgestone&size=315%2F70R22.5" },
          ],
          faq: [
            {
              q: "Who manufactures Bridgestone tyres?",
              a: "Bridgestone Corporation is a Japanese multinational, the world's largest tyre manufacturer by revenue, founded in 1931. Bridgestone also owns Firestone. Tyres for European distribution are manufactured at Bridgestone facilities in Poznan (Poland), Bilbao (Spain), and other European plants, supporting supply chain efficiency for European wholesale distribution.",
            },
            {
              q: "How does Bridgestone compare to Michelin in quality?",
              a: "Both Bridgestone and Michelin occupy the premium tier of the global tyre market. Bridgestone typically performs strongly in wet weather and winter traction tests; Michelin often scores marginally higher in longevity and fuel efficiency metrics. In practice, both are considered first-tier premium brands — the difference is minor at product level, while Michelin carries slightly higher brand premium in some markets.",
            },
            {
              q: "What are the most traded Bridgestone models for wholesale?",
              a: "The most consistently traded Bridgestone wholesale models include the Turanza T005 (premium PCR touring), Blizzak LM005 (winter PCR flagship), Potenza Sport (performance PCR), and for TBR, the Ecopia R192 (fuel-efficient drive axle) and Duravis R002 (regional delivery).",
            },
            {
              q: "Does Bridgestone make TBR commercial tyres?",
              a: "Yes. Bridgestone's commercial range is extensive, covering long-haul drive, steer, and trailer axle positions. The Ecopia series targets fuel-efficiency-focused fleet operators; the Duravis range is built for durability in heavy-duty regional and urban applications. Both are popular wholesale products for distributors serving commercial vehicle operators.",
            },
          ],
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
                { label: "Request a Wholesale Quote",      href: "/tyre-supply-quotation" },
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
