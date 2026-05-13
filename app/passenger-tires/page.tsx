import type { Metadata } from "next";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import CatalogueLanding from "@/components/shop/catalogue-landing";

const CANONICAL = "https://www.okelcor.com/passenger-tires";

export const metadata: Metadata = {
  title: "Passenger Car Tyres Wholesale — PCR Tyres | Okelcor",
  description:
    "Wholesale passenger car tyres (PCR) from Michelin, Bridgestone, Continental, Pirelli, Goodyear, and Dunlop. Bulk PCR tyre supply with international logistics to 30+ countries.",
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: "Passenger Car Tyres Wholesale — PCR Tyres | Okelcor",
    description:
      "Wholesale PCR tyres from top global brands. Bulk orders with competitive pricing and international logistics to distributors in 30+ countries.",
    url: CANONICAL,
    type: "website",
  },
  twitter: {
    title: "Passenger Car Tyres Wholesale — PCR | Okelcor",
    description:
      "Wholesale PCR passenger car tyres from Michelin, Bridgestone, Continental, and more.",
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
          h1: "Passenger Car Tyres (PCR) — Wholesale Supply",
          intro: [
            "Passenger car radial (PCR) tyres are the most traded category in the global tyre wholesale market. As one of Europe's dedicated wholesale tyre distributors, Okelcor supplies PCR tyres in bulk to tyre retailers, wholesalers, and fleet operators across more than 30 countries. Our PCR sourcing network spans all major global brands — Michelin, Bridgestone, Continental, Pirelli, Goodyear, and Dunlop — covering sizes from compact 14-inch to large 21-inch rims across summer, winter, and all-season specifications.",
            "Whether you are building a summer stocking programme for Southern European markets, sourcing winter tyres for Scandinavian distribution, or assembling a year-round mixed-brand PCR portfolio, Okelcor delivers within competitive lead times via consolidated sea and air freight. All PCR tyres are sourced through authorised channels with complete export documentation for EU customs compliance. Contact our sales team for a personalised PCR wholesale quotation.",
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
