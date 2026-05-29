import type { Metadata } from "next";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import CatalogueLanding from "@/components/shop/catalogue-landing";

const CANONICAL = "https://www.okelcor.com/dunlop-tires";

export const metadata: Metadata = {
  title: "Buy Affordable Dunlop Tires for Passenger cars, SUV & Light Truck vehicles",
  description:
    "Shop Dunlop tires for cars, SUVs, Light Trucks, and fleets. Find performance all-season, summer, and winter tyres at competitive retail and wholesale prices.",
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: "Buy Affordable Dunlop Tires for Passenger cars, SUV & Light Truck vehicles",
    description:
      "Shop Dunlop tires for cars, SUVs, Light Trucks, and fleets. Find performance all-season, summer, and winter tyres at competitive retail and wholesale prices.",
    url: CANONICAL,
    type: "website",
  },
  twitter: {
    title: "Buy Affordable Dunlop Tires for Passenger cars, SUV & Light Truck vehicles",
    description:
      "Shop Dunlop tires for cars, SUVs, Light Trucks, and fleets. Find performance all-season, summer, and winter tyres at competitive retail and wholesale prices.",
  },
};

const breadcrumb = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home",         item: "https://www.okelcor.com" },
    { "@type": "ListItem", position: 2, name: "Shop",         item: "https://www.okelcor.com/shop" },
    { "@type": "ListItem", position: 3, name: "Dunlop Tyres", item: CANONICAL },
  ],
};

export default function DunlopTiresPage() {
  return (
    <main>
      <Navbar />
      <CatalogueLanding
        config={{
          eyebrow: "Brand",
          h1: "Dunlop Tires for Sale – Performance Passenger cars, SUVs & Light Trucks",
          intro: [
            [
              "Shop high-quality Dunlop tires for ",
              { text: "passenger cars", href: "/passenger-tires" },
              ", SUVs, vans, ",
              { text: "light trucks", href: "/light-truck-tires" },
              ", and fleet vehicles now available at an attractive rate. We supply a full range of Dunlop tires for both retail customers and wholesale buyers, including tire dealers, workshops, and export partners. Browse the catalog below or use the filters to quickly find the right tire by size, season, performance, or vehicle type.",
            ],
          ],
          filters: { brand: "Dunlop" },
          breadcrumbSchema: breadcrumb,
          popularSizes: [
            { label: "225/45R17",  href: "/shop?brand=Dunlop&size=225%2F45R17" },
            { label: "235/40R18",  href: "/shop?brand=Dunlop&size=235%2F40R18" },
            { label: "245/40R19",  href: "/shop?brand=Dunlop&size=245%2F40R19" },
            { label: "205/55R16",  href: "/shop?brand=Dunlop&size=205%2F55R16" },
            { label: "255/35R19",  href: "/shop?brand=Dunlop&size=255%2F35R19" },
            { label: "275/35R20",  href: "/shop?brand=Dunlop&size=275%2F35R20" },
          ],
          faq: [
            {
              q: "Who owns Dunlop tyres?",
              a: "Dunlop's European tyre business is owned by Goodyear, which acquired the Dunlop tyre rights for Europe, North America, and Australia. Both brands share Goodyear manufacturing facilities while operating distinct product ranges — Goodyear as the mainstream premium brand, Dunlop as the sport-performance label. Dunlop tyre operations in Asia and Africa are run under separate licensing arrangements by Sumitomo Rubber Industries.",
            },
            {
              q: "Is Dunlop a premium brand?",
              a: "Dunlop sits in the upper-mid to premium tier — below the 'Big 3' (Michelin, Continental, Bridgestone) in pricing, but consistently above standard mid-range brands in independent test results. Its sport and performance heritage makes it a popular wholesale choice for distributors targeting driving-enthusiast buyers or markets where performance credentials add value.",
            },
            {
              q: "What is Dunlop's most traded product range?",
              a: "The Sport Maxx series is Dunlop's most widely distributed wholesale product. The Sport Maxx RT2 is a versatile ultra-high-performance summer tyre covering common performance sizes from 17- to 21-inch rims. The SportMaxx Race 2 targets more extreme track-oriented applications. The SP StreetResponse covers more mainstream touring PCR sizes.",
            },
            {
              q: "Are Dunlop and Goodyear tyres the same product?",
              a: "No. While they share manufacturing facilities, Dunlop and Goodyear are distinct product lines with separate tread designs, compounds, and performance targets. Dunlop focuses on sport and performance applications; Goodyear covers a broader spectrum including fuel efficiency (EfficientGrip), all-season (Vector), and winter (UltraGrip) categories.",
            },
          ],
          relatedGroups: [
            {
              heading: "Other Brands",
              links: [
                { label: "Goodyear Tyres",    href: "/goodyear-tires" },
                { label: "Michelin Tyres",    href: "/michelin-tires" },
                { label: "Bridgestone Tyres", href: "/bridgestone-tires" },
                { label: "Pirelli Tyres",     href: "/pirelli-tires" },
                { label: "Falken Tyres",      href: "/falken-tires" },
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
