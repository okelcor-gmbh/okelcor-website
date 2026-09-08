"use client";

/**
 * The portal's persistent navigation — the fix for every account page being
 * an island reachable only through the dashboard's card grid. Desktop: a
 * sticky left rail with the customer's identity on top. Mobile: a horizontal
 * pill bar that scrolls. Active state follows the site's language: brand
 * accent on ink, never a new colour.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Package, FileText, Receipt, Mail, LifeBuoy,
  MapPin, Building2, ShieldCheck, User, Bell,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  /** exact = only highlight on the exact path (the overview). */
  exact?: boolean;
  badge?: "unread";
};

function navFor(isB2B: boolean): { title?: string; items: NavItem[] }[] {
  return [
    {
      items: [
        { href: "/account", label: "Overview", icon: LayoutDashboard, exact: true },
        { href: "/account/orders", label: "Orders", icon: Package },
        { href: "/account/quotes", label: "Quotes", icon: FileText },
        { href: "/account/invoices", label: isB2B ? "Invoices" : "Receipts", icon: Receipt },
        { href: "/account/messages", label: "Messages", icon: Mail, badge: "unread" },
        { href: "/account/notifications", label: "Notifications", icon: Bell },
        { href: "/account/claims", label: "Claims & Returns", icon: LifeBuoy },
      ],
    },
    {
      title: "Account",
      items: [
        { href: "/account/addresses", label: "Addresses", icon: MapPin },
        ...(isB2B
          ? [
              { href: "/account/company", label: "Company Details", icon: Building2 },
              { href: "/account/vat", label: "VAT Status", icon: ShieldCheck },
            ]
          : []),
        { href: "/account/profile", label: "Profile", icon: User },
      ],
    },
  ];
}

function useUnreadCount(): number {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let active = true;
    const load = () =>
      fetch("/api/account/notifications/unread-count", { cache: "no-store" })
        .then((r) => r.json())
        .then((j) => { if (active && typeof j.unread_count === "number") setCount(j.unread_count); })
        .catch(() => {});
    load();
    const t = setInterval(load, 60_000);
    return () => { active = false; clearInterval(t); };
  }, []);
  return count;
}

export default function AccountNav({
  name, email, company, isB2B,
}: {
  name: string;
  email: string;
  company?: string | null;
  isB2B: boolean;
}) {
  const pathname = usePathname();
  const unread = useUnreadCount();
  const groups = navFor(isB2B);

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/");

  return (
    <>
      {/* ── Desktop rail ─────────────────────────────────────────────────── */}
      <aside className="hidden lg:block">
        <div className="sticky top-[96px]">
          {/* Identity */}
          <div className="mb-5 flex items-center gap-3 px-1">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-[1rem] font-extrabold text-white">
              {name[0]?.toUpperCase() ?? "U"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[0.92rem] font-bold text-[var(--foreground)]">{name}</p>
              <p className="truncate text-[0.72rem] text-[var(--muted)]">{company || email}</p>
            </div>
          </div>

          <nav aria-label="Account">
            {groups.map((group, gi) => (
              <div key={gi} className={gi > 0 ? "mt-5" : ""}>
                {group.title && (
                  <p className="mb-1.5 px-3.5 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">
                    {group.title}
                  </p>
                )}
                <ul className="space-y-0.5">
                  {group.items.map((item) => {
                    const active = isActive(item);
                    return (
                      <li key={item.href}>
                        <Link href={item.href} aria-current={active ? "page" : undefined}
                          className={`group flex items-center gap-2.5 rounded-full px-3.5 py-2 text-[0.86rem] font-semibold transition ${
                            active
                              ? "bg-[var(--foreground)] text-white"
                              : "text-[var(--muted)] hover:bg-black/[0.05] hover:text-[var(--foreground)]"
                          }`}>
                          <item.icon size={15} strokeWidth={2}
                            className={active ? "text-[var(--primary)]" : "text-[var(--muted)] transition group-hover:text-[var(--foreground)]"} />
                          <span className="truncate">{item.label}</span>
                          {item.badge === "unread" && unread > 0 && (
                            <span className="ml-auto rounded-full bg-[var(--primary)] px-1.5 py-0.5 text-[0.62rem] font-bold leading-none text-white">
                              {unread > 99 ? "99+" : unread}
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      </aside>

      {/* ── Mobile pill bar ──────────────────────────────────────────────── */}
      <nav aria-label="Account" className="-mx-1 mb-5 overflow-x-auto pb-1 lg:hidden">
        <div className="flex w-max gap-1.5 px-1">
          {groups.flatMap((g) => g.items).map((item) => {
            const active = isActive(item);
            return (
              <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[0.8rem] font-semibold transition ${
                  active
                    ? "bg-[var(--foreground)] text-white"
                    : "bg-white text-[var(--muted)] ring-1 ring-black/[0.07]"
                }`}>
                <item.icon size={13} strokeWidth={2.2} className={active ? "text-[var(--primary)]" : undefined} />
                {item.label}
                {item.badge === "unread" && unread > 0 && (
                  <span className="rounded-full bg-[var(--primary)] px-1.5 py-0.5 text-[0.6rem] font-bold leading-none text-white">
                    {unread > 99 ? "99+" : unread}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
