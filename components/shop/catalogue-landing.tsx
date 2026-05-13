import Link from "next/link";
import ShopPageClient from "./shop-page-client";

export type RelatedLink = { label: string; href: string };

export type CatalogueLandingConfig = {
  eyebrow?: string;
  h1: string;
  intro: string;
  filters: Record<string, string>;
  breadcrumbSchema: object;
  relatedGroups?: { heading: string; links: RelatedLink[] }[];
};

export default function CatalogueLanding({ config }: { config: CatalogueLandingConfig }) {
  const { eyebrow, h1, intro, filters, breadcrumbSchema, relatedGroups } = config;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* SEO header — H1 + intro paragraph */}
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
          <p className="mt-3 max-w-2xl text-[0.92rem] leading-relaxed text-[var(--muted)]">
            {intro}
          </p>
        </div>
      </section>

      {/* Interactive shop catalogue — pre-filtered on mount, campaign specials suppressed */}
      <ShopPageClient initialFilters={filters} noNavbarPad source="seo-landing" />

      {/* Internal linking — explore related pages */}
      {relatedGroups && relatedGroups.length > 0 && (
        <section className="w-full border-t border-black/[0.07] bg-white py-10 md:py-14">
          <div className="tesla-shell">
            <p className="mb-6 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
              Explore more
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
