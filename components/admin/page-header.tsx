/**
 * The one admin page header. Eyebrow (section, brand orange, tracked
 * caps) → title → optional sub, with a right-hand slot for the page's
 * actions. New pages use this instead of hand-rolling the pattern;
 * existing pages adopt it as they are touched.
 */
export default function PageHeader({
  eyebrow,
  title,
  sub,
  children,
}: {
  eyebrow: string;
  title: string;
  sub?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[#f4511e]">{eyebrow}</p>
        <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-[#1a1a1a]">{title}</h1>
        {sub && <p className="mt-1 text-[0.83rem] text-[#5c5e62]">{sub}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}
