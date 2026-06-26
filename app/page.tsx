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
import HeroShowcase from "@/components/home/hero-showcase";
import GlobalReach from "@/components/home/global-reach";
import FetPromo from "@/components/home/fet-promo";
import ScrollProgress from "@/components/home/scroll-progress";
import CategoriesSection from "@/components/home/categories-section";
import BrandsSection from "@/components/home/brands-section";
import PlatformShowcase from "@/components/home/platform-showcase";
import FetShowcase from "@/components/home/fet-showcase";
import {
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
      <ScrollProgress />
      <Navbar />

      <HeroShowcase />

      {/* Global reach — scrolling flag strip of markets served */}
      <GlobalReach />

      {/* Social proof first — brands right under the hero */}
      <Suspense fallback={<BrandsSkeleton />}>
        <BrandsSection />
      </Suspense>

      <Suspense fallback={<CategoriesSkeleton />}>
        <CategoriesSection />
      </Suspense>

      <WhoWeServeSection />

      {/* The platform / process they get */}
      <PlatformShowcase />

      {/* Global supply + product depth */}
      <Logistics />
      <TyreHighlightsSection />

      <FadeUp><WhyOkelcor /></FadeUp>

      {/* Certification trust band */}
      <RexCertified />

      {/* Second product line */}
      <FetShowcase />

      <CTASection />
      <Footer />

      {/* First-visit FET spotlight (delayed, dismissible) */}
      <FetPromo />
    </main>
  );
}
