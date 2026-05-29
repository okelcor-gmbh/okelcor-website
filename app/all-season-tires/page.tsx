import type { Metadata } from "next";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import CatalogueLanding from "@/components/shop/catalogue-landing";

const CANONICAL = "https://www.okelcor.com/all-season-tires";

export const metadata: Metadata = {
  title: "Buy All-Season Tires at Affordable Prices | Year-Round Passenger, SUV & TBR Tyres",
  description:
    "Shop all-season tires for cars, SUVs, and fleets. Find durable year-round tires from trusted brands at competitive wholesale and retail prices.",
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: "Buy All-Season Tires at Affordable Prices | Year-Round Passenger, SUV & TBR Tyres",
    description:
      "Shop all-season tires for cars, SUVs, and fleets. Find durable year-round tires from trusted brands at competitive wholesale and retail prices.",
    url: CANONICAL,
    type: "website",
  },
  twitter: {
    title: "Buy All-Season Tires at Affordable Prices | Year-Round Passenger, SUV & TBR Tyres",
    description:
      "Shop all-season tires for cars, SUVs, and fleets. Find durable year-round tires from trusted brands at competitive wholesale and retail prices.",
  },
};

const breadcrumb = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home",             item: "https://www.okelcor.com" },
    { "@type": "ListItem", position: 2, name: "Shop",             item: "https://www.okelcor.com/shop" },
    { "@type": "ListItem", position: 3, name: "All-Season Tyres", item: CANONICAL },
  ],
};

export default function AllSeasonTiresPage() {
  return (
    <main>
      <Navbar />
      <CatalogueLanding
        config={{
          eyebrow: "Season",
          h1: "All-Season Tires for Sale – Year-Round Tyres Available",
          intro: [
            [
              "Shop versatile all-season tires at ",
              { text: "OKELCOR GmbH", href: "/" },
              " for year-round performance in changing weather conditions. We supply high-quality all-season ",
              { text: "passenger tires", href: "/passenger-tires" },
              ", SUV tires, and ",
              { text: "light truck tires", href: "/light-truck-tires" },
              " for private drivers, workshops, tire dealers, and fleet operators. Browse our catalog below or use the filters to quickly find the right tire size, brand, load rating, and performance level for your needs.",
            ],
          ],
          filters: { season: "All Season" },
          breadcrumbSchema: breadcrumb,
          popularSizes: [
            { label: "225/45R17",  href: "/shop?season=All+Season&size=225%2F45R17" },
            { label: "215/55R17",  href: "/shop?season=All+Season&size=215%2F55R17" },
            { label: "195/65R15",  href: "/shop?season=All+Season&size=195%2F65R15" },
            { label: "205/55R16",  href: "/shop?season=All+Season&size=205%2F55R16" },
            { label: "235/55R17",  href: "/shop?season=All+Season&size=235%2F55R17" },
            { label: "225/50R17",  href: "/shop?season=All+Season&size=225%2F50R17" },
          ],
          faq: [
            {
              q: "Are all-season tyres approved for winter driving in Europe?",
              a: "All-season tyres carrying the Three-Peak Mountain Snowflake (3PMSF) symbol are legally accepted for winter use in countries with mandatory winter tyre regulations, including Germany and Austria, provided they meet the minimum tread depth requirement. M+S-only tyres do not satisfy these legal requirements in most regulated markets.",
            },
            {
              q: "What is the difference between M+S and 3PMSF all-season tyres?",
              a: "The M+S marking indicates a basic mud and snow standard. The 3PMSF symbol confirms the tyre passed stricter snow-traction tests. For wholesale buyers supplying Northern or Central European markets where winter tyre regulations apply, sourcing 3PMSF-rated all-season tyres is essential to ensure legal compliance for end customers.",
            },
            {
              q: "Is demand for all-season tyres growing?",
              a: "Yes — strongly. The all-season PCR segment has been one of the fastest-growing tyre categories in Western Europe over the past five years. Markets like the UK, Netherlands, Belgium, and Germany have seen significant consumer shifts toward all-season products, making this an increasingly attractive category for wholesale distributors building their stock portfolio.",
            },
            {
              q: "Are all-season TBR (truck) tyres available?",
              a: "Yes. Most commercial TBR tyres from Michelin, Bridgestone, and Continental carry all-season ratings as standard, as they are designed for use across varying temperatures and road conditions. Long-haul trucks operating across European climate zones routinely use all-season-rated commercial tyres year-round.",
            },
          ],
          relatedGroups: [
            {
              heading: "Other Seasons",
              links: [
                { label: "Summer Tyres",              href: "/summer-tires" },
                { label: "Winter Tyres",              href: "/winter-tires" },
                { label: "Request a Wholesale Quote", href: "/tyre-supply-quotation" },
              ],
            },
            {
              heading: "Tyre Categories",
              links: [
                { label: "Passenger Car Tyres (PCR)",      href: "/passenger-tires" },
                { label: "Truck & Bus Radial Tyres (TBR)", href: "/light-truck-tires" },
                { label: "Full Tyre Catalogue",            href: "/shop" },
              ],
            },
            {
              heading: "Shop by Brand",
              links: [
                { label: "Michelin Tyres",    href: "/michelin-tires" },
                { label: "Continental Tyres", href: "/continental-tires" },
                { label: "Bridgestone Tyres", href: "/bridgestone-tires" },
                { label: "Goodyear Tyres",    href: "/goodyear-tires" },
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
