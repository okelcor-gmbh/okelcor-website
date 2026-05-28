import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/context/cart-context";
import { LanguageProvider } from "@/context/language-context";
import CartDrawer from "@/components/cart/cart-drawer";
import CookieConsent from "@/components/cookie-consent";
import BackToTop from "@/components/back-to-top";
import AnalyticsScript from "@/components/analytics-script";
import { SearchProvider } from "@/context/search-context";
import SearchModal from "@/components/search/search-modal";
import { SITE_URL as SITE_URL_FALLBACK } from "@/lib/constants";
import { CustomerAuthProvider } from "@/context/CustomerAuthContext";
import { SiteSettingsProvider } from "@/context/site-settings-context";
import { getSiteSettings } from "@/lib/site-settings";
import { getServerLocale } from "@/lib/locale";
import CrispChat from "@/components/crisp-chat";
import AnnouncementBar from "@/components/announcement-bar";
import PostHogProvider from "@/components/posthog-provider";

const SITE_URL = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_BASE_URL || SITE_URL_FALLBACK);
  } catch {
    return new URL(SITE_URL_FALLBACK);
  }
})();

const BASE_URL = SITE_URL.href;

export const metadata: Metadata = {
  metadataBase: new URL("https://www.okelcor.com"),
  title: {
    default: "OKELCOR TIRES - The Cheapest Tyres on the Internet",
    template: "%s | Okelcor Tires",
  },
  description:
    "Munich-based global tyre supplier. Premium PCR, TBR, and used tyres for businesses, fleets, and individual drivers in over 30 countries.",
  keywords: ["tyres", "tires", "wholesale", "PCR", "TBR", "bulk tires", "Okelcor"],
  openGraph: {
    type: "website",
    siteName: "Okelcor Tires",
    locale: "en_GB",
    url: "https://www.okelcor.com",
    title: "OKELCOR TIRES - The Cheapest Tyres on the Internet",
    description:
      "Munich-based global tyre supplier. Premium PCR, TBR, and used tyres for businesses, fleets, and individual drivers in over 30 countries.",
  },
  twitter: {
    card: "summary_large_image",
    title: "OKELCOR TIRES - The Cheapest Tyres on the Internet",
    description:
      "Munich-based global tyre supplier. Premium PCR, TBR, and used tyres for businesses, fleets, and individual drivers in over 30 countries.",
  },
  robots: {
    index: true,
    follow: true,
  },
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION } }
    : {}),
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [settings, locale] = await Promise.all([getSiteSettings(), getServerLocale()]);

  return (
    <html lang={locale} className="w-full">
      <body className="m-0 w-full p-0">
        {/* ── Site-wide structured data ── */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                name: "Okelcor",
                legalName: "Okelcor GmbH",
                url: "https://www.okelcor.com",
                logo: "https://www.okelcor.com/logo/okelcor-logo.png",
                description:
                  "Munich-based global tyre supplier delivering PCR, TBR, and used tyres to wholesalers and distributors in over 30 countries.",
                address: {
                  "@type": "PostalAddress",
                  streetAddress: "Landsberger Str. 155",
                  addressLocality: "Munich",
                  postalCode: "80687",
                  addressCountry: "DE",
                },
                contactPoint: {
                  "@type": "ContactPoint",
                  telephone: "+49-89-545-583-60",
                  contactType: "sales",
                  email: "support@okelcor.com",
                  areaServed: "Worldwide",
                },
                vatID: "DE343138173",
                sameAs: ["https://okelcor.com"],
              },
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                name: "Okelcor Tires",
                url: "https://www.okelcor.com",
                potentialAction: {
                  "@type": "SearchAction",
                  target: {
                    "@type": "EntryPoint",
                    urlTemplate:
                      "https://www.okelcor.com/shop?q={search_term_string}",
                  },
                  "query-input": "required name=search_term_string",
                },
              },
            ]),
          }}
        />
        <PostHogProvider>
        <CustomerAuthProvider>
          <SiteSettingsProvider settings={settings}>
            <LanguageProvider>
              <SearchProvider>
                <CartProvider>
                  <AnnouncementBar />
                  {children}
                  <CartDrawer />
                  <SearchModal />
                  <CookieConsent />
                  <BackToTop />
                  <AnalyticsScript />
                  <CrispChat />
                </CartProvider>
              </SearchProvider>
            </LanguageProvider>
          </SiteSettingsProvider>
        </CustomerAuthProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
