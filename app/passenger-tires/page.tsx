import type { Metadata } from "next";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import CatalogueLanding from "@/components/shop/catalogue-landing";

const CANONICAL = "https://www.okelcor.com/passenger-tires";

export const metadata: Metadata = {
  title: "Buy Passenger Tires at Affordable Prices | See Current Offers | OKELCOR",
  description:
    "Shop premium passenger tires for cars, SUVs, fleets, and dealers. Find all-season, summer, and winter tires at competitive prices.",
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: "Buy Passenger Tires at Affordable Prices | See Current Offers | OKELCOR",
    description:
      "Shop premium passenger tires for cars, SUVs, fleets, and dealers. Find all-season, summer, and winter tires at competitive prices.",
    url: CANONICAL,
    type: "website",
  },
  twitter: {
    title: "Buy Passenger Tires at Affordable Prices | See Current Offers | OKELCOR",
    description:
      "Shop premium passenger tires for cars, SUVs, fleets, and dealers. Find all-season, summer, and winter tires at competitive prices.",
  },
};

const breadcrumb = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home",                item: "https://www.okelcor.com" },
    { "@type": "ListItem", position: 2, name: "Shop",                item: "https://www.okelcor.com/shop" },
    { "@type": "ListItem", position: 3, name: "Passenger Car Tyres", item: CANONICAL },
  ],
};

export default function PassengerTiresPage() {
  return (
    <main>
      <Navbar />
      <CatalogueLanding
        config={{
          eyebrow: "Tyre Category",
          h1: "Passenger Tires for Sale – Browse Available PCR Tyres",
          intro: [
            [
              "Shop premium passenger tires at ",
              { text: "OKELCOR GmbH", href: "/wholesale-tire-distributors-europe" },
              " for private drivers, tire dealers, workshops, and fleet buyers. Explore high-quality passenger car tires, SUV tires, all-season tires, ",
              { text: "summer tires", href: "/summer-tires" },
              ", and winter tires from trusted brands at competitive prices. Browse the catalog below or use the filters to quickly find the right tires for your vehicle or business needs.",
            ],
          ],
          filters: { type: "PCR" },
          breadcrumbSchema: breadcrumb,
          popularSizes: [
            { label: "195/65R15",  href: "/shop?type=PCR&size=195%2F65R15" },
            { label: "205/55R16",  href: "/shop?type=PCR&size=205%2F55R16" },
            { label: "225/45R17",  href: "/shop?type=PCR&size=225%2F45R17" },
            { label: "215/55R17",  href: "/shop?type=PCR&size=215%2F55R17" },
            { label: "185/65R15",  href: "/shop?type=PCR&size=185%2F65R15" },
            { label: "235/45R18",  href: "/shop?type=PCR&size=235%2F45R18" },
            { label: "245/40R18",  href: "/shop?type=PCR&size=245%2F40R18" },
          ],
          faq: [
            {
              q: "What is a PCR tyre?",
              a: "PCR stands for Passenger Car Radial. These are standard road tyres designed for passenger vehicles including hatchbacks, saloons, estate cars, and SUVs. PCR tyres are the most commonly traded category in the wholesale tyre market and are available in summer, winter, and all-season variants across a wide range of brands and price points.",
            },
            {
              q: "What is the minimum order quantity for wholesale PCR tyres?",
              a: "Minimum order quantities depend on the product mix and destination. For established wholesale partners, Okelcor accommodates mixed container loads combining PCR sizes and brands. Contact our sales team for a tailored quotation based on your target market and required volume.",
            },
            {
              q: "Which PCR brands do you stock?",
              a: "Okelcor sources PCR tyres from all major global manufacturers including Michelin, Bridgestone, Continental, Pirelli, Goodyear, Dunlop, and Falken, plus selected mid-range and value-tier brands depending on market availability. We can advise on the optimal brand mix for your target market.",
            },
            {
              q: "Do you supply used PCR tyres?",
              a: "Yes. Okelcor offers Grade A used passenger car tyres sourced from European markets. All used PCR tyres are inspected for minimum tread depth and structural integrity before dispatch. Used PCR is particularly popular for export to cost-sensitive markets in Africa and Eastern Europe.",
            },
            {
              q: "What documents are provided with PCR wholesale shipments?",
              a: "All wholesale shipments include a proforma invoice, commercial invoice, packing list, and bill of lading or airway bill. EU-registered buyers receive documentation supporting customs compliance including REX (Registered Exporter) certification where applicable.",
            },
          ],
          relatedGroups: [
            {
              heading: "Also Available",
              links: [
                { label: "Truck & Bus Radial Tyres (TBR)", href: "/light-truck-tires" },
                { label: "Full Tyre Catalogue",            href: "/shop" },
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
            {
              heading: "Shop by Brand",
              links: [
                { label: "Michelin Tyres",    href: "/michelin-tires" },
                { label: "Bridgestone Tyres", href: "/bridgestone-tires" },
                { label: "Continental Tyres", href: "/continental-tires" },
                { label: "Pirelli Tyres",     href: "/pirelli-tires" },
                { label: "Goodyear Tyres",    href: "/goodyear-tires" },
              ],
            },
          ],
        }}
      />
      <Footer />
    </main>
  );
}
