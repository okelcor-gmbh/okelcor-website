"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  FileText,
  ShoppingCart,
  ClipboardList,
  Layers,
  Star,
  Settings,
  Menu,
  LogOut,
  ChevronRight,
  ChevronLeft,
  UserCircle,
  Users,
  ContactRound,
  TrendingUp,
  KeyRound,
  AlertTriangle,
  ShoppingBag,
  BarChart2,
  Megaphone,
  Zap,
  MessageSquare,
  ShieldAlert,
  FileCheck,
  Truck,
  Activity,
  ScanLine,
  BellRing,
  Bell,
  ClipboardCheck,
  UserCheck,
  Mail,
  Send,
  Images,
} from "lucide-react";
import { logoutAdmin } from "@/app/admin/actions";
import { canAccess, PATH_SECTION, ROLE_LABELS, ROLE_BADGE_COLORS } from "@/lib/admin-permissions";
import CrispNotifier from "@/components/admin/crisp-notifier";
import NotificationsBell from "@/components/admin/notifications-bell";

// ── Navigation ────────────────────────────────────────────────────────────────
// Grouped into labelled sections for a clean, scannable sidebar. Each group hides
// automatically when a role can't access any of its items. `section: null` items
// are always visible.

type NavItem = {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  section: string | null;
};

type NavGroup = {
  label: string | null; // null = no header (top-level overview group)
  items: readonly NavItem[];
};

const NAV_GROUPS: readonly NavGroup[] = [
  {
    label: null,
    items: [
      { label: "Dashboard",     href: "/admin",               icon: LayoutDashboard, section: "dashboard" },
      { label: "My Work",       href: "/admin/my-work",       icon: ClipboardCheck,  section: null },
      { label: "Notifications", href: "/admin/notifications", icon: Bell,            section: null },
    ],
  },
  {
    label: "Commerce",
    items: [
      { label: "Orders",          href: "/admin/orders",          icon: ShoppingCart,  section: "orders" },
      { label: "Quote Requests",  href: "/admin/quotes",          icon: ClipboardList, section: "quotes" },
      { label: "Products",        href: "/admin/products",        icon: Package,       section: "products" },
      { label: "Logistics",       href: "/admin/logistics",       icon: Truck,         section: "logistics" },
      { label: "EU Declarations", href: "/admin/eu-declarations", icon: FileCheck,     section: "eu_declarations" },
    ],
  },
  {
    label: "Customers & CRM",
    items: [
      { label: "Customers",          href: "/admin/customers",              icon: ContactRound,  section: "customers" },
      { label: "Customer Approvals", href: "/admin/customer-approvals",     icon: UserCheck,     section: "customers" },
      { label: "Follow-ups",         href: "/admin/crm/follow-ups",         icon: BellRing,      section: "crm" },
      { label: "Data Quality",       href: "/admin/customers/data-quality", icon: ScanLine,      section: "customers" },
      { label: "Live Chats",         href: "/admin/chats",                  icon: MessageSquare, section: "chats" },
    ],
  },
  {
    label: "Content",
    items: [
      { label: "Articles",    href: "/admin/articles",    icon: FileText,  section: "articles" },
      { label: "Hero Slides", href: "/admin/hero-slides", icon: Layers,    section: "hero_slides" },
      { label: "Promotions",  href: "/admin/promotions",  icon: Megaphone, section: "promotions" },
      { label: "FET Engines", href: "/admin/fet",         icon: Zap,       section: "fet" },
      { label: "Brands",      href: "/admin/brands",      icon: Star,      section: "brands" },
      { label: "Media Library", href: "/admin/media",       icon: Images,    section: "media" },
    ],
  },
  {
    label: "Marketing",
    items: [
      { label: "Contacts",   href: "/admin/marketing/contacts",  icon: Mail, section: "marketing" },
      { label: "Campaigns",  href: "/admin/marketing/campaigns", icon: Send, section: "marketing" },
    ],
  },
  {
    label: "Sales Channels",
    items: [
      { label: "eBay", href: "/admin/ebay", icon: ShoppingBag, section: "ebay" },
    ],
  },
  {
    label: "Insights",
    items: [
      { label: "Analytics",     href: "/admin/analytics", icon: BarChart2,  section: "analytics" },
      { label: "Supplier Intel", href: "/admin/supplier", icon: TrendingUp, section: "supplier" },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Security",      href: "/admin/security",      icon: ShieldAlert, section: "security" },
      { label: "System Health", href: "/admin/system-health", icon: Activity,    section: "system_health" },
      { label: "Users",         href: "/admin/users",         icon: Users,       section: "users" },
      { label: "Settings",      href: "/admin/settings",      icon: Settings,    section: "settings" },
    ],
  },
];

// Flat list of every nav item — used by the breadcrumb resolver.
const ALL_NAV_ITEMS: readonly NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

// ── Breadcrumb ────────────────────────────────────────────────────────────────

function getAdminBreadcrumb(pathname: string): { parent: { label: string; href: string } | null; current: string } {
  const sorted = [...ALL_NAV_ITEMS].sort((a, b) => b.href.length - a.href.length);

  const best = sorted.find(({ href }) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href)
  );

  if (!best) return { parent: null, current: "Admin" };

  const remainder = pathname.slice(best.href.length).replace(/^\//, "");
  if (!remainder) return { parent: null, current: best.label };

  const lastSeg = remainder.split("/").pop() ?? "";
  let subLabel: string;
  if (lastSeg === "new") subLabel = "New";
  else if (lastSeg === "trash") subLabel = "Trash";
  else subLabel = lastSeg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return { parent: { label: best.label, href: best.href }, current: subLabel };
}

// ROLE_LABELS and ROLE_BADGE_COLORS imported from lib/admin-permissions

function getCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : "";
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

function Sidebar({
  pathname,
  role,
  roleLabel,
  collapsed,
  onClose,
  onToggleCollapse,
  pendingChats,
}: {
  pathname: string;
  role: string;
  roleLabel: string;
  collapsed: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
  pendingChats: number;
}) {
  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  // Filter items per role, then drop any group left with no visible items.
  const visibleGroups = NAV_GROUPS
    .map((group) => ({
      ...group,
      items: group.items.filter(
        ({ section }) => section === null || !role || canAccess(role, section)
      ),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="flex h-full flex-col border-r border-white/[0.06] bg-[#161616]">
      {/* Logo */}
      <div className={[
        "flex h-16 shrink-0 items-center border-b border-white/[0.08]",
        collapsed ? "justify-center px-3" : "justify-between px-5",
      ].join(" ")}>
        {!collapsed && (
          <Image
            src="/logo/okelcor-logo.png"
            alt="Okelcor"
            width={80}
            height={22}
            className="h-[22px] w-auto object-contain brightness-0 invert"
            priority
          />
        )}
        {!collapsed && (
          <span className="rounded-full bg-[#E85C1A]/15 px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#E85C1A]">
            {roleLabel || "Admin"}
          </span>
        )}
        {collapsed && (
          <span className="text-[0.7rem] font-extrabold tracking-widest text-[#E85C1A]">OK</span>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2.5 py-4 [scrollbar-width:thin]">
        {visibleGroups.map((group, gi) => (
          <div key={group.label ?? `group-${gi}`} className={gi > 0 ? "mt-5" : undefined}>
            {/* Group header — label when expanded, divider when collapsed */}
            {group.label && !collapsed && (
              <p className="mb-1.5 px-3 text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-white/30">
                {group.label}
              </p>
            )}
            {group.label && collapsed && gi > 0 && (
              <div className="mx-2 mb-2 border-t border-white/[0.08]" />
            )}

            <div className="flex flex-col gap-0.5">
              {group.items.map(({ label, href, icon: Icon }) => {
                const active = isActive(href);
                const showBadge = label === "Live Chats" && pendingChats > 0;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onClose}
                    title={collapsed ? label : undefined}
                    aria-current={active ? "page" : undefined}
                    className={[
                      "group relative flex items-center rounded-lg py-2.5 text-[0.875rem] transition-colors duration-150",
                      collapsed ? "justify-center px-2" : "gap-3 px-3",
                      active
                        ? "bg-white/[0.07] font-semibold text-white"
                        : "font-medium text-white/55 hover:bg-white/[0.05] hover:text-white",
                    ].join(" ")}
                  >
                    {/* Active accent bar */}
                    {active && (
                      <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[#E85C1A]" />
                    )}
                    <Icon
                      size={16}
                      strokeWidth={active ? 2.2 : 1.8}
                      className={["shrink-0 transition-colors", active ? "text-[#E85C1A]" : ""].join(" ")}
                    />
                    {!collapsed && <span className="flex-1 truncate">{label}</span>}
                    {!collapsed && showBadge && (
                      <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#E85C1A] px-1 text-[9px] font-extrabold text-white">
                        {pendingChats > 9 ? "9+" : pendingChats}
                      </span>
                    )}
                    {collapsed && showBadge && (
                      <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#E85C1A]" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Collapse toggle — desktop only */}
      <div className="hidden shrink-0 border-t border-white/[0.08] p-2 lg:block">
        <button
          type="button"
          onClick={onToggleCollapse}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={[
            "flex h-9 w-full items-center rounded-lg text-white/40 transition hover:bg-white/[0.06] hover:text-white",
            collapsed ? "justify-center" : "gap-2 px-3",
          ].join(" ")}
        >
          {collapsed ? (
            <ChevronRight size={16} strokeWidth={1.8} />
          ) : (
            <>
              <ChevronLeft size={16} strokeWidth={1.8} />
              <span className="text-[0.78rem]">Collapse</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ── Shell ─────────────────────────────────────────────────────────────────────

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();

  const [sidebarOpen, setSidebarOpen]       = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [role, setRole]                     = useState("");
  const [roleLabel, setRoleLabel]           = useState("");
  const [adminName, setAdminName]           = useState("");
  const [displayName, setDisplayName]       = useState("");
  const [mustChange, setMustChange]         = useState(false);
  const [dropdownOpen, setDropdownOpen]     = useState(false);
  const [pendingChats, setPendingChats]     = useState(0);
  // null = still loading (banner hidden); false = 2FA not enabled; true = enabled
  const [twoFaEnabled, setTwoFaEnabled]     = useState<boolean | null>(null);
  const dropdownRef                         = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const r  = getCookie("admin_role");
    const rl = getCookie("admin_role_label") || ROLE_LABELS[r] || r;
    setRole(r);
    setRoleLabel(rl);
    setAdminName(getCookie("admin_name"));
    setDisplayName(getCookie("admin_display_name") || getCookie("admin_name"));
    setMustChange(getCookie("admin_must_change") === "1");
    setSidebarCollapsed(localStorage.getItem("adminSidebarCollapsed") === "1");
  }, []);

  const handleToggleCollapse = () => {
    setSidebarCollapsed((v) => {
      const next = !v;
      localStorage.setItem("adminSidebarCollapsed", next ? "1" : "0");
      return next;
    });
  };

  // Fetch current admin profile to check two_factor_enabled.
  // Runs once on mount; 403 with two_factor_required → redirect to security page.
  useEffect(() => {
    if (pathname === "/admin/login") return;
    fetch("/api/admin/me")
      .then(async (r) => {
        const json = await r.json().catch(() => ({})) as {
          two_factor_required?: boolean;
          data?: { two_factor_enabled?: boolean };
        };
        if (r.status === 401) {
          router.replace("/admin/login?expired=1");
          return;
        }
        if (r.status === 403 && json.two_factor_required) {
          router.replace("/admin/security?require_2fa=1");
          return;
        }
        if (r.ok && typeof json.data?.two_factor_enabled === "boolean") {
          setTwoFaEnabled(json.data.two_factor_enabled);
        }
      })
      .catch(() => {}); // banner stays hidden on network error — non-critical
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Route guard — redirect to /admin/unauthorized if role can't access current section
  useEffect(() => {
    if (!role) return;
    const section = Object.entries(PATH_SECTION).find(([path]) =>
      pathname.startsWith(path)
    )?.[1];
    if (section && !canAccess(role, section)) {
      router.replace("/admin/unauthorized");
    }
  }, [pathname, role, router]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Bare layout for auth pages
  if (pathname === "/admin/login") return <>{children}</>;

  const { parent: breadcrumbParent, current: activePage } = getAdminBreadcrumb(pathname);

  const avatarInitials = (displayName || adminName)
    ? (displayName || adminName).split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "A";

  return (
    <div className="flex h-screen overflow-hidden bg-[#f0f2f5]">

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          role="presentation"
          className="fixed inset-0 z-20 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={[
          "fixed inset-y-0 left-0 z-30 transition-all duration-300 ease-in-out lg:relative lg:z-auto lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          sidebarCollapsed ? "w-[64px]" : "w-60",
        ].join(" ")}
      >
        <Sidebar
          pathname={pathname}
          role={role}
          roleLabel={roleLabel}
          collapsed={sidebarCollapsed}
          onClose={() => setSidebarOpen(false)}
          onToggleCollapse={handleToggleCollapse}
          pendingChats={pendingChats}
        />
      </aside>

      {/* ── Main column ── */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">

        {/* Must-change-password banner */}
        {mustChange && pathname !== "/admin/change-password" && (
          <div className="flex shrink-0 items-center justify-between gap-4 border-b border-amber-200 bg-amber-50 px-4 py-2">
            <div className="flex items-center gap-2 text-[0.83rem] text-amber-800">
              <AlertTriangle size={14} className="shrink-0 text-amber-500" />
              Your account is using a temporary password. Please change it now.
            </div>
            <Link
              href="/admin/change-password"
              className="shrink-0 text-[0.83rem] font-semibold text-amber-700 underline hover:text-amber-900"
            >
              Change password →
            </Link>
          </div>
        )}

        {/* 2FA required banner — shown when two_factor_enabled === false */}
        {twoFaEnabled === false && pathname !== "/admin/security" && (
          <div className="flex shrink-0 items-center justify-between gap-4 border-b border-red-200 bg-red-50 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <ShieldAlert size={14} className="shrink-0 text-red-500" />
              <div>
                <span className="text-[0.83rem] font-bold text-red-800">Security action required&ensp;·&ensp;</span>
                <span className="text-[0.83rem] text-red-700">
                  Two-factor authentication is required to protect admin access.
                </span>
              </div>
            </div>
            <Link
              href="/admin/security"
              className="shrink-0 rounded-full bg-red-600 px-4 py-1.5 text-[0.78rem] font-semibold text-white transition hover:bg-red-700"
            >
              Enable 2FA
            </Link>
          </div>
        )}

        {/* Top bar */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-black/[0.07] bg-white px-4 lg:px-6">

          {/* Left: hamburger (mobile) + page title / breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Open navigation"
              onClick={() => setSidebarOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-[#1a1a1a] transition hover:bg-[#f0f2f5] lg:hidden"
            >
              <Menu size={20} strokeWidth={1.8} />
            </button>

            {breadcrumbParent ? (
              <div className="flex items-center gap-1.5">
                <Link
                  href={breadcrumbParent.href}
                  className="text-[0.9rem] font-medium text-[#5c5e62] transition hover:text-[#1a1a1a]"
                >
                  {breadcrumbParent.label}
                </Link>
                <ChevronRight size={13} strokeWidth={2.2} className="shrink-0 text-[#5c5e62]/50" />
                <h1 className="text-[0.9rem] font-extrabold text-[#1a1a1a]">{activePage}</h1>
              </div>
            ) : (
              <h1 className="text-[0.95rem] font-extrabold text-[#1a1a1a]">{activePage}</h1>
            )}
          </div>

          {/* Right: notifications + role badge + avatar dropdown */}
          <div className="flex items-center gap-3">
            <NotificationsBell />

            {role && (
              <span
                className={`hidden rounded-full px-2.5 py-0.5 text-[0.72rem] font-semibold sm:block ${
                  ROLE_BADGE_COLORS[role] ?? "bg-[#f0f2f5] text-[#5c5e62]"
                }`}
              >
                {roleLabel}
              </span>
            )}

            {/* Avatar + dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full border border-black/[0.08] bg-white py-1 pl-1 pr-3 transition hover:bg-[#f0f2f5]"
                aria-label="Account menu"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#E85C1A] text-[0.68rem] font-extrabold text-white">
                  {avatarInitials}
                </span>
                <span className="hidden max-w-[120px] truncate text-[0.82rem] font-semibold text-[#1a1a1a] sm:block">
                  {displayName || adminName || "Admin"}
                </span>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-10 z-50 w-52 overflow-hidden rounded-2xl border border-black/[0.08] bg-white shadow-lg">
                  <div className="border-b border-black/[0.06] px-4 py-3">
                    <p className="truncate text-[0.83rem] font-semibold text-[#1a1a1a]">
                      {displayName || adminName || "Admin"}
                    </p>
                    <p className="truncate text-[0.72rem] text-[#5c5e62]">{roleLabel}</p>
                  </div>

                  <div className="py-1.5">
                    <Link
                      href="/admin/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-[0.83rem] text-[#1a1a1a] transition hover:bg-[#f0f2f5]"
                    >
                      <UserCircle size={14} strokeWidth={1.8} />
                      My Profile
                    </Link>
                    <Link
                      href="/admin/change-password"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-[0.83rem] text-[#1a1a1a] transition hover:bg-[#f0f2f5]"
                    >
                      <KeyRound size={14} strokeWidth={1.8} />
                      Change Password
                    </Link>
                  </div>

                  <div className="border-t border-black/[0.06] py-1.5">
                    <form action={logoutAdmin}>
                      <button
                        type="submit"
                        className="flex w-full items-center gap-2.5 px-4 py-2 text-[0.83rem] text-red-600 transition hover:bg-red-50"
                      >
                        <LogOut size={14} strokeWidth={1.8} />
                        Sign Out
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {children}
        </main>

      </div>

      {/* Live chat notification sound + toast — polls every 20 s */}
      <CrispNotifier onPendingCount={setPendingChats} />

    </div>
  );
}
