import { redirect } from "next/navigation";
import {
  adminApiFetch,
  AdminUnauthorizedError,
  type AdminProduct,
} from "@/lib/admin-api";
import DashboardErrorBoundary from "@/components/admin/dashboard/dashboard-error-boundary";
import StatusBar      from "@/components/admin/dashboard/status-bar";
import HeroMetrics    from "@/components/admin/dashboard/hero-metrics";
import RevenueChart   from "@/components/admin/dashboard/revenue-chart";
import RecentOrders   from "@/components/admin/dashboard/recent-orders";
import LiveAnalytics  from "@/components/admin/dashboard/live-analytics";
import PendingQuotes  from "@/components/admin/dashboard/pending-quotes";
import LowStock       from "@/components/admin/dashboard/low-stock";
import CrispPanel     from "@/components/admin/dashboard/crisp-panel";
import GoogleAdsCard  from "@/components/admin/dashboard/google-ads-card";
import FunnelCard     from "@/components/admin/dashboard/funnel-card";
import TopProducts       from "@/components/admin/dashboard/top-products";
import SuspiciousBanner  from "@/components/admin/dashboard/suspicious-banner";
import SecurityAlertCard from "@/components/admin/dashboard/security-alert-card";
import SentryCard        from "@/components/admin/dashboard/sentry-card";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard" };

export default async function AdminDashboard() {
  try {
    await adminApiFetch<AdminProduct[]>("/products", { params: { per_page: 1 }, revalidate: false });
  } catch (e) {
    if (e instanceof AdminUnauthorizedError) redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] p-4 md:p-6 lg:p-8">

      {/* Suspicious activity banner — hidden when no alerts */}
      <DashboardErrorBoundary label="Suspicious activity banner">
        <SuspiciousBanner />
      </DashboardErrorBoundary>

      {/* Live status bar */}
      <DashboardErrorBoundary label="Status bar">
        <StatusBar />
      </DashboardErrorBoundary>

      {/* Page heading */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[#E85C1A]">Overview</p>
          <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-[#1a1a1a]">Dashboard</h1>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[0.72rem] font-semibold text-emerald-700">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          Live · auto-refreshes every 30s
        </div>
      </div>

      {/* Hero metric cards */}
      <DashboardErrorBoundary label="Hero metrics">
        <HeroMetrics />
      </DashboardErrorBoundary>

      {/* Main 3-column operational grid */}
      <div className="grid gap-5 lg:grid-cols-3">

        {/* ── Left column ─────────────────────────────────── */}
        <div className="space-y-5">
          <DashboardErrorBoundary label="Revenue chart">
            <RevenueChart />
          </DashboardErrorBoundary>
          <DashboardErrorBoundary label="Recent orders">
            <RecentOrders />
          </DashboardErrorBoundary>
        </div>

        {/* ── Middle column ───────────────────────────────── */}
        <div className="space-y-5">
          <DashboardErrorBoundary label="Live analytics">
            <LiveAnalytics />
          </DashboardErrorBoundary>
        </div>

        {/* ── Right column ────────────────────────────────── */}
        <div className="space-y-5">
          <DashboardErrorBoundary label="Pending quotes">
            <PendingQuotes />
          </DashboardErrorBoundary>
          <DashboardErrorBoundary label="Low stock">
            <LowStock />
          </DashboardErrorBoundary>
          <DashboardErrorBoundary label="Conversations">
            <CrispPanel />
          </DashboardErrorBoundary>
        </div>

      </div>

      {/* Bottom row */}
      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <DashboardErrorBoundary label="Google Ads">
          <GoogleAdsCard />
        </DashboardErrorBoundary>
        <DashboardErrorBoundary label="Funnel">
          <FunnelCard />
        </DashboardErrorBoundary>
        <DashboardErrorBoundary label="Top products">
          <TopProducts />
        </DashboardErrorBoundary>
      </div>

      {/* Security overview + Sentry */}
      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <DashboardErrorBoundary label="Security alerts">
          <SecurityAlertCard />
        </DashboardErrorBoundary>
        <DashboardErrorBoundary label="Sentry">
          <SentryCard />
        </DashboardErrorBoundary>
      </div>

    </div>
  );
}
