import type { Metadata } from "next";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import CatalogueLanding from "@/components/shop/catalogue-landing";

const CANONICAL = "https://www.okelcor.com/michelin-tires";

export const metadata: Metadata = {
  title: "Buy Michelin Tires for Passenger Cars and SUVs at Affordable Prices",
  description:
    "Shop Michelin tires for cars, SUVs, and fleets. Find premium all-season, summer, and winter tires at competitive retail and wholesale prices.",
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: "Buy Michelin Tires for Passenger Cars and SUVs at Affordable Prices",
    description:
      "Shop Michelin tires for cars, SUVs, and fleets. Find premium all-season, summer, and winter tires at competitive retail and wholesale prices.",
    url: CANONICAL,
    type: "website",
  },
  twitter: {
    title: "Buy Michelin Tires for Passenger Cars and SUVs at Affordable Prices",
    description:
      "Shop Michelin tires for cars, SUVs, and fleets. Find premium all-season, summer, and winter tires at competitive retail and wholesale prices.",
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
          h1: "Michelin Tires for Sale – Passenger and SUV Tires - Best Prices",
          intro: [
            "Find premium Michelin tires at OKELCOR for passenger cars, SUVs, vans, and fleet vehicles. We supply a wide range of Michelin passenger, all-season, summer, and winter tires for both retail customers and wholesale buyers, including tire dealers, workshops, and fleet operators. Browse the catalog below or use the filters to quickly find the right tire by size, season, or performance needs.",
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
