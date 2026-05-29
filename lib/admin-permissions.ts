// ── Role definitions ───────────────────────────────────────────────────────────

export const ALL_ROLES = [
  "super_admin",
  "admin",
  "order_manager",
  "sales_manager",
  "content_manager",
  "support",
  "editor",
  "viewer",
] as const;

export type AdminRole = (typeof ALL_ROLES)[number];

// ── Section-based access (nav + route guards) ──────────────────────────────────
// Mirrors backend ROLE_ACCESS table.

export const ROLE_ACCESS: Record<string, string[]> = {
  super_admin:     ["dashboard", "products", "orders", "quotes", "articles", "hero_slides", "promotions", "fet", "brands", "categories", "media", "settings", "users", "supplier", "customers", "ebay", "analytics", "chats", "security", "eu_declarations", "logistics", "system_health", "crm"],
  admin:           ["dashboard", "products", "orders", "quotes", "articles", "hero_slides", "promotions", "fet", "brands", "categories", "media", "settings", "users", "supplier", "customers", "ebay", "analytics", "chats", "security", "eu_declarations", "logistics", "system_health", "crm"],
  order_manager:   ["dashboard", "orders", "quotes", "supplier", "eu_declarations", "logistics", "crm"],
  sales_manager:   ["dashboard", "orders", "quotes", "customers", "analytics", "logistics", "crm"],
  content_manager: ["dashboard", "articles", "hero_slides", "promotions", "fet", "brands"],
  support:         ["dashboard", "orders", "quotes", "customers", "chats", "logistics"],
  editor:          ["dashboard", "articles", "hero_slides", "promotions", "fet"],
  viewer:          ["dashboard", "analytics"],
};

export function canAccess(role: string, section: string): boolean {
  return ROLE_ACCESS[role]?.includes(section) ?? false;
}

// ── Path → section mapping (shell route guard + middleware) ────────────────────

export const PATH_SECTION: Record<string, string> = {
  "/admin/products":        "products",
  "/admin/orders":          "orders",
  "/admin/quotes":          "quotes",
  "/admin/articles":        "articles",
  "/admin/hero-slides":     "hero_slides",
  "/admin/promotions":      "promotions",
  "/admin/fet":             "fet",
  "/admin/brands":          "brands",
  "/admin/settings":        "settings",
  "/admin/users":           "users",
  "/admin/supplier":        "supplier",
  "/admin/customers":       "customers",
  "/admin/security":        "security",
  "/admin/ebay":            "ebay",
  "/admin/analytics":       "analytics",
  "/admin/chats":           "chats",
  "/admin/eu-declarations": "eu_declarations",
  "/admin/logistics":       "logistics",
  "/admin/system-health":   "system_health",
  "/admin/crm":             "crm",
};

// ── Permission map ─────────────────────────────────────────────────────────────
// Maps permission key → roles that hold it.
// Use canDo() for fine-grained UI gates (buttons, tables, action menus).
// Use canAccess() for page-level route guards.
// Backend enforces the same permissions server-side via middleware.

const PERMISSION_ROLES: Record<string, string[]> = {
  // Admin management
  "admins.manage":         ["super_admin"],
  "admins.roles.assign":   ["super_admin"],

  // Security dashboard
  "security.view":         ["super_admin", "admin", "order_manager", "sales_manager", "content_manager", "support", "editor", "viewer"],
  "security.manage":       ["super_admin"],   // events log, adoption table, 2FA notices

  // Orders
  "orders.view":                          ["super_admin", "admin", "order_manager", "sales_manager", "support"],
  "orders.update":                        ["super_admin", "admin", "order_manager"],
  "orders.delete":                        ["super_admin"],
  "orders.approve_financial_revision":    ["super_admin", "admin"],

  // Payments
  "payments.mark_paid":        ["super_admin", "admin", "order_manager"],
  "payments.release_shipment": ["super_admin", "admin", "order_manager"],
  "payments.refund":           ["super_admin", "admin"],

  // Products
  "products.view":         ["super_admin", "admin", "editor", "order_manager"],
  "products.edit":         ["super_admin", "admin", "editor"],
  "products.import":       ["super_admin", "admin"],

  // Media
  "media.upload":          ["super_admin", "admin", "editor", "content_manager"],

  // Promotions
  "promotions.manage":     ["super_admin", "admin", "editor", "content_manager"],

  // Articles
  "articles.manage":       ["super_admin", "admin", "editor", "content_manager"],

  // Quotes
  "quotes.manage":         ["super_admin", "admin", "order_manager", "sales_manager"],

  // Customers
  "customers.view":        ["super_admin", "admin", "sales_manager", "support"],
  "customers.export":      ["super_admin", "admin"],

  // Settings
  "settings.view":         ["super_admin", "admin"],
  "settings.manage":       ["super_admin"],

  // Analytics
  "analytics.view":        ["super_admin", "admin", "sales_manager"],

  // Trade documents
  "trade_documents.manage": ["super_admin", "admin", "order_manager"],

  // eBay
  "ebay.manage": ["super_admin", "admin"],

  // System health
  "system.manage":         ["super_admin", "admin"],

  // Users / audit
  "users.manage":          ["super_admin", "admin"],
  "audit.view":            ["super_admin"],
};

/**
 * Check if a role has a specific permission.
 *
 * Pass `permissions` (from backend auth payload) when available — it takes
 * precedence over the built-in role map, enabling fine-grained per-user
 * overrides without a frontend deploy.
 *
 * Without `permissions`, derives access from the PERMISSION_ROLES map above.
 */
export function canDo(
  role: string,
  permission: string,
  permissions?: string[] | null,
): boolean {
  if (permissions != null) return permissions.includes(permission);
  return PERMISSION_ROLES[permission]?.includes(role) ?? false;
}

// ── Display constants — canonical source ───────────────────────────────────────
// Import from here; do not redefine locally in components.

export const ROLE_LABELS: Record<string, string> = {
  super_admin:     "Super Admin",
  admin:           "Admin",
  order_manager:   "Orders",
  sales_manager:   "Sales",
  content_manager: "Content",
  support:         "Support",
  editor:          "Editor",
  viewer:          "Viewer",
};

// Used in the top-bar role badge (admin shell header).
export const ROLE_BADGE_COLORS: Record<string, string> = {
  super_admin:     "bg-gray-900 text-white",
  admin:           "bg-blue-100 text-blue-700",
  order_manager:   "bg-amber-100 text-amber-700",
  sales_manager:   "bg-cyan-100 text-cyan-700",
  content_manager: "bg-violet-100 text-violet-700",
  support:         "bg-teal-100 text-teal-700",
  editor:          "bg-emerald-100 text-emerald-700",
  viewer:          "bg-gray-100 text-gray-600",
};

// Used in card/table role pills (profile page, users manager).
export const ROLE_COLORS: Record<string, string> = {
  super_admin:     "bg-purple-100 text-purple-700",
  admin:           "bg-blue-100 text-blue-700",
  order_manager:   "bg-amber-100 text-amber-700",
  sales_manager:   "bg-cyan-100 text-cyan-700",
  content_manager: "bg-violet-100 text-violet-700",
  support:         "bg-teal-100 text-teal-700",
  editor:          "bg-emerald-100 text-emerald-700",
  viewer:          "bg-gray-100 text-gray-600",
};
