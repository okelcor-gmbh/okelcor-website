import { redirect } from "next/navigation";
import { unstable_cache } from "next/cache";
import {
  Users, MousePointerClick, Eye, Clock, TrendingUp,
  Globe, BarChart2, ExternalLink, AlertCircle,
  ShoppingCart, CheckCircle2, Tag, Archive, Zap,
} from "lucide-react";
import { adminApiFetch, AdminUnauthorizedError } from "@/lib/admin-api";
import PostHogPanel from "@/components/admin/posthog-panel";
import {
  fetchGaOverview,
  fetchGaDailyTrend,
  fetchGaTopPages,
  fetchGaTrafficSources,
  fetchGaCountries,
  type GaOverview,
  type GaDayPoint,
  type GaTopPage,
  type GaTrafficSource,
  type GaCountry,
} from "@/lib/google-analytics";

type GaResult = [GaOverview | null, GaDayPoint[], GaTopPage[], GaTrafficSource[], GaCountry[]];

export const dynamic = "force-dynamic";
export const metadata = { title: "Analytics" };

// ── Cached GA fetchers ────────────────────────────────────────────────────────
// Current-site data: revalidate every hour (data changes frequently)
const fetchCurrentGaData = unstable_cache(
  async (startDate: string, endDate: string): Promise<GaResult> => {
    try {
      return await Promise.all([
        fetchGaOverview(startDate, endDate),
        fetchGaDailyTrend(startDate, endDate),
        fetchGaTopPages(startDate, endDate, 10),
        fetchGaTrafficSources(startDate, endDate, 8),
        fetchGaCountries(startDate, endDate, 8),
      ]);
    } catch (e) {
      console.error("[analytics] current GA fetch failed:", e instanceof Error ? e.message : String(e));
      return [null, [], [], [], []];
    }
  },
  ["admin-analytics-current"],
  { revalidate: 3600 },
);

// Historical/previous-site data: revalidate once per day (archive — never changes)
const fetchPreviousGaData = unstable_cache(
  async (startDate: string, endDate: string): Promise<GaResult> => {
    try {
      return await Promise.all([
        fetchGaOverview(startDate, endDate),
        fetchGaDailyTrend(startDate, endDate),
        fetchGaTopPages(startDate, endDate, 8),
        fetchGaTrafficSources(startDate, endDate, 6),
        fetchGaCountries(startDate, endDate, 6),
      ]);
    } catch (e) {
      console.error("[analytics] previous GA fetch failed:", e instanceof Error ? e.message : String(e));
      return [null, [], [], [], []];
    }
  },
  ["admin-analytics-previous"],
  { revalidate: 86400 },
);

// ── Date constants ─────────────────────────────────────────────────────────────

const LAUNCH_DATE  = "2026-04-22";   // first day of okelcor.com
const CUTOFF_DATE  = "2026-04-21";   // last day of okelcor.de
const HISTORY_START = "2020-01-01";  // how far back to pull archive data

/** Compute current-site date range: from max(today-28, LAUNCH_DATE) to today */
function currentRange(): { startDate: string; endDate: string } {
  const today  = new Date();
  const d28ago = new Date(today);
  d28ago.setDate(d28ago.getDate() - 28);

  const todayStr  = today.toISOString().slice(0, 10);
  const d28Str    = d28ago.toISOString().slice(0, 10);
  const startDate = d28Str >= LAUNCH_DATE ? d28Str : LAUNCH_DATE;

  return { startDate, endDate: todayStr };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function fmtDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" })
    .format(new Date(iso));
}

// ── Shared sub-components ──────────────────────────────────────────────────────

function StatCard({
  label, value, icon: Icon, accent, sub,
}: {
  label: string; value: string; icon: React.ElementType; accent: string; sub?: string;
}) {
  return (
    <div className="flex items-center gap-5 rounded-2xl bg-white p-6 shadow-sm">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${accent}`}>
        <Icon size={20} strokeWidth={1.8} className="text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-[0.72rem] font-bold uppercase tracking-[0.14em] text-[#5c5e62]">{label}</p>
        <p className="mt-0.5 text-2xl font-extrabold text-[#1a1a1a]">{value}</p>
        {sub && <p className="mt-0.5 text-[0.72rem] text-[#5c5e62]">{sub}</p>}
      </div>
    </div>
  );
}

function ArchiveStatCard({
  label, value, icon: Icon, sub,
}: {
  label: string; value: string; icon: React.ElementType; sub?: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-black/[0.07] bg-white/70 p-5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e8eaed]">
        <Icon size={17} strokeWidth={1.8} className="text-[#5c5e62]" />
      </div>
      <div className="min-w-0">
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-[#8c8f94]">{label}</p>
        <p className="mt-0.5 text-xl font-extrabold text-[#3a3d42]">{value}</p>
        {sub && <p className="mt-0.5 text-[0.7rem] text-[#8c8f94]">{sub}</p>}
      </div>
    </div>
  );
}

function SectionCard({ title, icon: Icon, children, muted = false }: {
  title: string; icon: React.ElementType; children: React.ReactNode; muted?: boolean;
}) {
  return (
    <div className={`overflow-hidden rounded-2xl shadow-sm ${muted ? "border border-black/[0.06] bg-white/70" : "bg-white"}`}>
      <div className="flex items-center gap-2.5 border-b border-black/[0.06] px-5 py-4">
        <Icon size={15} className={muted ? "text-[#8c8f94]" : "text-[#5c5e62]"} />
        <p className={`text-[0.9rem] font-extrabold ${muted ? "text-[#5c5e62]" : "text-[#1a1a1a]"}`}>{title}</p>
      </div>
      {children}
    </div>
  );
}

function MiniBarRow({ label, value, max, color = "bg-[#f4511e]" }: {
  label: string; value: number; max: number; color?: string;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="px-5 py-3">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="max-w-[70%] truncate text-[0.82rem] text-[#1a1a1a]">{label}</span>
        <span className="text-[0.8rem] font-semibold text-[#5c5e62]">{fmtNum(value)}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#f0f2f5]">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Sparkline({ data, field, color = "#f4511e" }: {
  data: { date: string; sessions: number; pageViews: number }[];
  field: "sessions" | "pageViews";
  color?: string;
}) {
  if (data.length < 2) return null;

  const values = data.map((d) => d[field]);
  const max    = Math.max(...values, 1);
  const W = 600; const H = 80;
  const pts  = values.map((v, i) => `${(i / (values.length - 1)) * W},${H - (v / max) * H}`);
  const poly = pts.join(" ");
  const area = `0,${H} ${poly} ${W},${H}`;
  const gradId = `grad-${color.replace("#", "")}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-20 w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${gradId})`} />
      <polyline points={poly} fill="none" stroke={color} strokeWidth="2"
        strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// ── Not configured banner ─────────────────────────────────────────────────────

function NotConfigured() {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-8 text-center">
      <AlertCircle size={32} className="mx-auto mb-3 text-amber-500" />
      <p className="text-[0.95rem] font-extrabold text-[#1a1a1a]">Google Analytics not configured</p>
      <p className="mt-2 text-[0.83rem] leading-6 text-[#5c5e62]">
        Add these environment variables to enable analytics data in the admin panel:
      </p>
      <div className="mx-auto mt-4 max-w-md rounded-xl bg-white px-5 py-4 text-left font-mono text-[0.78rem] text-[#1a1a1a] shadow-sm">
        <p className="text-green-600">GA_PROPERTY_ID=123456789</p>
        <p className="text-green-600">GOOGLE_SA_CLIENT_EMAIL=…</p>
        <p className="text-green-600">GOOGLE_SA_PRIVATE_KEY=&quot;-----BEGIN PRIVATE KEY…&quot;</p>
      </div>
    </div>
  );
}

// ── Google Ads panel ──────────────────────────────────────────────────────────

const ADS_CONVERSIONS = [
  { name: "Purchase",      icon: ShoppingCart, color: "bg-emerald-500" },
  { name: "Add to cart",   icon: ShoppingCart, color: "bg-blue-500" },
  { name: "Shopping Cart", icon: ShoppingCart, color: "bg-violet-500" },
  { name: "Checkout",      icon: CheckCircle2, color: "bg-amber-500" },
];

function GoogleAdsPanel() {
  const adsId      = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
  const tagId      = process.env.NEXT_PUBLIC_GOOGLE_TAG_ID;
  const customerId = process.env.NEXT_PUBLIC_GOOGLE_ADS_CUSTOMER_ID ?? "597-727-6742";
  const configured = !!adsId;

  return (
    <div className="mb-8 overflow-hidden rounded-2xl bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-4">
        <div className="flex items-center gap-2.5">
          <Tag size={15} className="text-[#5c5e62]" />
          <p className="text-[0.9rem] font-extrabold text-[#1a1a1a]">Google Ads</p>
        </div>
        <a
          href={`https://ads.google.com/aw/overview?__e=${customerId.replace(/-/g, "")}`}
          target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-xl border border-black/[0.09] bg-white px-3.5 py-2 text-[0.8rem] font-semibold text-[#1a1a1a] transition hover:bg-[#f0f2f5]"
        >
          <ExternalLink size={13} strokeWidth={2} />
          Open Google Ads
        </a>
      </div>
      <div className="p-5">
        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          {[
            { label: "Customer ID",    value: customerId },
            { label: "Conversion ID",  value: adsId ?? "—" },
            { label: "Google Tag ID",  value: tagId ?? "—" },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl bg-[#fafafa] px-4 py-3">
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.14em] text-[#5c5e62]">{label}</p>
              <p className="mt-1 font-mono text-[0.9rem] font-semibold text-[#1a1a1a]">{value}</p>
            </div>
          ))}
        </div>

        {configured ? (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" />
            <div>
              <p className="text-[0.83rem] font-semibold text-emerald-800">Tag active on okelcor.com</p>
              <p className="mt-0.5 text-[0.78rem] text-emerald-700">
                The Google Ads tag is installed and firing. The &quot;URGENT — Tag stopped sending data&quot;
                warning in Google Ads will clear automatically within 48 hours of the tag firing on the new domain.
              </p>
            </div>
          </div>
        ) : (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber-600" />
            <div>
              <p className="text-[0.83rem] font-semibold text-amber-800">Tag not configured</p>
              <p className="mt-0.5 text-[0.78rem] text-amber-700">
                Add <code className="rounded bg-amber-100 px-1">NEXT_PUBLIC_GOOGLE_ADS_ID=AW-10996107897</code> to Vercel env vars.
              </p>
            </div>
          </div>
        )}

        <p className="mb-3 text-[0.72rem] font-bold uppercase tracking-[0.14em] text-[#5c5e62]">
          Active Conversions — imported via GA4
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ADS_CONVERSIONS.map(({ name, icon: Icon, color }) => (
            <div key={name} className="flex items-center gap-3 rounded-xl border border-black/[0.06] px-4 py-3">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${color}`}>
                <Icon size={14} strokeWidth={2} className="text-white" />
              </div>
              <div>
                <p className="text-[0.83rem] font-semibold text-[#1a1a1a]">{name}</p>
                <p className="text-[0.72rem] text-emerald-600">Tracking</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── GA section wrapper ─────────────────────────────────────────────────────────

function SectionBadge({ live }: { live: boolean }) {
  return live ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[0.68rem] font-bold uppercase tracking-[0.1em] text-emerald-700">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      Live
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e8eaed] px-2.5 py-0.5 text-[0.68rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">
      <Archive size={10} />
      Archived
    </span>
  );
}

const SOURCE_COLORS: Record<string, string> = {
  "Organic Search": "bg-green-500",
  "Direct":         "bg-blue-500",
  "Referral":       "bg-purple-500",
  "Organic Social": "bg-pink-500",
  "Paid Search":    "bg-amber-500",
  "Email":          "bg-cyan-500",
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AnalyticsPage() {
  try {
    await adminApiFetch("/products", { params: { per_page: 1 }, revalidate: false });
  } catch (e) {
    if (e instanceof AdminUnauthorizedError) redirect("/admin/login");
  }

  const isConfigured = !!(
    process.env.GA_PROPERTY_ID &&
    process.env.GOOGLE_SA_CLIENT_EMAIL &&
    process.env.GOOGLE_SA_PRIVATE_KEY
  );

  if (!isConfigured) {
    return (
      <div className="p-6 md:p-8">
        <div className="mb-7">
          <p className="text-[0.75rem] font-bold uppercase tracking-[0.18em] text-[#f4511e]">Analytics</p>
          <p className="mt-1 text-[0.875rem] text-[#5c5e62]">Google Analytics 4</p>
        </div>
        <NotConfigured />
      </div>
    );
  }

  // ── Date ranges ──────────────────────────────────────────────────────────────
  const prevStart  = HISTORY_START;
  const prevEnd    = CUTOFF_DATE;
  const curr       = currentRange();

  // ── Parallel data fetch — both ranges at once (results served from cache) ────
  const [currResults, prevResults] = await Promise.all([
    fetchCurrentGaData(curr.startDate, curr.endDate),
    fetchPreviousGaData(prevStart, prevEnd),
  ]);

  const [currOverview, currTrend, currPages, currSources, currCountries] = currResults;
  const [prevOverview, prevTrend, prevPages, prevSources, prevCountries] = prevResults;

  return (
    <div className="p-6 md:p-8">

      {/* Page header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <p className="text-[0.75rem] font-bold uppercase tracking-[0.18em] text-[#f4511e]">Analytics</p>
          <p className="mt-1 text-[0.875rem] text-[#5c5e62]">
            Google Analytics 4 &mdash; split by domain
          </p>
        </div>
        <a
          href={`https://analytics.google.com/analytics/web/#/p${process.env.GA_PROPERTY_ID}/reports/intelligenthome`}
          target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-xl border border-black/[0.09] bg-white px-3.5 py-2 text-[0.8rem] font-semibold text-[#1a1a1a] transition hover:bg-[#f0f2f5]"
        >
          <ExternalLink size={13} strokeWidth={2} />
          Open GA4
        </a>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          SECTION 1 — CURRENT SITE  (okelcor.com)
      ═══════════════════════════════════════════════════════════════════════════ */}
      <div className="mb-10">

        {/* Section label */}
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f4511e]">
            <Zap size={16} strokeWidth={2} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[1rem] font-extrabold text-[#1a1a1a]">Current Site — okelcor.com</p>
              <SectionBadge live />
            </div>
            <p className="text-[0.78rem] text-[#5c5e62]">
              {fmtDate(curr.startDate)} — {fmtDate(curr.endDate)}
              {curr.startDate === LAUNCH_DATE && (
                <span className="ml-2 text-[0.72rem] text-[#8c8f94]">(launch date floor applied)</span>
              )}
            </p>
          </div>
        </div>

        {/* Stat cards */}
        {currOverview ? (
          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard label="Active Users"  value={fmtNum(currOverview.activeUsers)}  icon={Users}            accent="bg-[#f4511e]" />
            <StatCard label="Sessions"      value={fmtNum(currOverview.sessions)}      icon={MousePointerClick} accent="bg-blue-500" />
            <StatCard label="Page Views"    value={fmtNum(currOverview.pageViews)}     icon={Eye}              accent="bg-violet-500" />
            <StatCard label="Avg. Duration" value={fmtDuration(currOverview.avgSessionDuration)} icon={Clock} accent="bg-emerald-500" />
            <StatCard label="Bounce Rate"   value={`${currOverview.bounceRate}%`}      icon={TrendingUp}       accent="bg-amber-500" />
          </div>
        ) : (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[0.83rem] text-red-700">
            Could not load current-site metrics — check service account permissions.
          </div>
        )}

        {/* Trend chart */}
        {currTrend.length > 0 && (
          <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-4">
              <p className="text-[0.9rem] font-extrabold text-[#1a1a1a]">Sessions Trend</p>
              <BarChart2 size={15} className="text-[#5c5e62]" />
            </div>
            <div className="px-5 pt-4 pb-2">
              <Sparkline data={currTrend} field="sessions" color="#f4511e" />
            </div>
            <div className="flex justify-between border-t border-black/[0.04] px-5 py-3">
              <span className="text-[0.72rem] text-[#5c5e62]">{currTrend[0]?.date}</span>
              <span className="text-[0.72rem] text-[#5c5e62]">{currTrend[currTrend.length - 1]?.date}</span>
            </div>
          </div>
        )}

        {/* Google Ads panel */}
        <GoogleAdsPanel />

        {/* Bottom grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <SectionCard title="Top Pages" icon={Eye}>
              <div className="divide-y divide-black/[0.04]">
                {currPages.length === 0 ? (
                  <p className="px-5 py-8 text-center text-[0.83rem] text-[#5c5e62]">No data yet.</p>
                ) : (
                  currPages.map((p) => (
                    <MiniBarRow key={p.path} label={p.path} value={p.pageViews}
                      max={currPages[0]?.pageViews ?? 1} color="bg-violet-500" />
                  ))
                )}
              </div>
            </SectionCard>
          </div>
          <div className="lg:col-span-1">
            <SectionCard title="Traffic Sources" icon={TrendingUp}>
              <div className="divide-y divide-black/[0.04]">
                {currSources.length === 0 ? (
                  <p className="px-5 py-8 text-center text-[0.83rem] text-[#5c5e62]">No data yet.</p>
                ) : (
                  currSources.map((s) => (
                    <MiniBarRow key={s.source} label={s.source} value={s.sessions}
                      max={currSources[0]?.sessions ?? 1} color={SOURCE_COLORS[s.source] ?? "bg-[#f4511e]"} />
                  ))
                )}
              </div>
            </SectionCard>
          </div>
          <div className="lg:col-span-1">
            <SectionCard title="Top Countries" icon={Globe}>
              <div className="divide-y divide-black/[0.04]">
                {currCountries.length === 0 ? (
                  <p className="px-5 py-8 text-center text-[0.83rem] text-[#5c5e62]">No data yet.</p>
                ) : (
                  currCountries.map((c) => (
                    <MiniBarRow key={c.country} label={c.country} value={c.sessions}
                      max={currCountries[0]?.sessions ?? 1} color="bg-blue-500" />
                  ))
                )}
              </div>
            </SectionCard>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          SECTION 2 — POSTHOG  (real-time, client-side)
      ═══════════════════════════════════════════════════════════════════════════ */}
      <div className="mb-10 rounded-2xl border border-[#1d4ed8]/15 bg-[#f5f8ff] p-6">
        <PostHogPanel />
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          SECTION 3 — PREVIOUS SITE  (okelcor.de) — archived
      ═══════════════════════════════════════════════════════════════════════════ */}
      <div className="rounded-2xl border border-black/[0.07] bg-[#f7f8f9] p-6">

        {/* Section label */}
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#d1d5db]">
            <Archive size={16} strokeWidth={1.8} className="text-[#5c5e62]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[1rem] font-extrabold text-[#3a3d42]">Previous Site — okelcor.de</p>
              <SectionBadge live={false} />
            </div>
            <p className="text-[0.78rem] text-[#8c8f94]">
              {fmtDate(prevStart)} — {fmtDate(prevEnd)} &middot; historical archive
            </p>
          </div>
        </div>

        {/* Archive notice */}
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-[#d1d5db] bg-white/80 px-4 py-3">
          <AlertCircle size={15} className="mt-0.5 shrink-0 text-[#8c8f94]" />
          <p className="text-[0.8rem] text-[#5c5e62]">
            This data covers the old <strong>okelcor.de</strong> domain up to{" "}
            <strong>21 Apr 2026</strong>. All traffic from <strong>22 Apr 2026</strong> onwards
            is shown in the Current Site section above.
          </p>
        </div>

        {/* Stat cards */}
        {prevOverview ? (
          <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <ArchiveStatCard label="Active Users"  value={fmtNum(prevOverview.activeUsers)}  icon={Users} />
            <ArchiveStatCard label="Sessions"      value={fmtNum(prevOverview.sessions)}      icon={MousePointerClick} />
            <ArchiveStatCard label="Page Views"    value={fmtNum(prevOverview.pageViews)}     icon={Eye} />
            <ArchiveStatCard label="Avg. Duration" value={fmtDuration(prevOverview.avgSessionDuration)} icon={Clock} />
            <ArchiveStatCard label="Bounce Rate"   value={`${prevOverview.bounceRate}%`}      icon={TrendingUp} />
          </div>
        ) : (
          <div className="mb-6 rounded-xl border border-[#d1d5db] bg-white/80 px-4 py-3 text-[0.83rem] text-[#5c5e62]">
            Could not load historical metrics.
          </div>
        )}

        {/* Trend chart */}
        {prevTrend.length > 0 && (
          <div className="mb-6 overflow-hidden rounded-2xl border border-black/[0.06] bg-white/80">
            <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-4">
              <p className="text-[0.9rem] font-extrabold text-[#5c5e62]">Sessions Trend (all time)</p>
              <BarChart2 size={15} className="text-[#8c8f94]" />
            </div>
            <div className="px-5 pt-4 pb-2">
              <Sparkline data={prevTrend} field="sessions" color="#9ca3af" />
            </div>
            <div className="flex justify-between border-t border-black/[0.04] px-5 py-3">
              <span className="text-[0.72rem] text-[#8c8f94]">{prevTrend[0]?.date}</span>
              <span className="text-[0.72rem] text-[#8c8f94]">{prevTrend[prevTrend.length - 1]?.date}</span>
            </div>
          </div>
        )}

        {/* Bottom grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <SectionCard title="Top Pages" icon={Eye} muted>
              <div className="divide-y divide-black/[0.04]">
                {prevPages.length === 0 ? (
                  <p className="px-5 py-8 text-center text-[0.83rem] text-[#8c8f94]">No data.</p>
                ) : (
                  prevPages.map((p) => (
                    <MiniBarRow key={p.path} label={p.path} value={p.pageViews}
                      max={prevPages[0]?.pageViews ?? 1} color="bg-[#9ca3af]" />
                  ))
                )}
              </div>
            </SectionCard>
          </div>
          <div className="lg:col-span-1">
            <SectionCard title="Traffic Sources" icon={TrendingUp} muted>
              <div className="divide-y divide-black/[0.04]">
                {prevSources.length === 0 ? (
                  <p className="px-5 py-8 text-center text-[0.83rem] text-[#8c8f94]">No data.</p>
                ) : (
                  prevSources.map((s) => (
                    <MiniBarRow key={s.source} label={s.source} value={s.sessions}
                      max={prevSources[0]?.sessions ?? 1} color="bg-[#9ca3af]" />
                  ))
                )}
              </div>
            </SectionCard>
          </div>
          <div className="lg:col-span-1">
            <SectionCard title="Top Countries" icon={Globe} muted>
              <div className="divide-y divide-black/[0.04]">
                {prevCountries.length === 0 ? (
                  <p className="px-5 py-8 text-center text-[0.83rem] text-[#8c8f94]">No data.</p>
                ) : (
                  prevCountries.map((c) => (
                    <MiniBarRow key={c.country} label={c.country} value={c.sessions}
                      max={prevCountries[0]?.sessions ?? 1} color="bg-[#9ca3af]" />
                  ))
                )}
              </div>
            </SectionCard>
          </div>
        </div>
      </div>

    </div>
  );
}
