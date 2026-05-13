"use client";

import { useLanguage } from "@/context/language-context";

const PARTNER_LOGOS = [
  { name: "Hapag-Lloyd", logo: "/partners/download.png",        url: "https://www.hapag-lloyd.com" },
  { name: "DB Schenker", logo: "/partners/download%20(1).png",  url: "https://www.dbschenker.com" },
  { name: "Fortuna",     logo: "/partners/Fortuna-logo.png",    url: null },
];

export default function LogisticsPartners() {
  const { t } = useLanguage();
  const categories = [
    t.about.logistics.categoryOcean,
    t.about.logistics.categoryLogistics,
    t.about.logistics.categoryBrand,
  ];
  const PARTNERS = PARTNER_LOGOS.map((p, i) => ({ ...p, category: categories[i] }));
  return (
    <section className="w-full bg-[#f5f5f5] py-8">
      <div className="tesla-shell">
        <div className="grid gap-6 md:grid-cols-[1.25fr_0.75fr] md:items-stretch">

          {/* Large image card */}
          <div className="relative min-h-[360px] overflow-hidden rounded-[22px] md:min-h-[480px]">
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-[1.03]"
              style={{
                backgroundImage:
                  "url('/images/pexels-einfoto-2091159.jpg')",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/65" />

            <div className="absolute bottom-0 left-0 right-0 z-10 p-8 md:p-10">
              <p className="text-[13px] font-bold uppercase tracking-[0.28em] text-[var(--primary)]">
                {t.about.logistics.eyebrow}
              </p>
              <h2 className="mt-3 max-w-lg text-3xl font-extrabold tracking-tight text-white md:text-4xl">
                {t.about.logistics.heading}
              </h2>
              <p className="mt-3 max-w-md text-[0.95rem] leading-7 text-white/80">
                {t.about.logistics.body}
              </p>
            </div>
          </div>

          {/* Partners card */}
          <div className="flex flex-col justify-between rounded-[22px] bg-[#efefef] p-8 md:p-10">
            <div>
              <p className="text-[13px] font-bold uppercase tracking-[0.28em] text-[var(--primary)]">
                {t.about.logistics.partnersEyebrow}
              </p>
              <h3 className="mt-3 text-2xl font-extrabold tracking-tight text-[var(--foreground)] md:text-3xl">
                {t.about.logistics.partnersHeading}
              </h3>
              <p className="mt-4 text-[0.93rem] leading-7 text-[var(--muted)]">
                {t.about.logistics.partnersBody}
              </p>
            </div>

            {/* Partner logo tiles */}
            <div className="mt-8 flex flex-col gap-3">
              {PARTNERS.map((p) => {
                const inner = (
                  <>
                    <div className="flex h-10 w-[120px] shrink-0 items-center">
                      <img
                        src={p.logo}
                        alt={p.name}
                        loading="lazy"
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <div className="min-w-0 border-l border-black/[0.07] pl-4">
                      <p className="text-[0.88rem] font-semibold text-[var(--foreground)]">
                        {p.name}
                      </p>
                      <p className="mt-0.5 text-[0.75rem] text-[var(--muted)]">
                        {p.category}
                      </p>
                    </div>
                  </>
                );
                return p.url ? (
                  <a
                    key={p.name}
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 rounded-[14px] bg-white px-5 py-4 transition hover:shadow-sm"
                  >
                    {inner}
                  </a>
                ) : (
                  <div
                    key={p.name}
                    className="flex items-center gap-4 rounded-[14px] bg-white px-5 py-4"
                  >
                    {inner}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
