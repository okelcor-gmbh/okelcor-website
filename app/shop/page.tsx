import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getServerLocale } from "@/lib/locale";
import { getPageMeta } from "@/lib/metadata-i18n";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import ShopPageClient from "@/components/shop/shop-page-client";
import { SHOP_REQUIRES_LOGIN } from "@/lib/flags";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const m = getPageMeta("shop", locale);
  return {
    title: m.title,
    description: m.description,
    alternates: { canonical: "https://www.okelcor.com/shop" },
    openGraph: {
      title: m.ogTitle,
      description: m.ogDescription,
      url: "https://www.okelcor.com/shop",
      type: "website",
    },
    twitter: {
      title: m.twitterTitle,
      description: m.twitterDescription,
    },
  };
}

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
