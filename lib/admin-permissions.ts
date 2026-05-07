// Canonical permissions map — mirrors the backend's ROLE_ACCESS table.
export const ROLE_ACCESS: Record<string, string[]> = {
  super_admin:   ["dashboard", "products", "orders", "quotes", "articles", "hero_slides", "promotions", "fet", "brands", "categories", "media", "settings", "users", "supplier", "customers", "ebay", "analytics", "chats", "security", "eu_declarations"],
  admin:         ["dashboard", "products", "orders", "quotes", "articles", "hero_slides", "promotions", "fet", "brands", "categories", "media", "settings", "users", "supplier", "customers", "ebay", "analytics", "chats", "security", "eu_declarations"],
  editor:        ["dashboard", "articles", "hero_slides", "promotions", "fet"],
  order_manager: ["dashboard", "orders", "quotes", "supplier", "eu_declarations"],
};

export function canAccess(role: string, section: string): boolean {
  return ROLE_ACCESS[role]?.includes(section) ?? false;
}

// Maps pathname prefix → section key for route-guard checks.
export const PATH_SECTION: Record<string, string> = {
  "/admin/products":    "products",
  "/admin/orders":      "orders",
  "/admin/quotes":      "quotes",
  "/admin/articles":    "articles",
  "/admin/hero-slides":  "hero_slides",
  "/admin/promotions":  "promotions",
  "/admin/fet":         "fet",
  "/admin/brands":      "brands",
  "/admin/settings":    "settings",
  "/admin/users":       "users",
  "/admin/supplier":    "supplier",
  "/admin/customers":   "customers",
  "/admin/security":    "security",
  "/admin/ebay":        "ebay",
  "/admin/analytics":   "analytics",
  "/admin/chats":           "chats",
  "/admin/eu-declarations": "eu_declarations",
};
