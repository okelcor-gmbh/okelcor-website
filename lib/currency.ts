/** Order-level currencies the admin can pick from. Defaults to EUR everywhere. */
export const ORDER_CURRENCIES = ["EUR", "USD"] as const;
export type OrderCurrency = (typeof ORDER_CURRENCIES)[number];

export function formatMoney(amount?: number | string | null, currency?: string | null): string {
  if (amount == null) return "—";
  const n = Number(amount);
  if (Number.isNaN(n)) return "—";
  try {
    return new Intl.NumberFormat("en-DE", {
      style: "currency",
      currency: currency || "EUR",
      minimumFractionDigits: 2,
    }).format(n);
  } catch {
    return `${currency ?? "EUR"} ${n.toFixed(2)}`;
  }
}
