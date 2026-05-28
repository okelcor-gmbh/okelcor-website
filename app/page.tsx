import { Suspense } from "react";
import type { Metadata } from "next";
import { getServerLocale } from "@/lib/locale";
import { getPageMeta } from "@/lib/metadata-i18n";
import Navbar from "@/components/navbar";
import WhyOkelcor from "@/components/why-okelcor";
import FadeUp from "@/components/motion/fade-up";
import Logistics from "@/components/logistics";
import WhoWeServeSection from "@/components/who-we-serve";
import TyreHighlightsSection from "@/components/tyre-highlights";
import RexCertified from "@/components/rex-certified";
import CTASection from "@/components/cta-section";
import Footer from "@/components/footer";
import HeroSection from "@/components/home/hero-section";
import CategoriesSection from "@/components/home/categories-section";
import BrandsSection from "@/components/home/brands-section";
import FetTeaser from "@/components/fet-teaser";
import FetRoiStrip from "@/components/fet-roi-strip";
import FetVerifiedStrip from "@/components/fet-verified-strip";
import FetProof from "@/components/fet-proof";
import {
  HeroSkeleton,
  CategoriesSkeleton,
  BrandsSkeleton,
} from "@/components/ui/skeleton";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const m = getPageMeta("home", locale);
  return {
    title: { absolute: m.title },
    description: m.description,
    openGraph: {
      title: m.ogTitle,
      description: m.ogDescription,
      url: "https://www.okelcor.com",
      type: "website",
    },
    twitter: {
      title: m.twitterTitle,
      description: m.twitterDescription,
    },
  };
}

export default function Home() {
  return (
    <main className="w-full">
      <Navbar />

      <Suspense fallback={<HeroSkeleton />}>
        <HeroSection />
      </Suspense>

      <Suspense fallback={<CategoriesSkeleton />}>
        <CategoriesSection />
      </Suspense>

      <FadeUp><WhyOkelcor /></FadeUp>
      <WhoWeServeSection />

      <Suspense fallback={<BrandsSkeleton />}>
        <BrandsSection />
      </Suspense>

      <FetTeaser />
      <FetRoiStrip />
      <FetVerifiedStrip />
      <FetProof />

      <Logistics />
      <TyreHighlightsSection />
      <RexCertified />
      <CTASection />
      <Footer />
    </main>
  );
}
