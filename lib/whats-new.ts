/**
 * What's New — the panel's own changelog. Every time something ships,
 * add an entry HERE (newest first): the header sparkle shows a dot, the
 * panel shows the brief, and the sidebar pins a "New" pill on the page
 * the entry points at, until the person has opened the What's New panel.
 *
 * `section` gates an entry the same way the sidebar gates its pages —
 * someone only hears about features their role can actually open.
 * `section: null` means everyone.
 *
 * Keep briefs to one or two sentences a teammate can act on. Ship the
 * entry in the same commit as the feature.
 */

export type WhatsNewEntry = {
  /** Stable and sortable: "YYYY-MM-DD-slug". Newest id wins the seen-marker. */
  id: string;
  date: string;
  title: string;
  brief: string;
  /** The page to try it on — also receives the sidebar "New" pill. */
  href?: string;
  /** Admin section that must be visible to this role, or null for everyone. */
  section: string | null;
};

export const WHATS_NEW: WhatsNewEntry[] = [
  {
    id: "2026-09-08-console-ui",
    date: "2026-09-08",
    title: "The panel becomes an operations console",
    brief:
      "A design pass across the whole admin: crisper panels, one shared canvas that stays composed on wide monitors, a refined dark rail matching the new login, and one brand orange everywhere. Same places, same buttons — just sharper.",
    section: null,
  },
  {
    id: "2026-09-08-role-aware-dashboard",
    date: "2026-09-08",
    title: "The dashboard knows your role — and your desk",
    brief:
      "The dashboard now shows only the widgets your role can actually open, and a new “Your desk” strip at the top counts everything assigned to you — leads, follow-ups, finance items, claims and to-dos — linking straight into My Work.",
    href: "/admin",
    section: null,
  },
  {
    id: "2026-09-08-customer-portal",
    date: "2026-09-08",
    title: "The customer portal, redesigned",
    brief:
      "Customers now get a persistent portal navigation and a dashboard that shows their real situation — open orders, quotes waiting on them, and anything needing their action. Worth knowing when a customer calls about their account.",
    section: null,
  },
  {
    id: "2026-09-08-ebay-paid-status",
    date: "2026-09-08",
    title: "Paid eBay orders now read “Paid”",
    brief:
      "An eBay order that eBay has collected payment for no longer shows “Confirmed” in the orders list — it reads “Paid” until eBay starts shipping it.",
    href: "/admin/orders",
    section: "orders",
  },
  {
    id: "2026-09-08-ec-invoices-exports",
    date: "2026-09-08",
    title: "Exports in the EC Invoice country list",
    brief:
      "Picking “Exports (non-EU country)” in the EU member state dropdown flips the form straight into export mode — no need to change the transaction type first.",
    href: "/admin/ec-invoices",
    section: "finance",
  },
  {
    id: "2026-09-07-tier-pricing",
    date: "2026-09-07",
    title: "Tyre Pricing: the tier formula",
    brief:
      "Tyre100 cost × tier margin (Premium 15% / Mid 20% / Budget 30%) prices both channels: website +3% Stripe, eBay +9.5% instead. Assign tiers per brand, preview both prices, apply in bulk.",
    href: "/admin/pricing",
    section: "pricing",
  },
  {
    id: "2026-09-04-claims-portal",
    date: "2026-09-04",
    title: "Customers can file claims from their portal",
    brief:
      "Portal-filed claims land in the same claims queue marked “portal”, and the customer sees a plain-words status line as you work the claim.",
    href: "/admin/claims",
    section: "claims",
  },
];

const STORAGE_KEY = "okelcor_whats_new_seen";
/** Fired on window whenever the seen-marker changes, so the sidebar pills update live. */
export const WHATS_NEW_SEEN_EVENT = "okelcor:whats-new-seen";

export function getSeenId(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function markAllSeen(): void {
  const newest = WHATS_NEW[0]?.id;
  if (!newest) return;
  try {
    localStorage.setItem(STORAGE_KEY, newest);
  } catch {}
  try {
    window.dispatchEvent(new Event(WHATS_NEW_SEEN_EVENT));
  } catch {}
}

/** ids sort lexicographically because they lead with the ISO date. */
export function isUnseen(entry: WhatsNewEntry, seenId: string): boolean {
  return !seenId || entry.id > seenId;
}
