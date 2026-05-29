import type { Metadata } from "next";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import CatalogueLanding from "@/components/shop/catalogue-landing";

const CANONICAL = "https://www.okelcor.com/falken-tires";

export const metadata: Metadata = {
  title: "Buy Premium Falken Tires at Affordable Prices - Fast Shipping",
  description:
    "Shop Falken tires for cars, SUVs, and fleets. Find high-performance all-season, summer, and winter tires at competitive prices.",
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: "Buy Premium Falken Tires at Affordable Prices - Fast Shipping",
    description:
      "Shop Falken tires for cars, SUVs, and fleets. Find high-performance all-season, summer, and winter tires at competitive prices.",
    url: CANONICAL,
    type: "website",
  },
  twitter: {
    title: "Buy Premium Falken Tires at Affordable Prices - Fast Shipping",
    description:
      "Shop Falken tires for cars, SUVs, and fleets. Find high-performance all-season, summer, and winter tires at competitive prices.",
  },
};

const breadcrumb = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home",         item: "https://www.okelcor.com" },
    { "@type": "ListItem", position: 2, name: "Shop",         item: "https://www.okelcor.com/shop" },
    { "@type": "ListItem", position: 3, name: "Falken Tyres", item: CANONICAL },
  ],
};

export default function FalkenTiresPage() {
  return (
    <main>
      <Navbar />
      <CatalogueLanding
        config={{
          eyebrow: "Brand",
          h1: "Falken Tires for Sale – Performance Passenger Cars, SUVs & Light Truck Tyres",
          intro: [
            [
              "Shop top-performance Falken tires for ",
              { text: "passenger cars", href: "/passenger-tires" },
              ", SUVs, vans, and fleet vehicles now available at unbeatable prices. The tires below are available for both retail and ",
              { text: "B2B customers", href: "/tyre-supply-quotation" },
              " like; tire dealers, workshops, exporters, and fleet operators. Browse the catalog below or use the filters to quickly find the right Falken tyre by size, season, vehicle type, or performance category.",
            ],
          ],
          filters: { brand: "Falken" },
          breadcrumbSchema: breadcrumb,
          popularSizes: [
            { label: "205/55R16",  href: "/shop?brand=Falken&size=205%2F55R16" },
            { label: "225/45R17",  href: "/shop?brand=Falken&size=225%2F45R17" },
            { label: "215/55R17",  href: "/shop?brand=Falken&size=215%2F55R17" },
            { label: "195/65R15",  href: "/shop?brand=Falken&size=195%2F65R15" },
            { label: "235/45R17",  href: "/shop?brand=Falken&size=235%2F45R17" },
            { label: "245/40R18",  href: "/shop?brand=Falken&size=245%2F40R18" },
          ],
          faq: [
            {
              q: "Who makes Falken tyres?",
              a: "Falken is owned by Sumitomo Rubber Industries (SRI) of Japan, one of the world's major tyre manufacturers. SRI also controls Dunlop tyre operations in Asia and Africa under licensing arrangements. Falken operates with its own design, engineering, and brand team, manufacturing at SRI facilities in Japan, Europe, and the Americas.",
            },
            {
              q: "Is Falken a good quality tyre?",
              a: "Falken has improved consistently in quality over the past decade. While positioned below the premium 'Big 3' brands (Michelin, Continental, Bridgestone), modern Falken tyres such as the Ziex ZE310 Ecorun and Azenis FK520 score respectably in independent European tests. For wholesale buyers targeting price-sensitive markets that still demand a recognised brand, Falken offers a solid value-to-quality ratio.",
            },
            {
              q: "Is Falken cheaper than Michelin and Continental?",
              a: "Yes. Falken is typically priced 25–40% below Michelin and Continental at wholesale level, positioning it as a high-value mid-range alternative. For export markets in Africa, the Middle East, and Southeast Asia where branded quality is required but premium pricing is a barrier, Falken is a strong and consistent wholesale product.",
            },
            {
              q: "Does Falken make TBR commercial tyres?",
              a: "Yes. Falken's commercial TBR range includes the RI152 (regional steer), FI183 (long-haul drive), and FJ1 (trailer axle) in standard commercial sizes. These are a cost-competitive alternative for fleet operators seeking branded TBR below the premium price tier. Contact our sales team for current TBR availability from Falken.",
            },
          ],
          relatedGroups: [
            {
              heading: "Other Brands",
              links: [
                { label: "Michelin Tyres",    href: "/michelin-tires" },
                { label: "Bridgestone Tyres", href: "/bridgestone-tires" },
                { label: "Continental Tyres", href: "/continental-tires" },
                { label: "Dunlop Tyres",      href: "/dunlop-tires" },
                { label: "Goodyear Tyres",    href: "/goodyear-tires" },
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
