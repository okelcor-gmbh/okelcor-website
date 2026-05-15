import type { Metadata } from "next";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import CatalogueLanding from "@/components/shop/catalogue-landing";

const CANONICAL = "https://www.okelcor.com/winter-tires";

export const metadata: Metadata = {
  title: "Buy Winter Tires For Snow, Ice & Cold Weather Conditions | OKELCOR",
  description:
    "Shop winter tires for cars, SUVs, and fleets. Find safe, high-performance snow and ice tyres from trusted brands at competitive prices.",
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: "Buy Winter Tires For Snow, Ice & Cold Weather Conditions | OKELCOR",
    description:
      "Shop winter tires for cars, SUVs, and fleets. Find safe, high-performance snow and ice tyres from trusted brands at competitive prices.",
    url: CANONICAL,
    type: "website",
  },
  twitter: {
    title: "Buy Winter Tires For Snow, Ice & Cold Weather Conditions | OKELCOR",
    description:
      "Shop winter tires for cars, SUVs, and fleets. Find safe, high-performance snow and ice tyres from trusted brands at competitive prices.",
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
          h1: "Winter Tires for Sale – Safe & High-Performance Snow, Ice & Cold Weather Tyres",
          intro: [
            "Shop high-performance winter tires at OKELCOR GmbH for maximum safety, traction, and control in snow, ice, and cold weather conditions. We supply premium winter tires for passenger cars, SUVs, and light trucks, available for both retail customers and wholesale buyers including tire dealers, workshops, and fleet operators. Browse the catalog below or use the filters to quickly find the right tyre size, brand, load rating, and winter performance specifications for your needs.",
          ],
          filters: { season: "Winter" },
          breadcrumbSchema: breadcrumb,
          popularSizes: [
            { label: "205/55R16",  href: "/shop?season=Winter&size=205%2F55R16" },
            { label: "195/65R15",  href: "/shop?season=Winter&size=195%2F65R15" },
            { label: "225/45R17",  href: "/shop?season=Winter&size=225%2F45R17" },
            { label: "175/65R14",  href: "/shop?season=Winter&size=175%2F65R14" },
            { label: "215/60R16",  href: "/shop?season=Winter&size=215%2F60R16" },
            { label: "235/40R18",  href: "/shop?season=Winter&size=235%2F40R18" },
          ],
          faq: [
            {
              q: "Which European countries legally require winter tyres?",
              a: "Countries with mandatory winter tyre legislation include Austria, Sweden, Finland, Norway, Estonia, Latvia, Lithuania, and Slovenia. Germany requires winter tyres in wintry road conditions (situational mandate). Switzerland, Czech Republic, and Poland have strong winter tyre adoption even without full mandates. This regulatory environment creates steady wholesale demand across the region each autumn.",
            },
            {
              q: "What is the difference between M+S and 3PMSF winter tyres?",
              a: "The M+S (mud and snow) marking indicates a basic mud and snow traction standard. The Three-Peak Mountain Snowflake (3PMSF) symbol confirms the tyre passed a stricter snow-traction test and is legally accepted as a winter tyre in countries with mandatory regulations. For export to Northern or Central European markets, 3PMSF-rated tyres are recommended.",
            },
            {
              q: "When should wholesale winter tyre orders be placed?",
              a: "The winter tyre swap season in Europe runs October–December. Wholesale buyers should place bulk orders 8–16 weeks ahead — ideally between May and September — to secure availability and avoid pre-season price increases. Late orders often face stock shortages in popular sizes from top brands.",
            },
            {
              q: "Are Nordic (studded) winter tyres available?",
              a: "Studded winter tyres are permitted in Finland, Norway, Sweden, and parts of Russia and Canada during defined winter periods. Contact our sales team if your distribution market requires studded winter tyres — these need to be specified separately as they are a distinct product category.",
            },
          ],
          relatedGroups: [
            {
              heading: "Other Seasons",
              links: [
                { label: "Summer Tyres",               href: "/summer-tires" },
                { label: "All-Season Tyres",           href: "/all-season-tires" },
                { label: "Request a Wholesale Quote",  href: "/tyre-supply-quotation" },
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
