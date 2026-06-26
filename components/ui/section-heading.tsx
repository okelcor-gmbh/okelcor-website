/**
 * components/ui/section-heading.tsx
 *
 * Canonical section header — one consistent eyebrow + heading rhythm and type
 * scale used across homepage sections, so every section reads as one system.
 * Pure presentational (no client JS).
 */

export default function SectionHeading({
  eyebrow,
  heading,
  align = "left",
  className,
}: {
  eyebrow: string;
  heading: string;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div className={[align === "center" ? "text-center" : "", className ?? ""].join(" ").trim()}>
      <p className="text-[13px] font-bold uppercase tracking-[0.28em] text-[var(--primary)]">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[var(--foreground)] sm:text-4xl">
        {heading}
      </h2>
    </div>
  );
}
