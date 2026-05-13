"use client";

import PageHero from "@/components/page-hero";
import CompanyStory from "@/components/about/company-story";
import Services from "@/components/about/services";
import LogisticsPartners from "@/components/about/logistics-partners";
import { useLanguage } from "@/context/language-context";

export default function AboutPageUI() {
  const { t } = useLanguage();
  return (
    <>
      <PageHero
        eyebrow={t.about.hero.eyebrow}
        title={t.about.hero.title}
        subtitle={t.about.hero.subtitle}
        image="/images/tyre-primary.png"
        imageAlt="Get your tires from one of the leading European wholesale tire distributors"
      />
      <CompanyStory />
      <Services />
      <LogisticsPartners />
    </>
  );
}
