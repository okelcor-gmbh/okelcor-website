import type { Metadata } from "next";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import CatalogueLanding from "@/components/shop/catalogue-landing";

const CANONICAL = "https://www.okelcor.com/continental-tires";

export const metadata: Metadata = {
  title: "Continental Tyres Wholesale — Bulk Continental Supply | Okelcor",
  description:
    "Wholesale Continental tyres — PCR and TBR — at competitive bulk prices. Okelcor supplies Continental passenger and commercial tyres to distributors in over 30 countries.",
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: "Continental Tyres Wholesale — Bulk Supply | Okelcor",
    description:
      "Wholesale Continental PCR and TBR tyres from Okelcor. Competitive bulk pricing with reliable international logistics.",
    url: CANONICAL,
    type: "website",
  },
  twitter: {
    title: "Continental Tyres Wholesale — Okelcor",
    description: "Wholesale Continental tyres — PCR and TBR — for distributors worldwide.",
  },
};

const breadcrumb = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home",               item: "https://www.okelcor.com" },
    { "@type": "ListItem", position: 2, name: "Shop",               item: "https://www.okelcor.com/shop" },
    { "@type": "ListItem", position: 3, name: "Continental Tyres",  item: CANONICAL },
  ],
};

export default function ContinentalTiresPage() {
  return (
    <main>
      <Navbar />
      <CatalogueLanding
        config={{
          eyebrow: "Brand",
          h1: "Continental Tyres — Wholesale Supply",
          intro: [
            "Continental is one of Europe's most respected tyre manufacturers, headquartered in Hanover, Germany, with a reputation built on engineering precision and safety technology. Continental holds strong OEM fitments across Volkswagen Group, BMW, Mercedes-Benz, and other major European manufacturers, which drives substantial aftermarket demand in the replacement market. The brand competes at the premium tier for both PCR and TBR, consistently ranking at or near the top in independent European tyre tests.",
            "Okelcor distributes Continental PCR and TBR tyres at competitive wholesale prices to established distribution partners in over 30 countries. Continental's EcoContact range leads in fuel-efficiency PCR; the ContiPremiumContact delivers high-performance touring comfort; and its TBR commercial range covers the full spectrum of axle positions for long-haul and regional fleets. Continental's German-engineering heritage is a compelling selling point in quality-sensitive export markets. Contact our sales team for Continental availability and bulk pricing.",
          ],
          filters: { brand: "Continental" },
          breadcrumbSchema: breadcrumb,
          popularSizes: [
            { label: "215/55R17",    href: "/shop?brand=Continental&size=215%2F55R17" },
            { label: "225/45R18",    href: "/shop?brand=Continental&size=225%2F45R18" },
            { label: "205/60R16",    href: "/shop?brand=Continental&size=205%2F60R16" },
            { label: "195/65R15",    href: "/shop?brand=Continental&size=195%2F65R15" },
            { label: "245/35R20",    href: "/shop?brand=Continental&size=245%2F35R20" },
            { label: "315/60R22.5",  href: "/shop?brand=Continental&size=315%2F60R22.5" },
          ],
          faq: [
            {
              q: "Where are Continental tyres manufactured?",
              a: "Continental manufactures tyres in several European plants including Korbach and Hanover (Germany), Lousado (Portugal), and Puchov (Slovakia), as well as facilities in the United States, China, and other markets. European-manufactured Continental tyres carry strong credibility in quality-sensitive wholesale markets, particularly in Africa and the Middle East.",
            },
            {
              q: "What is Continental's best-selling PCR model?",
              a: "The EcoContact 6 and ContiPremiumContact 6 (now succeeded by PremiumContact 7) are consistently among Continental's highest-volume PCR models globally. The EcoContact 6 is recognised for class-leading fuel efficiency and low rolling resistance; the PremiumContact range delivers a strong balance of dry grip, wet braking, and ride comfort.",
            },
            {
              q: "Does Continental have a strong TBR commercial tyre range?",
              a: "Yes. Continental's TBR range includes the Hybrid HS3+ (mixed-service steer), Conti CrossTrac (regional steer), and EcoPlus series (fuel-efficient drive and trailer). Continental TBR is well regarded for European long-haul and regional distribution fleets and is a competitive wholesale product for distributors serving commercial vehicle operators.",
            },
            {
              q: "Is Continental a good wholesale brand for export markets?",
              a: "Yes. Continental's German-engineering reputation resonates strongly in export markets where brand credibility drives purchase decisions. African, Middle Eastern, and Southeast Asian buyers frequently specify Continental as a quality benchmark alongside Michelin and Bridgestone. Okelcor handles export documentation and freight for Continental orders to these destinations.",
            },
          ],
          relatedGroups: [
            {
              heading: "Other Brands",
              links: [
                { label: "Michelin Tyres",    href: "/michelin-tires" },
                { label: "Bridgestone Tyres", href: "/bridgestone-tires" },
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
