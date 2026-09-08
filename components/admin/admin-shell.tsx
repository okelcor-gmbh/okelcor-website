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
  Inbox,
  ClipboardCheck,
  UserCheck,
  Mail,
  Send,
  Images,
  Handshake,
  ReceiptText,
  LayoutGrid,
  LineChart,
  Search,
  BadgeCheck,
  X,
} from "lucide-react";
import { logoutAdmin } from "@/app/admin/actions";
import { canAccessSection, PATH_SECTION, ROLE_LABELS, ROLE_BADGE_COLORS } from "@/lib/admin-permissions";
import CrispNotifier from "@/components/admin/crisp-notifier";
import NotificationsBell from "@/components/admin/notifications-bell";
import InsightsBell from "@/components/admin/insights-bell";
import CommandPalette from "@/components/admin/command-palette";
import WhatsNew from "@/components/admin/whats-new";
import { WHATS_NEW, WHATS_NEW_SEEN_EVENT, getSeenId, isUnseen } from "@/lib/whats-new";
import { NAV_GROUPS, getAdminBreadcrumb, type NavItem } from "@/lib/admin-nav";

// ── Navigation ────────────────────────────────────────────────────────────────
// Grouped into labelled sections for a clean, scannable sidebar. Each group hides
// automatically when a role can't access any of its items. `section: null` items
// are always visible.

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
  permissions,
  collapsed,
  onClose,
  onToggleCollapse,
  pendingChats,
}: {
  pathname: string;
  role: string;
  roleLabel: string;
  permissions: string[] | null;
  collapsed: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
  pendingChats: number;
}) {
  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const [filter, setFilter] = useState("");
  const [folded, setFolded] = useState<Record<string, boolean>>({});

  // "New" pills: pages a What's New entry points at, until the person opens
  // the What's New panel (which fires the seen event and clears these live).
  const [newHrefs, setNewHrefs] = useState<Set<string>>(new Set());
  useEffect(() => {
    const compute = () => {
      const seen = getSeenId();
      setNewHrefs(new Set(
        WHATS_NEW.filter((e) => e.href && isUnseen(e, seen)).map((e) => e.href as string)
      ));
    };
    compute();
    window.addEventListener(WHATS_NEW_SEEN_EVENT, compute);
    return () => window.removeEventListener(WHATS_NEW_SEEN_EVENT, compute);
  }, []);

  // Remembered across visits. Someone who never touches Content should not have
  // to fold it away every morning.
  useEffect(() => {
    try {
      const raw = localStorage.getItem("admin_nav_folded");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time localStorage hydration, same pattern as compare-context.tsx
      if (raw) setFolded(JSON.parse(raw) as Record<string, boolean>);
    } catch {
      /* a corrupt preference is not worth an error — start expanded */
    }
  }, []);

  const toggleGroup = (label: string) => {
    setFolded((prev) => {
      const next = { ...prev, [label]: !prev[label] };
      try {
        localStorage.setItem("admin_nav_folded", JSON.stringify(next));
      } catch {
        /* private mode; the fold just will not persist */
      }
      return next;
    });
  };

  const q = filter.trim().toLowerCase();

  // A fold is ignored while the filter is in use. Typing a search and getting
  // no result because the match sits inside a group you collapsed last week is
  // the worst failure this control could have.
  const isFolded = (label: string) => !q && Boolean(folded[label]);

  // Filter items per role, then by the search box, then drop any group left
  // with nothing in it.
  const visibleGroups = NAV_GROUPS
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) =>
          (item.section === null || !role || canAccessSection(role, item.section, permissions)) &&
          (!q ||
            `${item.label} ${item.href} ${item.keywords ?? ""}`.toLowerCase().includes(q)),
      ),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="flex h-full flex-col border-r border-white/[0.06] bg-[#101216]">
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
          <span className="rounded-full bg-[#f4511e]/15 px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#f4511e]">
            {roleLabel || "Admin"}
          </span>
        )}
        {collapsed && (
          <span className="text-[0.7rem] font-extrabold tracking-widest text-[#f4511e]">OK</span>
        )}
      </div>

      {/* Filter — hidden when collapsed, where there is no room for it and the
          Cmd+K palette is the better tool anyway. */}
      {!collapsed && (
        <div className="shrink-0 px-2.5 pt-3">
          <div className="relative">
            <Search
              size={13}
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-white/35"
            />
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter menu…"
              aria-label="Filter the menu"
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] py-1.5 pl-7 pr-7 text-[0.78rem] text-white outline-none transition placeholder:text-white/30 focus:border-[#f4511e]/60 focus:bg-white/[0.07]"
            />
            {filter && (
              <button
                type="button"
                onClick={() => setFilter("")}
                aria-label="Clear filter"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-white/40 transition hover:text-white"
              >
                <X size={12} />
              </button>
            )}
          </div>
          <p className="mt-1.5 px-0.5 text-[0.62rem] text-white/25">
            or press <kbd className="font-sans font-semibold text-white/45">⌘K</kbd> to jump anywhere
          </p>
        </div>
      )}

      {/* Nav links */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2.5 py-4 [scrollbar-width:thin]">
        {visibleGroups.length === 0 && (
          <p className="px-3 py-6 text-center text-[0.78rem] text-white/35">
            Nothing matches “{filter}”.
          </p>
        )}
        {visibleGroups.map((group, gi) => (
          <div key={group.label ?? `group-${gi}`} className={gi > 0 ? "mt-5" : undefined}>
            {/* Group header — a fold toggle when expanded, a divider when the
                sidebar is collapsed to icons. */}
            {group.label && !collapsed && (
              <button
                type="button"
                onClick={() => toggleGroup(group.label as string)}
                aria-expanded={!isFolded(group.label as string)}
                className="mb-1.5 flex w-full items-center gap-1 rounded px-3 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-white/30 transition hover:text-white/60"
              >
                <span className="flex-1 text-left">{group.label}</span>
                <ChevronRight
                  size={11}
                  className={`transition-transform ${isFolded(group.label as string) ? "" : "rotate-90"}`}
                />
              </button>
            )}
            {group.label && collapsed && gi > 0 && (
              <div className="mx-2 mb-2 border-t border-white/[0.08]" />
            )}

            <div className={`flex flex-col gap-0.5 ${
              group.label && !collapsed && isFolded(group.label) ? "hidden" : ""
            }`}>
              {group.items.map(({ label, href, icon: Icon }) => {
                const active = isActive(href);
                const showBadge = label === "Live Chats" && pendingChats > 0;
                const showNew = !showBadge && newHrefs.has(href);
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
                      <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[#f4511e]" />
                    )}
                    <Icon
                      size={16}
                      strokeWidth={active ? 2.2 : 1.8}
                      className={["shrink-0 transition-colors", active ? "text-[#f4511e]" : ""].join(" ")}
                    />
                    {!collapsed && <span className="flex-1 truncate">{label}</span>}
                    {!collapsed && showBadge && (
                      <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#f4511e] px-1 text-[9px] font-extrabold text-white">
                        {pendingChats > 9 ? "9+" : pendingChats}
                      </span>
                    )}
                    {collapsed && showBadge && (
                      <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#f4511e]" />
                    )}
                    {!collapsed && showNew && (
                      <span className="rounded-full bg-[#f4511e]/15 px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wider text-[#f4511e]">
                        New
                      </span>
                    )}
                    {collapsed && showNew && (
                      <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#f4511e]" />
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
  // null = no admin_perms cookie (pre-override session) — role map decides.
  const [permissions, setPermissions]       = useState<string[] | null>(null);
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
    const perms = getCookie("admin_perms");
    setPermissions(perms ? perms.split(",").filter(Boolean) : null);
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

  // Route guard — redirect to /admin/unauthorized if this user can't access
  // the current section (per-user permission overrides included).
  useEffect(() => {
    if (!role) return;
    const section = Object.entries(PATH_SECTION).find(([path]) =>
      pathname.startsWith(path)
    )?.[1];
    if (section && !canAccessSection(role, section, permissions)) {
      router.replace("/admin/unauthorized");
    }
  }, [pathname, role, permissions, router]);

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

      {/* Mounted once at shell level so Cmd+K works on every admin page —
          which is the point. A palette that only exists on the dashboard is a
          shortcut nobody builds the habit of using. */}
      <CommandPalette role={role} />

      {/* ── Sidebar ── */}
      <aside
        className={[
          "fixed inset-y-0 left-0 z-30 transition-all duration-300 ease-in-out lg:relative lg:z-auto lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          sidebarCollapsed ? "w-[64px]" : "w-64",
        ].join(" ")}
      >
        <Sidebar
          pathname={pathname}
          role={role}
          roleLabel={roleLabel}
          permissions={permissions}
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
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-black/[0.07] bg-white/95 px-4 backdrop-blur lg:px-6">

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
            <WhatsNew />
            <InsightsBell />
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
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f4511e] text-[0.68rem] font-extrabold text-white">
                  {avatarInitials}
                </span>
                <span className="hidden max-w-[120px] truncate text-[0.82rem] font-semibold text-[#1a1a1a] sm:block">
                  {displayName || adminName || "Admin"}
                </span>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-10 z-50 w-52 overflow-hidden rounded-xl border border-black/[0.08] bg-white shadow-lg">
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

        {/* Page content — one canvas for every page, composed on ultra-wide
            monitors instead of sprawling to the bezel (the console rule:
            the work surface gets the pixels, but text lines stay readable). */}
        <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#f6f7f9]">
          <div className="mx-auto w-full max-w-[1600px]">
            {children}
          </div>
        </main>

      </div>

      {/* Live chat notification sound + toast — polls every 20 s */}
      <CrispNotifier onPendingCount={setPendingChats} />

    </div>
  );
}
