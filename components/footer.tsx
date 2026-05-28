"use client";

import Link from "next/link";
import Image from "next/image";
import NewsletterStrip from "@/components/newsletter-strip";
import FadeUp from "@/components/motion/fade-up";
import { useLanguage } from "@/context/language-context";
import { useSiteSettings } from "@/context/site-settings-context";
import { COMPANY_EMAIL, COMPANY_PHONE, COMPANY_ADDRESS_STREET, COMPANY_ADDRESS_CITY } from "@/lib/constants";

export default function Footer() {
  const { t } = useLanguage();
  const s = useSiteSettings();

  const address  = s.company_address ?? `${COMPANY_ADDRESS_STREET}, ${COMPANY_ADDRESS_CITY}`;
  const phone    = s.company_phone   ?? COMPANY_PHONE;
  const email    = s.company_email   ?? COMPANY_EMAIL;

  const columns = [
    {
      heading: t.footer.col.products,
      links: [
        { label: t.footer.links.shopCatalogue, href: "/shop" },
        { label: t.footer.links.pcrTyres, href: "/shop" },
        { label: t.footer.links.tbrTyres, href: "/shop" },
        { label: t.footer.links.usedTyres, href: "/shop" },
        { label: t.footer.links.requestQuote, href: "/tyre-supply-quotation" },
      ],
    },
    {
      heading: t.footer.col.company,
      links: [
        { label: t.footer.links.aboutOkelcor, href: "/wholesale-tire-distributors-europe" },
        { label: t.footer.links.newsInsights, href: "/news" },
        { label: t.footer.links.contactUs, href: "/contact" },
        { label: t.footer.links.locations, href: "/contact" },
      ],
    },
    {
      heading: t.footer.col.support,
      links: [
        { label: t.footer.links.getHelp, href: "/contact" },
        { label: t.footer.links.rex, href: "/wholesale-tire-distributors-europe" },
        { label: t.footer.links.wholesale, href: "/tyre-supply-quotation" },
        { label: t.footer.links.logistics, href: "/wholesale-tire-distributors-europe" },
      ],
    },
  ];

  return (
    <footer className="w-full bg-[#f5f5f5]">
      <FadeUp><NewsletterStrip /></FadeUp>
      <div className="tesla-shell">

        {/* Main footer grid */}
        <div className="border-t border-black/[0.07] py-12 md:py-16">
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">

            {/* Brand column */}
            <div>
              <Image
                src="/logo/okelcor-logo.png"
                alt="Okelcor"
                width={120}
                height={22}
                style={{ height: "22px", width: "auto" }}
                className="block object-contain"
              />
              <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--primary)]">
                {t.footer.motto}
              </p>
              <p className="mt-4 max-w-[260px] text-[0.85rem] leading-6 text-[var(--muted)]">
                {t.footer.tagline}
              </p>
              <div className="mt-5 flex flex-col gap-1.5 text-[0.82rem] text-[var(--muted)]">
                <span>{address}</span>
                <span>{phone}</span>
                <span>{email}</span>
              </div>
            </div>

            {/* Link columns */}
            {columns.map((col) => (
              <div key={col.heading}>
                <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--foreground)]">
                  {col.heading}
                </p>
                <ul className="flex flex-col gap-2.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} className="footer-link text-[0.88rem]">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-black/[0.07] py-6">
          <div className="flex flex-wrap items-center justify-between gap-3 text-[0.78rem] text-[var(--muted)]">
            <span>{t.footer.copyright}</span>
            <div className="flex flex-wrap gap-5">
              <Link href="/privacy" className="footer-link">{t.footer.privacy}</Link>
              <Link href="/terms" className="footer-link">{t.footer.terms}</Link>
              <Link href="/imprint" className="footer-link">{t.footer.imprint}</Link>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
}
