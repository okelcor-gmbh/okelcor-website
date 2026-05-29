import type { Metadata } from "next";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import CatalogueLanding from "@/components/shop/catalogue-landing";

const CANONICAL = "https://www.okelcor.com/summer-tires";

export const metadata: Metadata = {
  title: "Buy Summer Tires For Passenger car, SUVs & Light Truck | OKELCOR",
  description:
    "Shop summer tires for cars, SUVs, Light Trucks, and fleets. Find high-performance tyres for warm weather at competitive retail and wholesale prices.",
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: "Buy Summer Tires For Passenger car, SUVs & Light Truck | OKELCOR",
    description:
      "Shop summer tires for cars, SUVs, Light Trucks, and fleets. Find high-performance tyres for warm weather at competitive retail and wholesale prices.",
    url: CANONICAL,
    type: "website",
  },
  twitter: {
    title: "Buy Summer Tires For Passenger car, SUVs & Light Truck | OKELCOR",
    description:
      "Shop summer tires for cars, SUVs, Light Trucks, and fleets. Find high-performance tyres for warm weather at competitive retail and wholesale prices.",
  },
};

const breadcrumb = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home",         item: "https://www.okelcor.com" },
    { "@type": "ListItem", position: 2, name: "Shop",         item: "https://www.okelcor.com/shop" },
    { "@type": "ListItem", position: 3, name: "Summer Tyres", item: CANONICAL },
  ],
};

export default function SummerTiresPage() {
  return (
    <main>
      <Navbar />
      <CatalogueLanding
        config={{
          eyebrow: "Season",
          h1: "Summer Tires for Sale – See Available Tyres At Competitive Prices",
          intro: [
            [
              "Shop high-performance summer tires at ",
              { text: "OKELCOR GmbH", href: "/" },
              " for optimal grip, braking, and fuel efficiency in warm weather conditions. We supply premium summer tyres for ",
              { text: "passenger cars", href: "/passenger-tires" },
              ", SUVs, and ",
              { text: "light trucks", href: "/light-truck-tires" },
              ", available for both individual drivers and wholesale buyers including tire dealers, workshops, and fleet operators. Browse the catalog below or use the filters to quickly find the right tire size, brand, performance level, and price range for your needs.",
            ],
          ],
          filters: { season: "Summer" },
          breadcrumbSchema: breadcrumb,
          popularSizes: [
            { label: "195/65R15",  href: "/shop?season=Summer&size=195%2F65R15" },
            { label: "205/55R16",  href: "/shop?season=Summer&size=205%2F55R16" },
            { label: "225/45R17",  href: "/shop?season=Summer&size=225%2F45R17" },
            { label: "215/55R17",  href: "/shop?season=Summer&size=215%2F55R17" },
            { label: "235/35R19",  href: "/shop?season=Summer&size=235%2F35R19" },
            { label: "245/40R18",  href: "/shop?season=Summer&size=245%2F40R18" },
            { label: "225/40R18",  href: "/shop?season=Summer&size=225%2F40R18" },
          ],
          faq: [
            {
              q: "What temperature range are summer tyres designed for?",
              a: "Summer tyres perform optimally at road temperatures consistently above 7°C (45°F). Below that threshold, the rubber compound becomes less flexible and traction degrades significantly. For markets with regular cold winters, winter or all-season tyres should replace summer tyres during colder months.",
            },
            {
              q: "Do summer tyres perform well in wet conditions?",
              a: "Yes. Modern summer tyres are engineered for both dry and wet warm-weather conditions. Their tread patterns efficiently channel water to prevent aquaplaning, and premium summer tyres from Michelin, Continental, and Bridgestone achieve excellent wet-braking ratings in independent European tests.",
            },
            {
              q: "When is the best time to order summer tyre stock wholesale?",
              a: "European wholesale buyers typically order summer stock between January and March for delivery before the March–May tyre-swap season. African and Middle Eastern distributors should note that summer-specification tyres are used year-round in those markets. Okelcor recommends placing bulk orders 6–12 weeks in advance to lock in pricing and availability.",
            },
            {
              q: "Are summer TBR (truck) tyres available?",
              a: "Most heavy commercial TBR tyres are rated all-season rather than dedicated summer. However, commercial vehicles operating exclusively in warm climates are routinely fitted with summer-rated or warm-season variants. Contact our sales team to discuss the right product specification for your fleet or distribution target market.",
            },
          ],
          relatedGroups: [
            {
              heading: "Other Seasons",
              links: [
                { label: "Winter Tyres",                   href: "/winter-tires" },
                { label: "All-Season Tyres",               href: "/all-season-tires" },
                { label: "Request a Wholesale Quote",       href: "/tyre-supply-quotation" },
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
                { label: "Pirelli Tyres",     href: "/pirelli-tires" },
                { label: "Goodyear Tyres",    href: "/goodyear-tires" },
                { label: "Dunlop Tyres",      href: "/dunlop-tires" },
              ],
            },
          ],
        }}
      />
      <Footer />
    </main>
  );
}
