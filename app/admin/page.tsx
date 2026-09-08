import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  adminApiFetch,
  AdminUnauthorizedError,
  type AdminProduct,
} from "@/lib/admin-api";
import { canAccessSection } from "@/lib/admin-permissions";
import PageHeader from "@/components/admin/page-header";
import DashboardErrorBoundary from "@/components/admin/dashboard/dashboard-error-boundary";
import YourDesk       from "@/components/admin/dashboard/your-desk";
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

  // The dashboard shows a role what that role can actually open — the same
  // gate the sidebar uses, so a content editor is not greeted by empty
  // finance widgets and permission errors dressed up as cards.
  const cookieStore = await cookies();
  const role  = cookieStore.get("admin_role")?.value ?? "";
  const perms = cookieStore.get("admin_perms")?.value;
  const permissions = perms ? decodeURIComponent(perms).split(",").filter(Boolean) : null;

  const can = (section: string) => !role || canAccessSection(role, section, permissions);

  const showOps       = can("orders");
  const showFinance   = can("finance");
  const showQuotes    = can("quotes");
  const showProducts  = can("products");
  const showChats     = can("chats");
  const showAnalytics = can("analytics");
  const showBehaviour = can("behaviour");
  const showSecurity  = can("security");
  const showSystem    = can("system_health");

  const midColumn    = showBehaviour;
  const rightColumn  = showQuotes || showProducts || showChats;
  const leftColumn   = showFinance || showOps;

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">

      {/* Suspicious activity banner — hidden when no alerts */}
      {showSecurity && (
        <DashboardErrorBoundary label="Suspicious activity banner">
          <SuspiciousBanner />
        </DashboardErrorBoundary>
      )}

      {/* Live status bar — pending orders / open quotes / stock / visitors */}
      {showOps && (
        <DashboardErrorBoundary label="Status bar">
          <StatusBar />
        </DashboardErrorBoundary>
      )}

      <PageHeader
        eyebrow="Overview"
        title="Dashboard"
        sub={new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
      >
        <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[0.72rem] font-semibold text-emerald-700">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          Live · auto-refreshes every 30s
        </div>
      </PageHeader>

      {/* What is on YOUR plate — every role has one of these */}
      <DashboardErrorBoundary label="Your desk">
        <YourDesk />
      </DashboardErrorBoundary>

      {/* Hero metric cards */}
      {showOps && (
        <DashboardErrorBoundary label="Hero metrics">
          <HeroMetrics />
        </DashboardErrorBoundary>
      )}

      {/* Main operational grid — columns render only when the role can use them */}
      <div className="grid gap-5 lg:grid-cols-3">

        {leftColumn && (
          <div className="space-y-5">
            {showFinance && (
              <DashboardErrorBoundary label="Revenue chart">
                <RevenueChart />
              </DashboardErrorBoundary>
            )}
            {showOps && (
              <DashboardErrorBoundary label="Recent orders">
                <RecentOrders />
              </DashboardErrorBoundary>
            )}
          </div>
        )}

        {midColumn && (
          <div className="space-y-5">
            <DashboardErrorBoundary label="Live analytics">
              <LiveAnalytics />
            </DashboardErrorBoundary>
          </div>
        )}

        {rightColumn && (
          <div className="space-y-5">
            {showQuotes && (
              <DashboardErrorBoundary label="Pending quotes">
                <PendingQuotes />
              </DashboardErrorBoundary>
            )}
            {showProducts && (
              <DashboardErrorBoundary label="Low stock">
                <LowStock />
              </DashboardErrorBoundary>
            )}
            {showChats && (
              <DashboardErrorBoundary label="Conversations">
                <CrispPanel />
              </DashboardErrorBoundary>
            )}
          </div>
        )}

      </div>

      {/* Marketing / analytics row */}
      {showAnalytics && (
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
      )}

      {/* Security overview + Sentry */}
      {(showSecurity || showSystem) && (
        <div className="mt-5 grid gap-5 lg:grid-cols-3">
          {showSecurity && (
            <DashboardErrorBoundary label="Security alerts">
              <SecurityAlertCard />
            </DashboardErrorBoundary>
          )}
          {showSystem && (
            <DashboardErrorBoundary label="Sentry">
              <SentryCard />
            </DashboardErrorBoundary>
          )}
        </div>
      )}

    </div>
  );
}
