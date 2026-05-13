import type { Metadata } from "next";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import AboutPageUI from "@/components/about/about-page-ui";
import CTASection from "@/components/cta-section";

export const metadata: Metadata = {
  title: "Get your tires from one of the leading European wholesale tire distributors",
  description:
    "Okelcor is one of Europe's leading wholesale tire distributors for PCR, TBR, and top-quality used tires at competitive rates — supplying wholesalers in over 30 countries.",
  alternates: {
    canonical: "https://www.okelcor.com/wholesale-tire-distributors-europe",
  },
  openGraph: {
    title: "Leading European Wholesale Tire Distributors | Okelcor",
    description:
      "Okelcor is one of Europe's leading wholesale tire distributors — supplying PCR, TBR, and used tires to wholesalers and distributors in over 30 countries.",
    url: "https://www.okelcor.com/wholesale-tire-distributors-europe",
    type: "website",
  },
  twitter: {
    title: "European Wholesale Tire Distributor — Okelcor",
    description:
      "One of Europe's leading wholesale tire distributors for PCR, TBR, and top-quality used tires at competitive rates.",
  },
};

export default function WholesaleTireDistributorsEuropePage() {
  return (
    <main>
      <Navbar />
      <AboutPageUI />
      <CTASection />
      <Footer />
    </main>
  );
}
