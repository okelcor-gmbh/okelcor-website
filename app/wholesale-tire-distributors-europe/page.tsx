import type { Metadata } from "next";
import { getServerLocale } from "@/lib/locale";
import { getPageMeta } from "@/lib/metadata-i18n";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import AboutPageUI from "@/components/about/about-page-ui";
import CTASection from "@/components/cta-section";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const m = getPageMeta("about", locale);
  return {
    title: m.title,
    description: m.description,
    alternates: { canonical: "https://www.okelcor.com/wholesale-tire-distributors-europe" },
    openGraph: {
      title: m.ogTitle,
      description: m.ogDescription,
      url: "https://www.okelcor.com/wholesale-tire-distributors-europe",
      type: "website",
    },
    twitter: {
      title: m.twitterTitle,
      description: m.twitterDescription,
    },
  };
}

const breadcrumb = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home",                                   item: "https://www.okelcor.com" },
    { "@type": "ListItem", position: 2, name: "European Wholesale Tire Distributors", item: "https://www.okelcor.com/wholesale-tire-distributors-europe" },
  ],
};

export default function WholesaleTireDistributorsEuropePage() {
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <Navbar />
      <AboutPageUI />
      <CTASection />
      <Footer />
    </main>
  );
}
