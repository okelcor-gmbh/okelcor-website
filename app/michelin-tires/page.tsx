import type { Metadata } from "next";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import CatalogueLanding from "@/components/shop/catalogue-landing";

const CANONICAL = "https://www.okelcor.com/michelin-tires";

export const metadata: Metadata = {
  title: "Michelin Tyres Wholesale — Bulk Michelin Tyre Supply | Okelcor",
  description:
    "Wholesale Michelin tyres — PCR and TBR — at competitive bulk prices. Okelcor supplies Michelin passenger and commercial tyres to distributors in over 30 countries with international logistics.",
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: "Michelin Tyres Wholesale — Bulk Supply | Okelcor",
    description:
      "Wholesale Michelin PCR and TBR tyres from Okelcor. Competitive bulk pricing with reliable international logistics.",
    url: CANONICAL,
    type: "website",
  },
  twitter: {
    title: "Michelin Tyres Wholesale — Okelcor",
    description: "Wholesale Michelin tyres — PCR and TBR — for distributors worldwide.",
  },
};

const breadcrumb = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home",           item: "https://www.okelcor.com" },
    { "@type": "ListItem", position: 2, name: "Shop",           item: "https://www.okelcor.com/shop" },
    { "@type": "ListItem", position: 3, name: "Michelin Tyres", item: CANONICAL },
  ],
};

export default function MichelinTiresPage() {
  return (
    <main>
      <Navbar />
      <CatalogueLanding
        config={{
          eyebrow: "Brand",
          h1: "Michelin Tyres — Wholesale Supply",
          intro: [
            "Michelin is consistently ranked among the world's most recognised tyre brands, with a global reputation for durability, fuel efficiency, and safety. Founded in France in 1889, Michelin manufactures tyres for passenger cars, trucks, and commercial vehicles at facilities across Europe, North America, and Asia. For wholesale tyre distributors, Michelin represents the premium end of both the PCR and TBR market — high brand recognition drives strong consumer pull, with end buyers frequently requesting Michelin by name.",
            "Okelcor sources Michelin PCR and TBR tyres at competitive wholesale prices and supplies distribution partners across Africa, the Middle East, and Eastern Europe. Key wholesale products include the Energy Saver+ (fuel-efficient PCR), CrossClimate 2 (all-season PCR), Pilot Sport 4 (performance PCR), and the X MultiWay family for long-haul truck and bus applications. Contact our sales team for current Michelin availability and bulk pricing.",
          ],
          filters: { brand: "Michelin" },
          breadcrumbSchema: breadcrumb,
          popularSizes: [
            { label: "205/55R16",    href: "/shop?brand=Michelin&size=205%2F55R16" },
            { label: "225/45R17",    href: "/shop?brand=Michelin&size=225%2F45R17" },
            { label: "195/65R15",    href: "/shop?brand=Michelin&size=195%2F65R15" },
            { label: "235/45R18",    href: "/shop?brand=Michelin&size=235%2F45R18" },
            { label: "245/40R18",    href: "/shop?brand=Michelin&size=245%2F40R18" },
            { label: "295/80R22.5",  href: "/shop?brand=Michelin&size=295%2F80R22.5" },
          ],
          faq: [
            {
              q: "Is Michelin the best tyre brand?",
              a: "Michelin consistently rates among the top tyre brands in independent European tests across dry and wet braking, fuel efficiency, and longevity. Alongside Continental and Bridgestone, Michelin occupies the premium tier of the global tyre market. The brand's investment in technology and its Formula 1 heritage reinforce its premium positioning and support strong wholesale margins.",
            },
            {
              q: "Does Michelin make TBR commercial tyres?",
              a: "Yes. Michelin is one of the leading TBR manufacturers globally. Their commercial range includes the X MultiWay 3D (steer and drive axle), X Line Energy (fuel-efficient long-haul), and X Works (construction). Michelin TBR is widely used by major European logistics operators and is a reliable wholesale product for distributors serving commercial fleet customers.",
            },
            {
              q: "What are the most popular Michelin models for wholesale?",
              a: "The most consistently traded Michelin wholesale models include the Energy Saver+ (economy PCR summer), CrossClimate 2 (premium all-season PCR), Pilot Sport 4 and 4S (performance PCR), Alpin 6 (winter PCR), and the X MultiWay 3D XDE and XZE for TBR steer and drive axle applications.",
            },
            {
              q: "Does Okelcor supply Michelin tyres to Africa and the Middle East?",
              a: "Yes. Michelin's brand recognition makes it a particularly strong wholesale product in African and Middle Eastern markets where buyers prioritise trusted brands. Okelcor handles customs documentation, export compliance, and freight logistics for Michelin shipments to these regions from our European distribution base.",
            },
          ],
          relatedGroups: [
            {
              heading: "Other Brands",
              links: [
                { label: "Bridgestone Tyres",         href: "/bridgestone-tires" },
                { label: "Continental Tyres",         href: "/continental-tires" },
                { label: "Pirelli Tyres",             href: "/pirelli-tires" },
                { label: "Goodyear Tyres",            href: "/goodyear-tires" },
                { label: "Dunlop Tyres",              href: "/dunlop-tires" },
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
