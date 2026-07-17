import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const BASE = `${process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"}/admin`;

async function apiFetch(path: string, token: string, params?: Record<string, string>) {
  try {
    const url = new URL(`${BASE}${path}`);
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json().catch(() => null);
  } catch {
    return null;
  }
}

function dateStr(d: Date): string { return d.toISOString().slice(0, 10); }
function toDate(iso: string): string { return (iso ?? "").slice(0, 10); }

// An order's revenue counts as "confirmed" when payment is settled.
// Status-based: confirmed, shipped, delivered, completed
// Payment-based: payment_status === "paid" (overrides status check)
const CONFIRMED_STATUSES = new Set(["confirmed", "shipped", "delivered", "completed"]);
const PENDING_STATUSES   = new Set(["pending", "processing"]);

type RawOrder = {
  id: number;
  order_ref: string;
  customer_name: string;
  customer_email: string;
  total: number | string;
  status: string;
  payment_status?: string;
  created_at: string;
};

function isConfirmed(o: RawOrder): boolean {
  return CONFIRMED_STATUSES.has(o.status) || o.payment_status === "paid";
}

function isPending(o: RawOrder): boolean {
  return PENDING_STATUSES.has(o.status) && o.payment_status !== "paid";
}

function sum(arr: RawOrder[]): number {
  return arr.reduce((s, o) => s + (Number(o.total) || 0), 0);
}

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now       = new Date();
  const today     = dateStr(now);
  const yd        = new Date(now); yd.setDate(yd.getDate() - 1);
  const yesterday = dateStr(yd);

  const [dashboardRes, ordersRes, quotesRes, productsRes] = await Promise.all([
    apiFetch("/dashboard",      token),
    apiFetch("/orders",         token, { per_page: "500", sort: "latest" }),
    apiFetch("/quote-requests", token, { per_page: "200", sort: "latest" }),
    apiFetch("/products",       token, { per_page: "300", is_active: "1" }),
  ]);

  // ── Laravel dashboard endpoint (primary source for 6 KPI fields) ──────────
  // Response may be wrapped in .data or flat depending on backend version.
  const db = (dashboardRes?.data ?? dashboardRes ?? {}) as Record<string, unknown>;
  const apiRevenueToday         = db.revenue_today           != null ? Number(db.revenue_today)           : null;
  const apiOrdersTodayPaid      = db.orders_today_paid        != null ? Number(db.orders_today_paid)        : null;
  const apiNewCustomers         = db.new_customers_today      != null ? Number(db.new_customers_today)      : null;
  const apiConversionRate       = db.conversion_rate          != null ? Number(db.conversion_rate)          : null;
  const apiAOV                  = db.average_order_value      != null ? Number(db.average_order_value)      : null;
  const apiAovPeriodLabel       = db.aov_period_label         != null ? String(db.aov_period_label)         : null;
  const apiAovPaidOrdersCount   = db.aov_paid_orders_count    != null ? Number(db.aov_paid_orders_count)    : null;
  const apiAovStripeOrdersCount = db.aov_stripe_orders_count  != null ? Number(db.aov_stripe_orders_count)  : null;
  const apiAovManualOrdersCount = db.aov_manual_orders_count  != null ? Number(db.aov_manual_orders_count)  : null;
  const apiChartRaw             = Array.isArray(db.revenue_last_7_days) ? db.revenue_last_7_days as Record<string, unknown>[] : null;

  // ── Orders ────────────────────────────────────────────────────────────────
  const orders: RawOrder[] = Array.isArray(ordersRes?.data) ? ordersRes.data : [];

  const todayOrders     = orders.filter(o => toDate(o.created_at) === today);
  const yesterdayOrders = orders.filter(o => toDate(o.created_at) === yesterday);

  // Confirmed-only revenue (real earned money)
  const confirmedToday     = todayOrders.filter(isConfirmed);
  const confirmedYesterday = yesterdayOrders.filter(isConfirmed);
  const pendingToday       = todayOrders.filter(isPending);
  const pendingYesterday   = yesterdayOrders.filter(isPending);

  const confirmedRevenueToday     = sum(confirmedToday);
  const confirmedRevenueYesterday = sum(confirmedYesterday);
  const pendingRevenueToday       = sum(pendingToday);
  const pendingRevenueYesterday   = sum(pendingYesterday);

  const ordersConfirmedToday   = confirmedToday.length;
  const ordersPendingToday     = pendingToday.length;
  const ordersToday            = todayOrders.length;
  const ordersYesterday        = yesterdayOrders.length;

  // AOV from confirmed orders only
  const avgOrderValueToday     = ordersConfirmedToday > 0
    ? confirmedRevenueToday / ordersConfirmedToday : 0;
  const avgOrderValueYesterday = confirmedYesterday.length > 0
    ? confirmedRevenueYesterday / confirmedYesterday.length : 0;

  const pendingOrdersCount = orders.filter(isPending).length;

  // Revenue chart — prefer API data, fall back to computed from orders
  const revenueChart = apiChartRaw
    ? apiChartRaw.map((point) => {
        const rawDate = String(point.date ?? "");
        // Parse ISO date (YYYY-MM-DD) without timezone shift
        let label = rawDate;
        if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
          const [y, mo, d] = rawDate.split("-").map(Number);
          label = new Date(y, mo - 1, d).toLocaleDateString("en-GB", { month: "short", day: "numeric" });
        }
        return {
          date:      label,
          confirmed: Math.round(Number(point.revenue ?? point.confirmed ?? point.amount ?? 0) * 100) / 100,
          pending:   Math.round(Number(point.pending ?? 0) * 100) / 100,
        };
      })
    : Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now);
        d.setDate(d.getDate() - (6 - i));
        const ds = dateStr(d);
        const dayOrders = orders.filter(o => toDate(o.created_at) === ds);
        return {
          date:      d.toLocaleDateString("en-GB", { month: "short", day: "numeric" }),
          confirmed: Math.round(sum(dayOrders.filter(isConfirmed)) * 100) / 100,
          pending:   Math.round(sum(dayOrders.filter(isPending))   * 100) / 100,
        };
      });

  // Orders-count + AOV 7-day series — always computed from the same `orders`
  // array (independent of whether the backend supplied its own revenue chart),
  // feeding the hero-metric sparklines.
  const ordersChart: { date: string; count: number }[] = [];
  const aovChart: { date: string; value: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    const ds = dateStr(d);
    const label = d.toLocaleDateString("en-GB", { month: "short", day: "numeric" });
    const dayOrders = orders.filter(o => toDate(o.created_at) === ds);
    const dayConfirmed = dayOrders.filter(isConfirmed);
    ordersChart.push({ date: label, count: dayOrders.length });
    aovChart.push({
      date: label,
      value: dayConfirmed.length > 0 ? Math.round((sum(dayConfirmed) / dayConfirmed.length) * 100) / 100 : 0,
    });
  }

  // Recent orders — last 8, include payment_status for confirm action
  const recentOrders = orders.slice(0, 8).map(o => ({
    id:             o.id,
    ref:            o.order_ref,
    customer:       o.customer_name,
    email:          o.customer_email,
    total:          Number(o.total) || 0,
    status:         o.status,
    payment_status: o.payment_status ?? null,
    created_at:     o.created_at,
  }));

  // ── Quotes ────────────────────────────────────────────────────────────────
  type RawQuote = {
    id: number; ref_number: string; full_name: string; company_name?: string;
    tyre_category: string; country: string; status: string; created_at: string;
  };
  const quotes: RawQuote[] = Array.isArray(quotesRes?.data) ? quotesRes.data : [];
  const openQuotes = quotes.filter(q => q.status === "new" || q.status === "reviewed").length;
  const pendingQuotesList = quotes
    .filter(q => q.status === "new" || q.status === "reviewed")
    .slice(0, 5)
    .map(q => ({
      id: q.id, ref: q.ref_number, name: q.full_name,
      company: q.company_name ?? null, tyre_category: q.tyre_category,
      country: q.country, created_at: q.created_at,
    }));

  // ── Products (low stock) ──────────────────────────────────────────────────
  type RawProduct = { id: number; name: string; brand: string; sku: string; inventory?: number | null };
  const products: RawProduct[] = Array.isArray(productsRes?.data) ? productsRes.data : [];
  const lowStock      = products.filter(p => p.inventory != null && p.inventory < 10);
  const lowStockCount = lowStock.length;
  const lowStockList  = lowStock.slice(0, 10).map(p => ({
    id: p.id, name: p.name, brand: p.brand, sku: p.sku, stock: p.inventory ?? 0,
  }));

  return NextResponse.json({
    // Primary KPIs — Laravel dashboard endpoint takes precedence, computed values as fallback
    revenueToday:     apiRevenueToday    ?? confirmedRevenueToday,
    revenueYesterday: confirmedRevenueYesterday,
    pendingRevenueToday,
    pendingRevenueYesterday,
    ordersToday:      apiOrdersTodayPaid ?? ordersToday,
    ordersYesterday,
    ordersConfirmedToday,
    ordersPendingToday,
    avgOrderValueToday:     apiAOV       ?? avgOrderValueToday,
    avgOrderValueYesterday,
    newCustomersToday:    apiNewCustomers ?? 0,
    newCustomersYesterday: 0,
    conversionRate:   apiConversionRate  ?? 0,
    aovPeriodLabel:       apiAovPeriodLabel       ?? null,
    aovPaidOrdersCount:   apiAovPaidOrdersCount   ?? null,
    aovStripeOrdersCount: apiAovStripeOrdersCount ?? null,
    aovManualOrdersCount: apiAovManualOrdersCount ?? null,
    // Operational feeds (always computed from orders/quotes/products)
    pendingOrders: pendingOrdersCount,
    openQuotes,
    lowStockCount,
    revenueChart,
    ordersChart,
    aovChart,
    recentOrders,
    pendingQuotesList,
    lowStockList,
  });
}
