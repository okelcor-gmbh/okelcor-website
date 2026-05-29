import type { Metadata } from "next";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import CatalogueLanding from "@/components/shop/catalogue-landing";

const CANONICAL = "https://www.okelcor.com/light-truck-tires";

export const metadata: Metadata = {
  title: "Buy Light Truck Tires | Van & Commercial Tires at OKELCOR",
  description:
    "Shop light truck tires for vans, pickups, fleets, and dealers. Find all-season, summer, and winter commercial tires at competitive prices.",
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: "Buy Light Truck Tires | Van & Commercial Tires at OKELCOR",
    description:
      "Shop light truck tires for vans, pickups, fleets, and dealers. Find all-season, summer, and winter commercial tires at competitive prices.",
    url: CANONICAL,
    type: "website",
  },
  twitter: {
    title: "Buy Light Truck Tires | Van & Commercial Tires at OKELCOR",
    description:
      "Shop light truck tires for vans, pickups, fleets, and dealers. Find all-season, summer, and winter commercial tires at competitive prices.",
  },
};

const breadcrumb = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home",                     item: "https://www.okelcor.com" },
    { "@type": "ListItem", position: 2, name: "Shop",                     item: "https://www.okelcor.com/shop" },
    { "@type": "ListItem", position: 3, name: "Truck & Bus Radial Tyres", item: CANONICAL },
  ],
};

export default function LightTruckTiresPage() {
  return (
    <main>
      <Navbar />
      <CatalogueLanding
        config={{
          eyebrow: "Tyre Category",
          h1: "Light Truck Tires for Sale – Browse our complete TBR Tyres",
          intro: [
            [
              "Shop durable light truck tires at ",
              { text: "OKELCOR GmbH", href: "/wholesale-tire-distributors-europe" },
              " for vans, pickups, commercial vehicles, and fleet operations. We supply high-performance light truck tires, van tires, ",
              { text: "all-season tires", href: "/all-season-tires" },
              ", summer tires, and winter tires for both retail and wholesale buyers. Browse the catalog below or use the filters to quickly find the right tire size, load rating, brand, or seasonal option for your vehicle or business needs.",
            ],
          ],
          filters: { type: "TBR" },
          breadcrumbSchema: breadcrumb,
          popularSizes: [
            { label: "295/80R22.5", href: "/shop?type=TBR&size=295%2F80R22.5" },
            { label: "315/70R22.5", href: "/shop?type=TBR&size=315%2F70R22.5" },
            { label: "315/80R22.5", href: "/shop?type=TBR&size=315%2F80R22.5" },
            { label: "385/65R22.5", href: "/shop?type=TBR&size=385%2F65R22.5" },
            { label: "315/60R22.5", href: "/shop?type=TBR&size=315%2F60R22.5" },
            { label: "275/70R22.5", href: "/shop?type=TBR&size=275%2F70R22.5" },
          ],
          faq: [
            {
              q: "What is the difference between drive, steer, and trailer axle TBR tyres?",
              a: "Drive axle tyres sit on the rear powered wheels and must resist scrubbing and deliver traction under load. Steer axle tyres prioritise precise handling and even wear under steering forces. Trailer axle tyres are optimised for low rolling resistance and long mileage under static load. Okelcor can supply all three axle positions from the same brand family to simplify fleet management.",
            },
            {
              q: "What TBR sizes are most commonly traded?",
              a: "The most traded commercial TBR sizes are 295/80R22.5 (steer axle standard), 315/70R22.5 (long-haul drive axle), 315/80R22.5 (heavy-duty drive), 385/65R22.5 (wide-base drive/trailer), and 315/60R22.5 (regional distribution). Contact our sales team for current availability in specific sizes and brands.",
            },
            {
              q: "Do you supply Grade A used TBR tyres?",
              a: "Yes. Okelcor sources pre-inspected Grade A used TBR tyres suitable for secondary fleet operations and budget-conscious export markets. All used TBR units are checked for minimum tread depth and casing integrity before dispatch.",
            },
            {
              q: "Which brands are available for TBR wholesale?",
              a: "Our TBR range includes Michelin (X MultiWay, X Line Energy), Bridgestone (Ecopia R192, Duravis), Continental (Hybrid HS3+, EcoPlus), Dunlop, and Falken. Mid-range TBR brands are also available depending on order volume and destination.",
            },
            {
              q: "Can I order a mixed container of PCR and TBR tyres?",
              a: "Yes. Okelcor accommodates mixed loads combining PCR and TBR tyres in the same shipment, helping wholesale buyers optimise container fill and reduce per-unit logistics cost. Our team can advise on optimal load configurations for your freight route.",
            },
          ],
          relatedGroups: [
            {
              heading: "Also Available",
              links: [
                { label: "Passenger Car Tyres (PCR)", href: "/passenger-tires" },
                { label: "Full Tyre Catalogue",       href: "/shop" },
                { label: "Request a Wholesale Quote", href: "/tyre-supply-quotation" },
              ],
            },
            {
              heading: "Shop by Season",
              links: [
                { label: "All-Season Tyres", href: "/all-season-tires" },
                { label: "Summer Tyres",     href: "/summer-tires" },
                { label: "Winter Tyres",     href: "/winter-tires" },
              ],
            },
            {
              heading: "Shop by Brand",
              links: [
                { label: "Michelin Tyres",    href: "/michelin-tires" },
                { label: "Bridgestone Tyres", href: "/bridgestone-tires" },
                { label: "Continental Tyres", href: "/continental-tires" },
                { label: "Dunlop Tyres",      href: "/dunlop-tires" },
                { label: "Falken Tyres",      href: "/falken-tires" },
              ],
            },
          ],
        }}
      />
      <Footer />
    </main>
  );
}
