import Link from "next/link";
import ShopPageClient from "./shop-page-client";

export type RelatedLink = { label: string; href: string };

/** An inline text segment — either plain text or a clickable internal link. */
export type IntroSegment = string | { text: string; href: string };

export type CatalogueLandingConfig = {
  eyebrow?: string;
  h1: string;
  /**
   * Intro content. Accepts:
   *   - A plain string (single paragraph)
   *   - An array where each element is either a plain string paragraph
   *     or an array of IntroSegments (text + optional link) for a rich paragraph.
   */
  intro: string | (string | IntroSegment[])[];
  filters: Record<string, string>;
  breadcrumbSchema: object;
  popularSizes?: { label: string; href: string }[];
  faq?: { q: string; a: string }[];
  relatedGroups?: { heading: string; links: RelatedLink[] }[];
  /** Translatable UI labels — fall back to English defaults when omitted. */
  uiLabels?: {
    faqHeading?: string;
    popularSizesHeading?: string;
    exploreMore?: string;
  };
};

export default function CatalogueLanding({ config }: { config: CatalogueLandingConfig }) {
  const { eyebrow, h1, intro, filters, breadcrumbSchema, popularSizes, faq, relatedGroups, uiLabels } = config;
  const faqHeading        = uiLabels?.faqHeading         ?? "Frequently Asked Questions";
  const popularSizesLabel = uiLabels?.popularSizesHeading ?? "Popular Sizes";
  const exploreMoreLabel  = uiLabels?.exploreMore         ?? "Explore more";

  const introParas: (string | IntroSegment[])[] =
    typeof intro === "string" ? [intro] : intro;

  const faqSchema =
    faq && faq.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faq.map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: { "@type": "Answer", text: item.a },
          })),
        }
      : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      {/* SEO header — H1 + intro */}
      <section
        className="w-full border-b border-black/[0.06] bg-white"
        style={{ paddingTop: "calc(var(--bar-h, 0px) + 76px + 40px)", paddingBottom: "40px" }}
      >
        <div className="tesla-shell">
          {eyebrow && (
            <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-[var(--primary)]">
              {eyebrow}
            </p>
          )}
          <h1 className="max-w-2xl text-[1.75rem] font-bold leading-tight text-[var(--foreground)] md:text-[2.4rem]">
            {h1}
          </h1>
          <div className="mt-3 max-w-2xl space-y-3">
            {introParas.map((para, i) =>
              typeof para === "string" ? (
                <p key={i} className="text-[0.92rem] leading-relaxed text-[var(--muted)]">
                  {para}
                </p>
              ) : (
                <p key={i} className="text-[0.92rem] leading-relaxed text-[var(--muted)]">
                  {para.map((seg, j) =>
                    typeof seg === "string" ? (
                      seg
                    ) : (
                      <Link
                        key={j}
                        href={seg.href}
                        className="font-medium text-[var(--foreground)] underline decoration-black/[0.15] underline-offset-2 transition-colors hover:text-[var(--primary)]"
                      >
                        {seg.text}
                      </Link>
                    )
                  )}
                </p>
              )
            )}
          </div>
        </div>
      </section>

      {/* Interactive shop catalogue — pre-filtered on mount, campaign specials suppressed */}
      <ShopPageClient initialFilters={filters} noNavbarPad source="seo-landing" />

      {/* Popular sizes */}
      {popularSizes && popularSizes.length > 0 && (
        <section className="w-full border-t border-black/[0.06] bg-white py-10 md:py-12">
          <div className="tesla-shell">
            <h2 className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
              {popularSizesLabel}
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {popularSizes.map((size) => (
                <Link
                  key={size.label}
                  href={size.href}
                  className="rounded-full border border-black/[0.12] bg-[#f5f5f5] px-4 py-1.5 text-[0.82rem] font-medium text-[var(--foreground)] transition hover:border-[var(--primary)]/60 hover:bg-white hover:text-[var(--primary)]"
                >
                  {size.label}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      {faq && faq.length > 0 && (
        <section className="w-full border-t border-black/[0.07] bg-[#f5f5f5] py-10 md:py-14">
          <div className="tesla-shell max-w-3xl">
            <h2 className="mb-6 text-[1.2rem] font-bold text-[var(--foreground)] md:text-[1.4rem]">
              {faqHeading}
            </h2>
            <div className="divide-y divide-black/[0.07]">
              {faq.map((item) => (
                <details key={item.q} className="group py-4">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-[0.9rem] font-semibold text-[var(--foreground)] [&::-webkit-details-marker]:hidden">
                    <span>{item.q}</span>
                    <span className="mt-0.5 flex-shrink-0 text-[1.25rem] font-light leading-none text-[var(--muted)] transition-transform duration-200 group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-[0.88rem] leading-relaxed text-[var(--muted)]">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Internal linking */}
      {relatedGroups && relatedGroups.length > 0 && (
        <section className="w-full border-t border-black/[0.07] bg-white py-10 md:py-14">
          <div className="tesla-shell">
            <p className="mb-6 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
              {exploreMoreLabel}
            </p>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {relatedGroups.map((group) => (
                <div key={group.heading}>
                  <h2 className="mb-3 text-[0.8rem] font-semibold text-[var(--foreground)]">
                    {group.heading}
                  </h2>
                  <ul className="space-y-1.5">
                    {group.links.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className="text-[0.88rem] text-[var(--muted)] hover:text-[var(--primary)] hover:underline"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
