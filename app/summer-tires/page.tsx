import type { Metadata } from "next";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import CatalogueLanding from "@/components/shop/catalogue-landing";

const CANONICAL = "https://www.okelcor.com/summer-tires";

export const metadata: Metadata = {
  title: "Summer Tyres Wholesale — Bulk Summer Tyre Supply | Okelcor",
  description:
    "Wholesale summer tyres from Michelin, Bridgestone, Pirelli, Goodyear, and Dunlop. Bulk summer PCR and TBR tyre supply for distributors worldwide with international logistics.",
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: "Summer Tyres Wholesale — Bulk Supply | Okelcor",
    description:
      "Wholesale summer tyres — PCR and TBR — from all major brands. Competitive bulk pricing with reliable international logistics for distributors in 30+ countries.",
    url: CANONICAL,
    type: "website",
  },
  twitter: {
    title: "Summer Tyres Wholesale — Okelcor",
    description:
      "Wholesale summer tyres from Michelin, Bridgestone, Pirelli, Goodyear, and Dunlop. Global bulk supply.",
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
          h1: "Summer Tyres — Wholesale Bulk Supply",
          intro: [
            "Summer tyres use tread compounds optimised for temperatures consistently above 7°C, delivering superior grip, braking performance, and fuel efficiency on both dry and wet warm-weather roads. As a wholesale tyre distributor, Okelcor sources summer PCR and TBR tyres in bulk from all major manufacturers including Michelin, Bridgestone, Continental, Pirelli, Goodyear, and Dunlop — spanning economy, mid-range, and ultra-high-performance (UHP) segments.",
            "Demand for summer PCR peaks across Western and Southern European markets in the March–May stocking window, with African and Middle Eastern markets running summer-specification tyres year-round. Okelcor advises wholesale buyers to plan bulk orders 6–12 weeks ahead of the peak season to secure preferred sizes and competitive pricing. All summer tyre shipments include full trade documentation for EU customs compliance.",
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
