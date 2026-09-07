import {
  LayoutDashboard, Package, FileText, ShoppingCart, ClipboardList, Layers, Star,
  Settings, Users, ContactRound, TrendingUp, ShoppingBag, BarChart2, Megaphone,
  Zap, MessageSquare, ShieldAlert, FileCheck, Truck, Activity, ScanLine,
  BellRing, Bell, Inbox, ClipboardCheck, UserCheck, Mail, Send, Images,
  Handshake, ReceiptText, LayoutGrid, LineChart, Search, BadgeCheck,
  MessagesSquare, Globe2, Scale, LifeBuoy, Calculator,
} from "lucide-react";

/**
 * Every destination in the admin panel, in one place.
 *
 * Extracted from `admin-shell` so the sidebar, the breadcrumb and the command
 * palette all read the same list. Three copies of a nav is three chances for a
 * page to exist and be unreachable from one of them — and this menu has grown
 * past the point where anyone would notice.
 *
 * Adding a page means adding one row here. `keywords` is what someone might
 * type looking for it rather than what it is called: people search for
 * "invoice" when they want Finance Invoices, and for "staff" when they want
 * My Contribution.
 */

export type NavItem = {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  /** null = visible to every role, no permission gate. */
  section: string | null;
  /** Extra search terms for the palette. Never rendered. */
  keywords?: string;
};

export type NavGroup = {
  label: string | null; // null = no header (top-level overview group)
  items: readonly NavItem[];
};

export const NAV_GROUPS: readonly NavGroup[] = [
  {
    label: null,
    items: [
      { label: "Dashboard",     href: "/admin",               icon: LayoutDashboard, section: "dashboard" , keywords: "home overview stats revenue kpi" },
      { label: "My Work",       href: "/admin/my-work",       icon: ClipboardCheck,  section: null , keywords: "assigned tasks queue leads followups" },
      // `section: null` — anyone can use the shared list and tag a teammate;
      // a gate here would defeat the point of it.
      { label: "Team To-Dos",   href: "/admin/todos",         icon: ClipboardList,   section: null , keywords: "todo to-do task list tag team assign checklist" },
      // `section: null` — no role gate, and that is the design rather than an
      // oversight. Every role holds `staff.self` on the API, because nothing may
      // be measured about a person that the person cannot open. Gating this item
      // would lock somebody out of their own record.
      { label: "My Contribution", href: "/admin/contribution", icon: BadgeCheck,    section: null , keywords: "staff performance kpi my record ledger activity work log" },
      { label: "Inbox",         href: "/admin/inbox",         icon: Inbox,           section: "crm" , keywords: "email messages mail replies conversations whatsapp" },
      // `section: null` for the same reason as My Work above: the API puts no
      // permission on internal messaging, because a gate here would mean an
      // account that can log in but cannot be written to. Anyone who can reach
      // the panel can be reached in it.
      { label: "Messages",      href: "/admin/messages",      icon: MessagesSquare,  section: null , keywords: "staff internal colleague team chat dm forward outlook write" },
      { label: "Notifications", href: "/admin/notifications", icon: Bell,            section: null , keywords: "alerts bell" },
    ],
  },
  {
    label: "Commerce",
    items: [
      { label: "Orders",          href: "/admin/orders",          icon: ShoppingCart,  section: "orders" , keywords: "sales purchases ab confirmation" },
      { label: "Fulfilment Queue", href: "/admin/orders/in-transit", icon: Truck,       section: "orders" , keywords: "fulfilment shipping dispatch queue ready to ship" },
      // Under `orders`, not `ebay`: the existing eBay section is admin-only,
      // and these orders are worked by order managers.
      { label: "eBay Orders",     href: "/admin/orders/ebay",     icon: ShoppingBag,   section: "orders" , keywords: "marketplace" },
      { label: "Quote Requests",  href: "/admin/quotes",          icon: ClipboardList, section: "quotes" , keywords: "inquiries leads rfq proposals requests" },
      { label: "Products",        href: "/admin/products",        icon: Package,       section: "products" , keywords: "catalogue tyres stock inventory sku" },
      { label: "Logistics",       href: "/admin/logistics",       icon: Truck,         section: "logistics" , keywords: "shipping freight container tracking carrier" },
      { label: "EU Declarations", href: "/admin/eu-declarations", icon: FileCheck,     section: "eu_declarations" , keywords: "gelangensbestatigung entry certificate vat" },
    ],
  },
  {
    label: "Customers & CRM",
    items: [
      { label: "Customers",          href: "/admin/customers",              icon: ContactRound,  section: "customers" , keywords: "clients buyers accounts companies" },
      { label: "Customer Approvals", href: "/admin/customer-approvals",     icon: UserCheck,     section: "customers" , keywords: "onboarding pending review buyers" },
      { label: "Follow-ups",         href: "/admin/crm/follow-ups",         icon: BellRing,      section: "crm" , keywords: "reminders due tasks" },
      { label: "Data Quality",       href: "/admin/customers/data-quality", icon: ScanLine,      section: "customers" , keywords: "duplicates merge cleanup" },
      { label: "Live Chats",         href: "/admin/chats",                  icon: MessageSquare, section: "chats" , keywords: "live chat crisp support messages" },
      { label: "Claims",             href: "/admin/claims",                 icon: LifeBuoy,      section: "claims" , keywords: "after sales complaint damage warranty shortage credit note queue" },
    ],
  },
  {
    label: "Content",
    items: [
      { label: "Articles",    href: "/admin/articles",    icon: FileText,  section: "articles" , keywords: "blog news posts content writing" },
      { label: "Hero Slides", href: "/admin/hero-slides", icon: Layers,    section: "hero_slides" , keywords: "homepage carousel banner" },
      { label: "Promotions",  href: "/admin/promotions",  icon: Megaphone, section: "promotions" , keywords: "discounts promo codes offers" },
      { label: "FET Engines", href: "/admin/fet",         icon: Zap,       section: "fet" , keywords: "engine treatment fuel" },
      { label: "Brands",      href: "/admin/brands",      icon: Star,      section: "brands" , keywords: "manufacturers logos" },
      { label: "Media Library", href: "/admin/media",       icon: Images,    section: "media" , keywords: "images files uploads gallery" },
    ],
  },
  {
    label: "Marketing",
    items: [
      { label: "Contacts",   href: "/admin/marketing/contacts",  icon: Mail, section: "marketing" , keywords: "mailing list audience import markets wix" },
      { label: "Campaigns",  href: "/admin/marketing/campaigns", icon: Send, section: "marketing" , keywords: "bulk email newsletter send builder templates" },
      { label: "Campaign Scores", href: "/admin/campaign-scores", icon: BadgeCheck, section: "marketing" , keywords: "open rate completion clicks tracker feedback score marketer" },
    ],
  },
  {
    label: "Partner Sales",
    items: [
      { label: "Partners",      href: "/admin/partners",      icon: Handshake,  section: "partners" , keywords: "organisations resellers" },
      { label: "Reported Sales", href: "/admin/partner-sales", icon: ReceiptText, section: "partners" , keywords: "reported sales verify partner" },
    ],
  },
  {
    label: "Sales Channels",
    items: [
      { label: "eBay", href: "/admin/ebay", icon: ShoppingBag, section: "ebay" , keywords: "listings marketplace sync" },
      { label: "eBay Price Audit", href: "/admin/ebay-audit", icon: TrendingUp, section: "ebay" , keywords: "margin loss fees cost pricing market insight audit" },
      { label: "Tyre Pricing", href: "/admin/pricing", icon: Calculator, section: "ebay" , keywords: "tier margin tyre100 supplier premium midrange budget stripe formula reprice" },
    ],
  },
  {
    label: "Insights",
    items: [
      { label: "Operations",    href: "/admin/operations", icon: LayoutGrid, section: "operations" , keywords: "board summary clients figures" },
      // Gated, unlike My Contribution above. The API refuses this to anyone
      // without staff.view_team, and a menu item that 403s on click is worse
      // than one that is not offered.
      { label: "Team Contribution", href: "/admin/contribution/team", icon: Users, section: "staff_team", keywords: "staff performance team report kpi who did what" },
      { label: "Transaction Report", href: "/admin/operations/report", icon: LineChart, section: "operations" , keywords: "transactions month revenue chart export" },
      { label: "Finance Invoices", href: "/admin/finance-invoices", icon: ReceiptText, section: "finance" , keywords: "sevdesk reconciliation invoice register vat" },
      // `finance_snapshot`, not `finance`: this one page is closed to `admin`
      // and the order manager, who keep every other item in this group.
      { label: "Finance Snapshot", href: "/admin/finance-snapshot", icon: LineChart, section: "finance_snapshot" , keywords: "liquidity cash position proposals receipts pipeline board weekly weeks bank balance" },
      { label: "Profitability", href: "/admin/profitability", icon: Scale, section: "finance" , keywords: "profit margin revenue invoice supplier costs fees stripe ebay verified sign off export per order" },
      { label: "EC Invoice List", href: "/admin/ec-invoices", icon: FileCheck, section: "finance" , keywords: "zm zusammenfassende meldung elster bzst eu vat intra-community sales list delivery proof cmr audit xml" },
      { label: "Sales & Orders Board", href: "/admin/sales-orders", icon: ClipboardList, section: "finance" , keywords: "sales order management dashboard gp gross profit margin b2b b2c tyres sold avg price customer supplier proof" },
      { label: "Analytics",     href: "/admin/analytics", icon: BarChart2,  section: "analytics" , keywords: "reports stats funnel" },
      { label: "Promotion Insight", href: "/admin/analytics/product-mix", icon: Package, section: "analytics" , keywords: "used new tyres bundles sizes repeat buyers countries promote" },
      // Its own section, not "analytics": the roles the backend grants this
      // report to are not the ones our analytics section lists, and the two
      // pages read different data sources.
      { label: "Customer Behaviour", href: "/admin/analytics/behaviour", icon: Search, section: "behaviour" , keywords: "search demand what customers look for" },
      // Same section as Customer Behaviour, different reader: that page asks
      // "what should we fix", this one asks "where should we sell".
      { label: "Market Intelligence", href: "/admin/analytics/markets", icon: Globe2, section: "behaviour" , keywords: "market country penetrate expansion opportunity where to sell demand by country export database" },
      { label: "Supplier Intel", href: "/admin/supplier", icon: TrendingUp, section: "supplier" , keywords: "intel sourcing suppliers" },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Security",      href: "/admin/security",      icon: ShieldAlert, section: "security" , keywords: "2fa audit events login" },
      { label: "System Health", href: "/admin/system-health", icon: Activity,    section: "system_health" , keywords: "status errors uptime diagnostics" },
      { label: "Users",         href: "/admin/users",         icon: Users,       section: "users" , keywords: "admins staff accounts roles permissions job titles" },
      { label: "Settings",      href: "/admin/settings",      icon: Settings,    section: "settings" , keywords: "configuration site options" },
    ],
  },
];

// Flat list of every nav item — used by the breadcrumb resolver.
export const ALL_NAV_ITEMS: readonly NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

// ── Breadcrumb ────────────────────────────────────────────────────────────────

export function getAdminBreadcrumb(pathname: string): { parent: { label: string; href: string } | null; current: string } {
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
