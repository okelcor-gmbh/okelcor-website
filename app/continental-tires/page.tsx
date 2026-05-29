import type { Metadata } from "next";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import CatalogueLanding from "@/components/shop/catalogue-landing";

const CANONICAL = "https://www.okelcor.com/continental-tires";

export const metadata: Metadata = {
  title: "Buy Continental Tires for Passenger Car and SUVs at Affordable Prices",
  description:
    "Shop affordable Continental tires for cars, SUVs, and fleets. Find premium all-season, summer, and winter tires at competitive retail and wholesale prices.",
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: "Buy Continental Tires for Passenger Car and SUVs at Affordable Prices",
    description:
      "Shop affordable Continental tires for cars, SUVs, and fleets. Find premium all-season, summer, and winter tires at competitive retail and wholesale prices.",
    url: CANONICAL,
    type: "website",
  },
  twitter: {
    title: "Buy Continental Tires for Passenger Car and SUVs at Affordable Prices",
    description:
      "Shop affordable Continental tires for cars, SUVs, and fleets. Find premium all-season, summer, and winter tires at competitive retail and wholesale prices.",
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
          h1: "Continental Tires for Sale – Premium Tyres For Passenger cars, SUV & Fleets",
          intro: [
            [
              "Find premium Continental tires at ",
              { text: "OKELCOR GmbH", href: "/" },
              " for passenger cars, SUVs, vans, and fleet vehicles. We offer a full range of Continental tyres available in ",
              { text: "all-season", href: "/all-season-tires" },
              ", ",
              { text: "summer", href: "/summer-tires" },
              ", and ",
              { text: "winter", href: "/winter-tires" },
              " conditions for both retail customers and wholesale buyers, including tire dealers, workshops, and export businesses. Browse the catalog below or use the filters to quickly find the right tire by size, season, performance, or vehicle type.",
            ],
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
