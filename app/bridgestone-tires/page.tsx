import type { Metadata } from "next";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import CatalogueLanding from "@/components/shop/catalogue-landing";

const CANONICAL = "https://www.okelcor.com/bridgestone-tires";

export const metadata: Metadata = {
  title: "Bridgestone Tyres Wholesale — Bulk Bridgestone Supply | Okelcor",
  description:
    "Wholesale Bridgestone tyres — PCR and TBR — at competitive bulk prices. Okelcor supplies Bridgestone passenger and commercial tyres to distributors in over 30 countries.",
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: "Bridgestone Tyres Wholesale — Bulk Supply | Okelcor",
    description:
      "Wholesale Bridgestone PCR and TBR tyres from Okelcor. Competitive bulk pricing with reliable international logistics.",
    url: CANONICAL,
    type: "website",
  },
  twitter: {
    title: "Bridgestone Tyres Wholesale — Okelcor",
    description: "Wholesale Bridgestone tyres — PCR and TBR — for distributors worldwide.",
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
          h1: "Bridgestone Tyres — Wholesale Supply",
          intro: [
            "Bridgestone is the world's largest tyre manufacturer by revenue, headquartered in Japan with production facilities across Europe, North America, and Asia. The brand spans the full spectrum from premium PCR touring and performance tyres to commercial TBR for long-haul and regional distribution. Bridgestone also owns the Firestone brand. For wholesale distributors, Bridgestone offers one of the broadest product portfolios in the market, with strong OEM fitments across major European and Asian vehicle platforms driving consistent aftermarket demand.",
            "Okelcor distributes Bridgestone tyres to wholesale partners across Europe, Africa, the Middle East, and Southeast Asia. The Turanza range is a premium PCR touring staple; the Blizzak winter series is among the best-selling winter tyres globally; and the Ecopia commercial range appeals to fleet operators focused on fuel efficiency and total cost of ownership. Contact our sales team for current Bridgestone availability and competitive bulk pricing.",
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
