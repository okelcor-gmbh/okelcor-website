import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import ShopPageClient from "@/components/shop/shop-page-client";
import { SHOP_REQUIRES_LOGIN } from "@/lib/flags";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Buy Tyres Online – PCR, TBR & Used Tyres",
  description:
    "Browse premium PCR, TBR, OTR, and used tyres from leading global brands. Filter by brand, season, and tyre type.",
  alternates: {
    canonical: "https://www.okelcor.com/shop",
  },
  openGraph: {
    title: "Buy Tyres Online – PCR, TBR & Used Tyres | Okelcor Tires",
    description:
      "PCR, TBR, OTR, and used tyres from Michelin, Bridgestone, Goodyear, Continental, Pirelli, and Dunlop. Global wholesale supply.",
    url: "https://www.okelcor.com/shop",
    type: "website",
  },
  twitter: {
    title: "Buy Tyres Online – PCR, TBR & Used Tyres | Okelcor Tires",
    description:
      "PCR, TBR, OTR, and used tyres from top global brands. Wholesale supply worldwide.",
  },
};

const SUPPORTED_PARAMS = ["q", "type", "brand", "size", "season", "speed", "load_index", "price_min", "price_max"];

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ShopPage({ searchParams }: { searchParams: SearchParams }) {
  if (SHOP_REQUIRES_LOGIN) {
    const cookieStore = await cookies();
    if (!cookieStore.get("customer_token")?.value) {
      redirect("/login?redirect=/shop");
    }
  }

  const params = await searchParams;

  const initialFilters: Record<string, string> = {};
  for (const key of SUPPORTED_PARAMS) {
    const val = params[key];
    if (typeof val === "string" && val.trim()) initialFilters[key] = val.trim();
  }

  return (
    <main>
      <Navbar />
      <ShopPageClient
        initialFilters={Object.keys(initialFilters).length > 0 ? initialFilters : undefined}
      />
      <Footer />
    </main>
  );
}
