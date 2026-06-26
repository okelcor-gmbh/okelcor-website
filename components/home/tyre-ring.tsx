/**
 * components/home/tyre-ring.tsx
 *
 * Decorative concentric-ring motif (reads as a tyre / wheel), used as a
 * low-opacity animated background element across the homepage sections.
 * Purely decorative — always aria-hidden.
 */

export default function TyreRing({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" fill="none" aria-hidden="true" className={className}>
      <circle cx="100" cy="100" r="96" stroke="currentColor" strokeWidth="1" strokeDasharray="2 6" />
      <circle cx="100" cy="100" r="74" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="100" cy="100" r="52" stroke="currentColor" strokeWidth="1" strokeDasharray="1 5" />
      <circle cx="100" cy="100" r="30" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="100" cy="100" r="6" fill="currentColor" />
    </svg>
  );
}
