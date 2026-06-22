"use client";

import Image from "next/image";
import Link from "next/link";
import { Phone } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

// Dedicated landing-page header for /tyre-wholesaler (ads/SEO).
// Intentionally minimal — no account, cart, search, language switcher or mega-menu.
// `bare` drops the anchor nav (used on the thank-you page where the sections don't exist).

const PHONE_DISPLAY = "+49 89 545 583 60";
const PHONE_TEL = "+498954558360";

const NAV_LINKS = [
  { label: "Capabilities", href: "#capabilities" },
  { label: "Inventory", href: "#inventory" },
  { label: "Recent Shipments", href: "#shipments" },
];

export default function WholesalerHeader({ bare = false }: { bare?: boolean }) {
  const quoteHref = bare ? "/tyre-wholesaler#contact" : "#contact";

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-black/[0.06] bg-white shadow-sm">
      <div className="tesla-shell flex h-[68px] items-center justify-between gap-4 lg:h-[72px]">
        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center" aria-label="Okelcor home">
          <Image
            src="/logo/okelcor-logo.png"
            alt="Okelcor"
            width={120}
            height={22}
            priority
            style={{ height: "24px", width: "auto" }}
            className="object-contain"
          />
        </Link>

        {/* Center nav — desktop only */}
        {!bare && (
          <nav className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-[0.92rem] font-medium text-[var(--muted)] transition-colors hover:text-[var(--primary)]"
              >
                {link.label}
              </a>
            ))}
          </nav>
        )}

        {/* Right: phone + Request Quote */}
        <div className="flex shrink-0 items-center gap-3 sm:gap-4">
          <a
            href={`tel:${PHONE_TEL}`}
            onClick={() => trackEvent("tyre_wholesaler_phone_click")}
            className="hidden items-center gap-1.5 text-[0.9rem] font-semibold text-[var(--foreground)] transition-colors hover:text-[var(--primary)] lg:flex"
          >
            <Phone size={15} strokeWidth={2} />
            {PHONE_DISPLAY}
          </a>
          <a
            href={quoteHref}
            onClick={() => trackEvent("tyre_wholesaler_header_cta_click")}
            className="inline-flex items-center rounded-full bg-[var(--primary)] px-5 py-2.5 text-[0.88rem] font-semibold text-white shadow-sm transition-colors hover:bg-[var(--primary-hover)]"
          >
            Request Quote
          </a>
        </div>
      </div>
    </header>
  );
}
