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
    { "@type": "ListItem", position: 1, name: "Home",          item: "https://www.okelcor.com" },
    { "@type": "ListItem", position: 2, name: "Shop",          item: "https://www.okelcor.com/shop" },
    { "@type": "ListItem", position: 3, name: "Pirelli Tyres", item: CANONICAL },
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
          intro: [
            "Pirelli is an Italian tyre manufacturer with over 150 years of history, renowned globally for its ultra-high-performance (UHP) tyre technology and its exclusive position as Formula 1's sole tyre supplier since 2011. Headquartered in Milan, Pirelli focuses on the premium and prestige PCR segment, with OEM fitments on Ferrari, Porsche, Maserati, Lamborghini, and other luxury vehicle platforms. This positioning commands a price premium that reflects the brand's exclusivity and performance credentials.",
            "For wholesale distributors, Pirelli's demand is strongest in markets with high concentrations of premium vehicles — Western Europe, the Gulf states, and parts of Southeast Asia. The Cinturato P7 offers sustainable performance for standard passenger cars; the P Zero targets sports and performance vehicles; and the Scorpion range covers premium SUVs and crossovers. Okelcor supplies Pirelli PCR tyres at wholesale prices to distribution partners who serve quality-driven end markets. Contact our sales team for Pirelli availability and pricing.",
          ],
          filters: { brand: "Pirelli" },
          breadcrumbSchema: breadcrumb,
          popularSizes: [
            { label: "245/40R18",  href: "/shop?brand=Pirelli&size=245%2F40R18" },
            { label: "225/45R17",  href: "/shop?brand=Pirelli&size=225%2F45R17" },
            { label: "205/55R16",  href: "/shop?brand=Pirelli&size=205%2F55R16" },
            { label: "255/35R19",  href: "/shop?brand=Pirelli&size=255%2F35R19" },
            { label: "275/40R20",  href: "/shop?brand=Pirelli&size=275%2F40R20" },
            { label: "235/40R18",  href: "/shop?brand=Pirelli&size=235%2F40R18" },
          ],
          faq: [
            {
              q: "What makes Pirelli a premium tyre brand?",
              a: "Pirelli's premium positioning is underpinned by its Formula 1 partnership, OEM relationships with luxury car manufacturers, and its deliberate focus on the higher end of the PCR market. Pirelli does not compete in the budget or mid-range segment, which reinforces brand exclusivity and supports a higher wholesale price point compared to first-tier generalist brands.",
            },
            {
              q: "Does Pirelli manufacture TBR (truck and bus) tyres?",
              a: "Pirelli's commercial tyre division was separated into Prometeon Tyre Group in 2015. Prometeon operates commercial vehicle tyres under its own branding. The Pirelli-branded tyre available for wholesale today refers exclusively to the PCR passenger car range. For TBR requirements, Okelcor can direct you to alternative brands.",
            },
            {
              q: "What are Pirelli's most traded wholesale models?",
              a: "The most commonly distributed Pirelli models include the Cinturato P7 (fuel-efficient PCR touring), P Zero (ultra-high-performance PCR), Scorpion Verde and Scorpion ATR (premium SUV PCR), Winter Sottozero 3 (premium winter PCR), and the Cinturato All Season Plus (all-season PCR).",
            },
            {
              q: "Is Pirelli a strong wholesale product for export markets?",
              a: "Yes. Pirelli's global brand recognition — reinforced by its F1 presence and luxury car associations — makes it a compelling export product for markets where aspirational brands carry real value. Gulf states, Nigeria, South Africa, and parts of Southeast Asia represent strong Pirelli wholesale destinations. Okelcor handles export documentation and international freight for these markets.",
            },
          ],
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
                { label: "Request a Wholesale Quote", href: "/tyre-supply-quotation" },
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
