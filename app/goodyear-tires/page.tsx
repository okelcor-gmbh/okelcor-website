import type { Metadata } from "next";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import CatalogueLanding from "@/components/shop/catalogue-landing";

const CANONICAL = "https://www.okelcor.com/goodyear-tires";

export const metadata: Metadata = {
  title: "Buy Affordable Goodyear Tires For Passenger cars, Light Trucks & SUVs",
  description:
    "Shop Goodyear tires for cars, SUVs, Light trucks and fleets. Find reliable all-season, summer, and winter tires at competitive prices.",
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: "Buy Affordable Goodyear Tires For Passenger cars, Light Trucks & SUVs",
    description:
      "Shop Goodyear tires for cars, SUVs, Light trucks and fleets. Find reliable all-season, summer, and winter tires at competitive prices.",
    url: CANONICAL,
    type: "website",
  },
  twitter: {
    title: "Buy Affordable Goodyear Tires For Passenger cars, Light Trucks & SUVs",
    description:
      "Shop Goodyear tires for cars, SUVs, Light trucks and fleets. Find reliable all-season, summer, and winter tires at competitive prices.",
  },
};

const breadcrumb = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home",           item: "https://www.okelcor.com" },
    { "@type": "ListItem", position: 2, name: "Shop",           item: "https://www.okelcor.com/shop" },
    { "@type": "ListItem", position: 3, name: "Goodyear Tyres", item: CANONICAL },
  ],
};

export default function GoodyearTiresPage() {
  return (
    <main>
      <Navbar />
      <CatalogueLanding
        config={{
          eyebrow: "Brand",
          h1: "Goodyear Tires for Sale – Premium Passenger, SUV & Wholesale Tires",
          intro: [
            [
              "Shop premium Goodyear tires for your car, SUV, van, or fleet vehicles. Whether you are looking for ",
              { text: "summer", href: "/summer-tires" },
              ", ",
              { text: "winter", href: "/winter-tires" },
              ", or ",
              { text: "all-season", href: "/all-season-tires" },
              " tires as a retail or wholesale customer, we have you covered. Browse the catalog below or use the filters to quickly find the right Goodyear tire by size, vehicle type, season, or performance needs.",
            ],
          ],
          filters: { brand: "Goodyear" },
          breadcrumbSchema: breadcrumb,
          popularSizes: [
            { label: "205/55R16",  href: "/shop?brand=Goodyear&size=205%2F55R16" },
            { label: "195/65R15",  href: "/shop?brand=Goodyear&size=195%2F65R15" },
            { label: "225/45R17",  href: "/shop?brand=Goodyear&size=225%2F45R17" },
            { label: "215/55R17",  href: "/shop?brand=Goodyear&size=215%2F55R17" },
            { label: "235/55R19",  href: "/shop?brand=Goodyear&size=235%2F55R19" },
            { label: "245/45R18",  href: "/shop?brand=Goodyear&size=245%2F45R18" },
          ],
          faq: [
            {
              q: "Is Goodyear a premium or mid-range tyre brand?",
              a: "Goodyear is positioned in the upper-mid to premium segment — below the 'Big 3' (Michelin, Continental, Bridgestone) in test rankings and pricing, but significantly above budget brands. It is a globally recognised first-tier brand with consistent independent test results across summer, winter, and all-season categories, making it a reliable wholesale product for diverse markets.",
            },
            {
              q: "What is Goodyear's most popular winter tyre model?",
              a: "The UltraGrip Performance+ and UltraGrip Performance 3 are Goodyear's flagship winter PCR tyres and consistently rank at or near the top in European independent winter tyre tests. They are particularly strong wholesale products for Scandinavian, Alpine, and Eastern European markets with mandatory or high winter-tyre adoption.",
            },
            {
              q: "Does Goodyear own Dunlop?",
              a: "Yes. Goodyear owns the Dunlop brand and associated intellectual property for Europe, North America, and Australia. Both brands are manufactured at shared Goodyear facilities while maintaining distinct identities — Goodyear as the mainstream premium brand, Dunlop as the sport-performance label.",
            },
            {
              q: "Does Goodyear make TBR commercial tyres?",
              a: "Yes. Goodyear's commercial TBR range includes the KMAX (long-haul drive), FUELMAX (fuel-efficient drive and steer), and OPTITRAC (mixed-service). These are available through Goodyear commercial tyre channels. Okelcor's primary Goodyear supply focuses on the PCR range — contact our team for specific TBR enquiries.",
            },
          ],
          relatedGroups: [
            {
              heading: "Other Brands",
              links: [
                { label: "Michelin Tyres",    href: "/michelin-tires" },
                { label: "Bridgestone Tyres", href: "/bridgestone-tires" },
                { label: "Continental Tyres", href: "/continental-tires" },
                { label: "Pirelli Tyres",     href: "/pirelli-tires" },
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
