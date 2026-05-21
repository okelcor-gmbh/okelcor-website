"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ShoppingBag,
  RefreshCw,
  Search,
  CheckSquare,
  Square,
  AlertCircle,
  X,
  Loader2,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  Link2,
  Link2Off,
  AlertTriangle,
  RotateCcw,
  Upload,
  Settings,
  ChevronDown,
  Copy,
  ClipboardCheck,
  Eye,
  PackageSearch,
} from "lucide-react";
import Link from "next/link";
import { useAdminPermissions } from "@/hooks/use-admin-permissions";
import EbayLogsPanel from "@/components/admin/ebay-logs-panel";

// ── Types ─────────────────────────────────────────────────────────────────────

type EbayStatus = "active" | "draft" | "error" | "ended" | "withdrawn" | "unknown" | null;

type Product = {
  id:                   number;
  sku:                  string;
  brand:                string;
  name:                 string;
  size:                 string;
  type:                 string;
  price:                number;
  is_active:            boolean;
  ebay_listed:          boolean;
  ebay_item_id?:        string | null;
  ebay_status?:         EbayStatus;
  ebay_offer_id?:       string | null;
  ebay_last_synced_at?: string | null;
  ebay_sync_error?:     string | null;
  image_url?:           string | null;
  updated_at?:          string | null;
};

type Meta = {
  total?:        number;
  current_page?: number;
  last_page?:    number;
};

type SyncData = {
  activeCount: number;
  activeSKUs:  string[];
  listings:    { itemId: string; title: string; sku?: string; quantity?: number; price?: number }[];
  syncedAt?:   string;
  error?:      string;
};

type BulkResult = { succeeded: number; failed: number; errors: string[] };

type EbayConnectionStatus = {
  connected:          boolean;
  marketplace_id?:    string;
  seller_username?:   string | null;
  connected_at?:      string | null;
  last_refreshed_at?: string | null;
  missing_config?:    string[];
};

type ReadinessCheck = {
  key:     string;
  label:   string;
  status:  "pass" | "warning" | "fail";
  message?: string;
};

type ReadinessData = {
  connected:       boolean;
  environment?:    string;
  marketplace_id?: string;
  category_id?:    string;
  policies?: {
    payment_policy_id?:     string | null;
    fulfillment_policy_id?: string | null;
    return_policy_id?:      string | null;
  };
  seller_location?: {
    postal_code?: string;
    location?:    string;
  };
  checks:          ReadinessCheck[];
  missing_config?: string[];
};

type TestResult = { success: boolean; message: string };

type Notification = { type: "success" | "error"; message: string };

type EbayPolicy  = { id: string; name: string };
type EbayPolicies = { payment: EbayPolicy[]; fulfillment: EbayPolicy[]; return: EbayPolicy[] };

// Normalises various backend key-naming conventions into a single shape.
function normalizePolicies(raw: Record<string, unknown>): EbayPolicies {
  const pick = (...keys: string[]): EbayPolicy[] => {
    for (const k of keys) {
      const v = raw[k];
      if (Array.isArray(v) && v.length > 0) return v as EbayPolicy[];
    }
    return [];
  };
  return {
    payment:     pick("payment", "payment_policies", "paymentPolicies"),
    fulfillment: pick("fulfillment", "fulfillment_policies", "fulfillmentPolicies", "shipping", "shipping_policies", "shippingPolicies"),
    return:      pick("return", "return_policies", "returnPolicies"),
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtSynced(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function isStale(product: Product): boolean {
  if (!product.updated_at || !product.ebay_last_synced_at) return false;
  try {
    return new Date(product.updated_at) > new Date(product.ebay_last_synced_at);
  } catch {
    return false;
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

const EBAY_STATUS_STYLES: Record<string, string> = {
  active:    "bg-green-100 text-green-700",
  draft:     "bg-amber-100 text-amber-700",
  error:     "bg-red-100 text-red-700",
  ended:     "bg-gray-100 text-gray-600",
  withdrawn: "bg-gray-100 text-gray-600",
  unknown:   "bg-gray-100 text-gray-500",
};

function EbayStatusBadge({ status }: { status?: EbayStatus }) {
  if (!status || status === "unknown") return null;
  const cls = EBAY_STATUS_STYLES[status] ?? "bg-gray-100 text-gray-500";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.65rem] font-bold capitalize ${cls}`}>
      {status === "active" && <CheckCircle2 size={9} strokeWidth={2.5} />}
      {(status === "error" || status === "ended") && <XCircle size={9} strokeWidth={2.5} />}
      {status}
    </span>
  );
}

function EbayBadge({ itemId }: { itemId?: string | null }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[0.68rem] font-bold text-green-700">
      <ShoppingBag size={10} strokeWidth={2.5} />
      eBay Live
      {itemId && (
        <a
          href={`https://www.ebay.de/itm/${itemId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-1 font-mono text-[0.65rem] text-green-600 underline hover:text-green-800"
          title="View on eBay"
          onClick={(e) => e.stopPropagation()}
        >
          #{itemId}
        </a>
      )}
    </span>
  );
}

const CHECK_ICON = {
  pass:    <CheckCircle2  size={13} strokeWidth={2.5} className="shrink-0 text-green-500" />,
  warning: <AlertTriangle size={13} strokeWidth={2.5} className="shrink-0 text-amber-500" />,
  fail:    <XCircle       size={13} strokeWidth={2.5} className="shrink-0 text-red-500"   />,
};

function ReadinessPanel({
  readiness, loading, testLoading, testResult, onTest, canManage,
}: {
  readiness:   ReadinessData | null;
  loading:     boolean;
  testLoading: boolean;
  testResult:  TestResult | null;
  onTest:      () => void;
  canManage:   boolean;
}) {
  const [open, setOpen] = useState(false);

  const [policies, setPolicies]               = useState<EbayPolicies | null>(null);
  const [policiesLoading, setPoliciesLoading] = useState(false);
  const [policiesError, setPoliciesError]     = useState<string | null>(null);
  const [copiedId, setCopiedId]               = useState<string | null>(null);

  useEffect(() => {
    if (readiness?.checks.some((c) => c.status === "fail")) setOpen(true);
  }, [readiness]);

  const handleFetchPolicies = async () => {
    setPoliciesLoading(true);
    setPoliciesError(null);
    try {
      const res  = await fetch("/api/admin/ebay/policies");
      const json = await res.json().catch(() => ({} as Record<string, unknown>));
      if (!res.ok) {
        setPoliciesError(
          typeof json.error === "string"   ? json.error
          : typeof json.message === "string" ? json.message
          : "Failed to fetch business policies."
        );
      } else {
        const raw = (json as { data?: Record<string, unknown> }).data
          ?? (json as Record<string, unknown>);
        setPolicies(normalizePolicies(raw));
      }
    } catch {
      setPoliciesError("Network error — could not fetch policies.");
    } finally {
      setPoliciesLoading(false);
    }
  };

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const passCount = readiness?.checks.filter((c) => c.status === "pass").length    ?? 0;
  const warnCount = readiness?.checks.filter((c) => c.status === "warning").length ?? 0;
  const failCount = readiness?.checks.filter((c) => c.status === "fail").length    ?? 0;
  const allPass   = !loading && failCount === 0 && warnCount === 0 && passCount > 0;

  return (
    <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm">
      {/* Header toggle */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-[#fafafa]"
      >
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${allPass ? "bg-green-100" : failCount > 0 ? "bg-red-100" : "bg-amber-50"}`}>
            <Settings
              size={17}
              strokeWidth={1.8}
              className={allPass ? "text-green-600" : failCount > 0 ? "text-red-500" : "text-amber-500"}
            />
          </div>
          <div>
            <p className="text-[0.83rem] font-bold text-[#1a1a1a]">Setup &amp; Readiness</p>
            <div className="mt-0.5 flex items-center gap-2 text-[0.7rem] font-semibold">
              {loading && <span className="text-[#aaa]">Checking…</span>}
              {!loading && readiness === null && <span className="text-[#aaa]">Not deployed — skipped</span>}
              {!loading && passCount > 0 && <span className="text-green-600">{passCount} pass</span>}
              {!loading && warnCount > 0 && <span className="text-amber-600">{warnCount} warning{warnCount > 1 ? "s" : ""}</span>}
              {!loading && failCount > 0 && <span className="text-red-600">{failCount} fail{failCount > 1 ? "s" : ""}</span>}
            </div>
          </div>
        </div>
        <ChevronDown
          size={16}
          strokeWidth={2}
          className={`shrink-0 text-[#5c5e62] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Body */}
      {open && (
        <div className="border-t border-black/[0.06] px-5 pb-5 pt-4">
          {loading ? (
            <div className="space-y-2.5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-9 w-full animate-pulse rounded-xl bg-[#f0f2f5]" />
              ))}
            </div>
          ) : !readiness ? (
            <p className="text-[0.83rem] text-[#5c5e62]">
              Readiness endpoint not yet deployed. Configure your eBay environment variables and deploy the backend readiness check to see results here.
            </p>
          ) : (
            <>
              {/* Config tags */}
              {(readiness.environment || readiness.marketplace_id || readiness.category_id || readiness.seller_location?.location) && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {readiness.environment && (
                    <span className={`rounded-full px-2.5 py-1 text-[0.7rem] font-bold uppercase tracking-wide ${readiness.environment === "production" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                      {readiness.environment}
                    </span>
                  )}
                  {readiness.marketplace_id && (
                    <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[0.7rem] font-bold text-blue-700">
                      {readiness.marketplace_id}
                    </span>
                  )}
                  {readiness.category_id && (
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[0.7rem] font-semibold text-gray-700">
                      Category {readiness.category_id}
                    </span>
                  )}
                  {readiness.seller_location?.location && (
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[0.7rem] font-semibold text-gray-700">
                      {readiness.seller_location.location}
                      {readiness.seller_location.postal_code && ` · ${readiness.seller_location.postal_code}`}
                    </span>
                  )}
                </div>
              )}

              {/* Checklist grid */}
              {readiness.checks.length > 0 && (
                <div className="mb-4 grid gap-2 sm:grid-cols-2">
                  {readiness.checks.map((check) => (
                    <div
                      key={check.key}
                      className={`flex items-start gap-2.5 rounded-xl px-3 py-2.5 ${
                        check.status === "fail"    ? "bg-red-50"
                        : check.status === "warning" ? "bg-amber-50"
                        : "bg-[#f5f7f5]"
                      }`}
                    >
                      {CHECK_ICON[check.status]}
                      <div className="min-w-0">
                        <p className={`text-[0.8rem] font-semibold leading-snug ${
                          check.status === "fail"    ? "text-red-700"
                          : check.status === "warning" ? "text-amber-700"
                          : "text-[#1a1a1a]"
                        }`}>
                          {check.label}
                        </p>
                        {check.message && (
                          <p className="mt-0.5 text-[0.72rem] text-[#5c5e62]">{check.message}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Seller Business Policies ─────────────────────────────── */}
              <div className="mb-4 border-t border-black/[0.06] pt-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-[0.8rem] font-bold text-[#1a1a1a]">Seller Business Policies</p>
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => void handleFetchPolicies()}
                      disabled={policiesLoading}
                      className="flex shrink-0 items-center gap-1.5 rounded-xl border border-black/[0.09] bg-white px-3 py-1.5 text-[0.78rem] font-semibold text-[#1a1a1a] transition hover:bg-[#f0f2f5] disabled:opacity-50"
                    >
                      {policiesLoading
                        ? <Loader2  size={12} className="animate-spin" />
                        : <RefreshCw size={12} strokeWidth={2} />}
                      {policies ? "Refresh" : "Fetch Business Policies"}
                    </button>
                  )}
                </div>

                {policiesError && (
                  <p className="mb-3 flex items-center gap-1.5 text-[0.78rem] font-semibold text-red-600">
                    <AlertCircle size={12} strokeWidth={2} className="shrink-0" />
                    {policiesError}
                  </p>
                )}

                {policies && (() => {
                  const groups: { label: string; envKey: string; items: EbayPolicy[] }[] = [
                    { label: "Payment Policies",             envKey: "EBAY_PAYMENT_POLICY_ID",     items: policies.payment },
                    { label: "Fulfillment / Shipping Policies", envKey: "EBAY_FULFILLMENT_POLICY_ID", items: policies.fulfillment },
                    { label: "Return Policies",              envKey: "EBAY_RETURN_POLICY_ID",      items: policies.return },
                  ];
                  const totalPolicies = groups.reduce((n, g) => n + g.items.length, 0);
                  if (totalPolicies === 0) {
                    return (
                      <p className="text-[0.78rem] text-[#5c5e62]">
                        No policies found. Create business policies in{" "}
                        <a href="https://www.ebay.de/sh/ovw" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">
                          eBay Seller Hub
                        </a>{" "}
                        first.
                      </p>
                    );
                  }
                  return (
                    <div className="space-y-4">
                      {groups.map((group) => (
                        <div key={group.envKey}>
                          <p className="mb-1.5 text-[0.72rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">
                            {group.label}
                          </p>
                          {group.items.length === 0 ? (
                            <p className="text-[0.75rem] text-[#aaa]">No {group.label.toLowerCase()} found.</p>
                          ) : (
                            <div className="space-y-1.5">
                              {group.items.map((pol) => (
                                <div
                                  key={pol.id}
                                  className="flex items-center justify-between gap-3 rounded-xl border border-black/[0.07] bg-[#fafafa] px-3 py-2"
                                >
                                  <div className="min-w-0">
                                    <p className="truncate text-[0.8rem] font-semibold text-[#1a1a1a]">{pol.name}</p>
                                    <p className="mt-0.5 font-mono text-[0.69rem] text-[#5c5e62]">{pol.id}</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => copyId(pol.id)}
                                    title="Copy policy ID"
                                    className="flex shrink-0 items-center gap-1 rounded-lg border border-black/[0.09] bg-white px-2.5 py-1.5 text-[0.72rem] font-semibold text-[#5c5e62] transition hover:border-green-300 hover:text-green-700"
                                  >
                                    {copiedId === pol.id
                                      ? <><ClipboardCheck size={11} strokeWidth={2} className="text-green-600" /> Copied</>
                                      : <><Copy size={11} strokeWidth={2} /> Copy ID</>}
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })()}

                {!policies && !policiesLoading && !policiesError && (
                  <p className="text-[0.75rem] text-[#aaa]">
                    Click &ldquo;Fetch Business Policies&rdquo; to retrieve available policies from your connected eBay account.
                  </p>
                )}
              </div>

              {/* Help text + env var guide */}
              <p className="mb-4 rounded-xl bg-[#f5f7f5] px-3 py-2.5 text-[0.74rem] leading-5 text-[#5c5e62]">
                Copy one policy ID from each group into your backend <code className="font-mono text-[0.7rem]">.env</code>:{" "}
                <code className="font-mono text-[0.7rem] text-[#1a1a1a]">EBAY_PAYMENT_POLICY_ID</code>,{" "}
                <code className="font-mono text-[0.7rem] text-[#1a1a1a]">EBAY_FULFILLMENT_POLICY_ID</code>,{" "}
                <code className="font-mono text-[0.7rem] text-[#1a1a1a]">EBAY_RETURN_POLICY_ID</code>.
              </p>

              {/* Test connection */}
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  {testResult && (
                    <span className={`flex items-center gap-1.5 text-[0.8rem] font-semibold ${testResult.success ? "text-green-700" : "text-red-600"}`}>
                      {testResult.success
                        ? <CheckCircle2 size={13} strokeWidth={2.5} />
                        : <XCircle      size={13} strokeWidth={2.5} />}
                      {testResult.message}
                    </span>
                  )}
                </div>
                {canManage && (
                  <button
                    type="button"
                    onClick={onTest}
                    disabled={testLoading}
                    className="flex shrink-0 items-center gap-1.5 rounded-xl border border-black/[0.09] bg-white px-3.5 py-2 text-[0.8rem] font-semibold text-[#1a1a1a] transition hover:bg-[#f0f2f5] disabled:opacity-50"
                  >
                    {testLoading
                      ? <Loader2  size={13} className="animate-spin" />
                      : <RefreshCw size={13} strokeWidth={2} />}
                    Test Connection
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function StatCards({
  listedCount, totalCount, ebayCount, syncing, syncedAt,
}: {
  listedCount: number; totalCount: number;
  ebayCount:   number | null; syncing: boolean; syncedAt?: string;
}) {
  const displayListed = ebayCount !== null ? ebayCount : listedCount;
  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-3">
      <div className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-500">
          <ShoppingBag size={20} strokeWidth={1.8} className="text-white" />
        </div>
        <div>
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.14em] text-[#5c5e62]">Listed on eBay</p>
          <p className="mt-0.5 text-2xl font-extrabold text-[#1a1a1a]">
            {syncing ? <Loader2 size={18} className="inline animate-spin" /> : displayListed}
          </p>
          {syncedAt && !syncing && (
            <p className="mt-0.5 text-[0.65rem] text-[#aaa]">from eBay · {new Date(syncedAt).toLocaleTimeString()}</p>
          )}
          {ebayCount === null && !syncing && (
            <p className="mt-0.5 text-[0.65rem] text-[#aaa]">from local data</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E85C1A]">
          <ShoppingBag size={20} strokeWidth={1.8} className="text-white" />
        </div>
        <div>
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.14em] text-[#5c5e62]">Unlisted Products</p>
          <p className="mt-0.5 text-2xl font-extrabold text-[#1a1a1a]">{totalCount - listedCount}</p>
        </div>
      </div>
      <div className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500">
          <ShoppingBag size={20} strokeWidth={1.8} className="text-white" />
        </div>
        <div>
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.14em] text-[#5c5e62]">Total Products</p>
          <p className="mt-0.5 text-2xl font-extrabold text-[#1a1a1a]">{totalCount}</p>
        </div>
      </div>
    </div>
  );
}

function ConnectionCard({
  status, loading, onConnect, onDisconnect, connectLoading, disconnectLoading, canManage,
}: {
  status: EbayConnectionStatus | null; loading: boolean;
  onConnect: () => void; onDisconnect: () => void;
  connectLoading: boolean; disconnectLoading: boolean; canManage: boolean;
}) {
  if (!loading && status === null) return null;

  if (loading) {
    return <div className="mb-6 h-[76px] animate-pulse overflow-hidden rounded-2xl bg-white shadow-sm" />;
  }

  if (status?.connected) {
    return (
      <div className="mb-6 flex items-center justify-between gap-4 overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="flex items-center gap-3 border-l-4 border-green-500 px-5 py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-green-100">
            <CheckCircle2 size={18} className="text-green-600" />
          </div>
          <div>
            <p className="text-[0.83rem] font-bold text-[#1a1a1a]">eBay Account Connected</p>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-[0.73rem] text-[#5c5e62]">
              {status.marketplace_id && (
                <span>Marketplace: <span className="font-semibold text-[#1a1a1a]">{status.marketplace_id}</span></span>
              )}
              {status.seller_username && (
                <span>Seller: <span className="font-semibold text-[#1a1a1a]">{status.seller_username}</span></span>
              )}
              {status.last_refreshed_at && (
                <span>Token refreshed: {new Date(status.last_refreshed_at).toLocaleString()}</span>
              )}
            </div>
          </div>
        </div>
        {canManage && (
          <div className="shrink-0 pr-5">
            <button
              type="button"
              onClick={onDisconnect}
              disabled={disconnectLoading}
              className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-[0.78rem] font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
            >
              {disconnectLoading ? <Loader2 size={13} className="animate-spin" /> : <Link2Off size={13} strokeWidth={2} />}
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  const missing = status?.missing_config ?? [];
  return (
    <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm">
      <div className="flex items-center justify-between gap-4 border-l-4 border-amber-400 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50">
            <Link2Off size={18} className="text-amber-500" />
          </div>
          <div>
            <p className="text-[0.83rem] font-bold text-[#1a1a1a]">eBay Account Not Connected</p>
            <p className="mt-0.5 text-[0.73rem] text-[#5c5e62]">
              Connect your eBay seller account to enable listing and sync.
            </p>
            {missing.length > 0 && (
              <p className="mt-1 text-[0.72rem] font-semibold text-red-600">
                Missing configuration: {missing.join(", ")}
              </p>
            )}
          </div>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={onConnect}
            disabled={connectLoading}
            className="flex shrink-0 items-center gap-1.5 rounded-xl bg-[#E85C1A] px-4 py-2 text-[0.8rem] font-semibold text-white transition hover:bg-[#d45218] disabled:opacity-50"
          >
            {connectLoading ? <Loader2 size={13} className="animate-spin" /> : <Link2 size={13} strokeWidth={2} />}
            Connect eBay Account
          </button>
        )}
      </div>
    </div>
  );
}

// ── eBay Orders Panel ─────────────────────────────────────────────────────────

type EbayOrder = {
  ebay_order_id: string;
  order_ref?: string | null;
  order_id?: number | null;
  buyer_username?: string | null;
  buyer_email?: string | null;
  ebay_payment_status?: string | null;
  ebay_fulfillment_status?: string | null;
  status?: string | null;
  total?: number | null;
  currency?: string | null;
  ebay_last_synced_at?: string | null;
  created_at?: string | null;
};

type EbaySyncResult = {
  imported_count: number;
  updated_count: number;
  failed_count: number;
  errors?: string[];
};

const EBAY_PAYMENT_STYLES: Record<string, string> = {
  PAID:    "bg-emerald-100 text-emerald-700",
  PENDING: "bg-amber-100 text-amber-700",
  FAILED:  "bg-red-100 text-red-700",
};

const EBAY_FULFILLMENT_STYLES: Record<string, string> = {
  FULFILLED:   "bg-emerald-100 text-emerald-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  NOT_STARTED: "bg-gray-100 text-gray-600",
  CANCELLED:   "bg-red-100 text-red-600",
};

function fmtEbayDate(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
}

function EbayOrdersPanel({ canManage }: { canManage: boolean }) {
  const [orders, setOrders]               = useState<EbayOrder[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);
  const [syncLoading, setSyncLoading]     = useState(false);
  const [syncResult, setSyncResult]       = useState<EbaySyncResult | null>(null);
  const [rowSyncing, setRowSyncing]       = useState<Set<string>>(new Set());
  const [payFilter, setPayFilter]         = useState("");
  const [fulfillFilter, setFulfillFilter] = useState("");
  const [page, setPage]                   = useState(1);
  const [lastPage, setLastPage]           = useState(1);
  const [total, setTotal]                 = useState<number | null>(null);

  const fetchOrders = useCallback(async (opts?: { pay?: string; fulfill?: string; pg?: number }) => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    const payVal     = opts?.pay     !== undefined ? opts.pay     : payFilter;
    const fulfillVal = opts?.fulfill !== undefined ? opts.fulfill : fulfillFilter;
    const pgVal      = opts?.pg      !== undefined ? opts.pg      : page;
    if (payVal)     params.set("payment_status",     payVal);
    if (fulfillVal) params.set("fulfillment_status", fulfillVal);
    params.set("page", String(pgVal));
    try {
      const res  = await fetch(`/api/admin/ebay/orders?${params}`);
      if (res.status === 401) { setError("Session expired."); return; }
      const json = await res.json() as { data?: EbayOrder[]; meta?: { last_page?: number; total?: number } };
      setOrders(Array.isArray(json.data) ? json.data : []);
      setLastPage(json.meta?.last_page ?? 1);
      setTotal(json.meta?.total ?? null);
    } catch {
      setError("Could not load eBay orders.");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { void fetchOrders(); }, [fetchOrders]);

  const handleSync = async () => {
    if (!canManage) return;
    setSyncLoading(true);
    setSyncResult(null);
    setError(null);
    try {
      const res  = await fetch("/api/admin/ebay/orders/sync", { method: "POST" });
      const json = await res.json().catch(() => ({} as Record<string, unknown>));
      if (!res.ok) {
        const msg = typeof json.message === "string" ? json.message : "Sync failed.";
        setError(msg);
      } else {
        const d = (json as { data?: EbaySyncResult }).data ?? (json as EbaySyncResult);
        setSyncResult(d);
        void fetchOrders();
      }
    } catch {
      setError("Network error — sync failed.");
    } finally {
      setSyncLoading(false);
    }
  };

  const handleRowSync = async (ebayOrderId: string) => {
    if (!canManage) return;
    setRowSyncing((prev) => new Set(prev).add(ebayOrderId));
    try {
      const res  = await fetch(`/api/admin/ebay/orders/${encodeURIComponent(ebayOrderId)}/sync`, { method: "POST" });
      const json = await res.json().catch(() => ({} as Record<string, unknown>));
      if (res.ok) {
        const updated = (json as { data?: EbayOrder }).data ?? (json as EbayOrder);
        setOrders((prev) =>
          prev.map((o) =>
            o.ebay_order_id === ebayOrderId ? { ...o, ...updated } : o
          )
        );
      }
    } catch { /* silent — row stays stale */ } finally {
      setRowSyncing((prev) => { const n = new Set(prev); n.delete(ebayOrderId); return n; });
    }
  };

  const applyPayFilter = (val: string) => {
    setPayFilter(val); setPage(1); void fetchOrders({ pay: val, pg: 1 });
  };
  const applyFulfillFilter = (val: string) => {
    setFulfillFilter(val); setPage(1); void fetchOrders({ fulfill: val, pg: 1 });
  };

  return (
    <div>
      {/* ── Header ── */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-[0.75rem] font-bold uppercase tracking-[0.18em] text-[#E85C1A]">eBay Orders</p>
          <p className="mt-1 text-[0.875rem] text-[#5c5e62]">
            Buyer orders synced from eBay Sell Fulfillment API.
            {typeof total === "number" && ` · ${total} orders`}
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => void handleSync()}
            disabled={syncLoading}
            className="flex shrink-0 items-center gap-2 rounded-xl bg-[#E85C1A] px-4 py-2.5 text-[0.83rem] font-semibold text-white transition hover:bg-[#d14f14] disabled:opacity-50"
          >
            {syncLoading
              ? <Loader2 size={14} className="animate-spin" />
              : <RefreshCw size={14} strokeWidth={2} />}
            {syncLoading ? "Syncing…" : "Sync eBay Orders"}
          </button>
        )}
      </div>

      {/* ── Sync result ── */}
      {syncResult && (
        <div className={`mb-4 flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-[0.83rem] ${syncResult.failed_count > 0 ? "border-amber-200 bg-amber-50 text-amber-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
          <div>
            <p className="font-semibold">
              Sync complete — {syncResult.imported_count} imported, {syncResult.updated_count} updated
              {syncResult.failed_count > 0 && `, ${syncResult.failed_count} failed`}.
            </p>
            {syncResult.errors?.slice(0, 3).map((e, i) => (
              <p key={i} className="mt-0.5 text-[0.78rem] opacity-80">{e}</p>
            ))}
          </div>
          <button type="button" onClick={() => setSyncResult(null)} className="shrink-0"><X size={14} /></button>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[0.83rem] text-red-700">
          <AlertCircle size={14} className="shrink-0" />
          {error}
          <button type="button" onClick={() => setError(null)} className="ml-auto shrink-0"><X size={13} /></button>
        </div>
      )}

      {/* ── Filters ── */}
      <div className="mb-4 flex flex-wrap gap-3">
        <select
          value={payFilter}
          onChange={(e) => applyPayFilter(e.target.value)}
          className="h-9 rounded-xl border border-black/[0.09] bg-white px-3 text-[0.83rem] text-[#1a1a1a] outline-none transition focus:border-[#E85C1A] focus:ring-2 focus:ring-[#E85C1A]/10 cursor-pointer"
        >
          <option value="">All payments</option>
          <option value="PAID">Paid</option>
          <option value="PENDING">Pending</option>
          <option value="FAILED">Failed</option>
        </select>
        <select
          value={fulfillFilter}
          onChange={(e) => applyFulfillFilter(e.target.value)}
          className="h-9 rounded-xl border border-black/[0.09] bg-white px-3 text-[0.83rem] text-[#1a1a1a] outline-none transition focus:border-[#E85C1A] focus:ring-2 focus:ring-[#E85C1A]/10 cursor-pointer"
        >
          <option value="">All fulfillment</option>
          <option value="NOT_STARTED">Not Started</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="FULFILLED">Fulfilled</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <button
          type="button"
          onClick={() => void fetchOrders()}
          title="Refresh"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/[0.09] bg-white text-[#5c5e62] transition hover:text-[#1a1a1a]"
        >
          <RefreshCw size={13} strokeWidth={2} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* ── Table ── */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead>
              <tr className="border-b border-black/[0.06] bg-[#fafafa]">
                {["eBay Order ID", "Okelcor Ref", "Buyer", "eBay Payment", "Fulfillment", "Status", "Last Synced", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-[0.7rem] font-bold uppercase tracking-[0.12em] text-[#5c5e62]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center"><Loader2 size={20} className="mx-auto animate-spin text-[#5c5e62]" /></td></tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-14 text-center">
                    <PackageSearch size={32} strokeWidth={1.4} className="mx-auto mb-3 text-[#ccc]" />
                    <p className="text-[0.875rem] text-[#5c5e62]">No eBay orders found. Click &ldquo;Sync eBay Orders&rdquo; to import.</p>
                  </td>
                </tr>
              ) : orders.map((o) => (
                <tr key={o.ebay_order_id} className="group transition hover:bg-[#fafafa]">
                  <td className="px-4 py-3 font-mono text-[0.78rem] font-semibold text-[#1a1a1a]">
                    {o.ebay_order_id}
                  </td>
                  <td className="px-4 py-3">
                    {o.order_ref ? (
                      <span className="font-mono text-[0.78rem] font-semibold text-[#1a1a1a]">{o.order_ref}</span>
                    ) : (
                      <span className="text-[0.75rem] text-[#aaa]">Not imported</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-[0.83rem] text-[#1a1a1a]">{o.buyer_username ?? "—"}</p>
                    {o.buyer_email && <p className="text-[0.72rem] text-[#5c5e62]">{o.buyer_email}</p>}
                  </td>
                  <td className="px-4 py-3">
                    {o.ebay_payment_status ? (
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.68rem] font-bold ${EBAY_PAYMENT_STYLES[o.ebay_payment_status] ?? "bg-gray-100 text-gray-500"}`}>
                        {o.ebay_payment_status}
                      </span>
                    ) : <span className="text-[0.75rem] text-[#aaa]">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {o.ebay_fulfillment_status ? (
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.68rem] font-bold ${EBAY_FULFILLMENT_STYLES[o.ebay_fulfillment_status] ?? "bg-gray-100 text-gray-500"}`}>
                        {o.ebay_fulfillment_status.replace(/_/g, " ")}
                      </span>
                    ) : <span className="text-[0.75rem] text-[#aaa]">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {o.status ? (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[0.68rem] font-semibold capitalize text-gray-600">
                        {o.status.replace(/_/g, " ")}
                      </span>
                    ) : <span className="text-[0.75rem] text-[#aaa]">—</span>}
                  </td>
                  <td className="px-4 py-3 text-[0.73rem] text-[#5c5e62] whitespace-nowrap">
                    {fmtEbayDate(o.ebay_last_synced_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => void handleRowSync(o.ebay_order_id)}
                          disabled={rowSyncing.has(o.ebay_order_id)}
                          title="Sync this order"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/[0.09] bg-white text-[#5c5e62] transition hover:border-[#E85C1A] hover:text-[#E85C1A] disabled:opacity-40"
                        >
                          {rowSyncing.has(o.ebay_order_id)
                            ? <Loader2   size={13} className="animate-spin" />
                            : <RotateCcw size={13} strokeWidth={2} />}
                        </button>
                      )}
                      {o.order_id && (
                        <Link
                          href={`/admin/orders/${o.order_id}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/[0.09] bg-white text-[#5c5e62] transition hover:border-blue-300 hover:text-blue-600"
                          title="View Okelcor order"
                        >
                          <Eye size={13} strokeWidth={2} />
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {lastPage > 1 && (
          <div className="flex items-center justify-between border-t border-black/[0.06] px-5 py-3">
            <p className="text-[0.78rem] text-[#5c5e62]">Page {page} of {lastPage}</p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => { setPage(page - 1); void fetchOrders({ pg: page - 1 }); }}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/[0.09] bg-white text-[#1a1a1a] transition hover:border-[#E85C1A] hover:text-[#E85C1A] disabled:pointer-events-none disabled:bg-[#f5f5f5] disabled:text-[#ccc]"
              >‹</button>
              <button
                type="button"
                disabled={page >= lastPage}
                onClick={() => { setPage(page + 1); void fetchOrders({ pg: page + 1 }); }}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/[0.09] bg-white text-[#1a1a1a] transition hover:border-[#E85C1A] hover:text-[#E85C1A] disabled:pointer-events-none disabled:bg-[#f5f5f5] disabled:text-[#ccc]"
              >›</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function EbayPage() {
  const { can, loading: permLoading } = useAdminPermissions();

  const [pageTab, setPageTab] = useState<"products" | "orders">("products");

  const [products, setProducts]       = useState<Product[]>([]);
  const [meta, setMeta]               = useState<Meta>({});
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [q, setQ]           = useState("");
  const [filter, setFilter] = useState<"all" | "listed" | "unlisted">("all");
  const [page, setPage]     = useState(1);

  // ── Bulk list state ─────────────────────────────────────────────────────────
  const [selected, setSelected]         = useState<Set<number>>(new Set());
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null);
  const [bulkResult, setBulkResult]     = useState<BulkResult | null>(null);

  // ── Bulk update state ───────────────────────────────────────────────────────
  const [selectedListed, setSelectedListed]         = useState<Set<number>>(new Set());
  const [confirmBulkUpdate, setConfirmBulkUpdate]   = useState(false);
  const [bulkUpdateProgress, setBulkUpdateProgress] = useState<{ done: number; total: number } | null>(null);
  const [bulkUpdateResult, setBulkUpdateResult]     = useState<BulkResult | null>(null);

  // ── Per-product update state ────────────────────────────────────────────────
  const [confirmUpdate, setConfirmUpdate] = useState<Product | null>(null);
  const [updateLoading, setUpdateLoading] = useState<Set<number>>(new Set());

  const [, startTransition] = useTransition();

  // ── eBay sync state ─────────────────────────────────────────────────────────
  const [syncData, setSyncData] = useState<SyncData | null>(null);
  const [syncing, setSyncing]   = useState(false);

  // ── Per-product action tracking ─────────────────────────────────────────────
  const [actionLoading, setActionLoading]   = useState<Set<number>>(new Set());
  const [refreshLoading, setRefreshLoading] = useState<Set<number>>(new Set());

  // ── Connection state ────────────────────────────────────────────────────────
  const [connStatus, setConnStatus]               = useState<EbayConnectionStatus | null>(null);
  const [connLoading, setConnLoading]             = useState(true);
  const [connectLoading, setConnectLoading]       = useState(false);
  const [disconnectLoading, setDisconnectLoading] = useState(false);
  const [notification, setNotification]           = useState<Notification | null>(null);

  // ── Readiness state ─────────────────────────────────────────────────────────
  const [readiness, setReadiness]               = useState<ReadinessData | null>(null);
  const [readinessLoading, setReadinessLoading] = useState(false);
  const [testLoading, setTestLoading]           = useState(false);
  const [testResult, setTestResult]             = useState<TestResult | null>(null);

  const searchParams = useSearchParams();
  const router       = useRouter();

  // ── RBAC ────────────────────────────────────────────────────────────────────
  const canManage = !permLoading && can("ebay.manage");

  // ── Handle OAuth callback result from URL params ────────────────────────────

  useEffect(() => {
    const connected    = searchParams.get("connected");
    const disconnected = searchParams.get("disconnected");
    const ebayError    = searchParams.get("ebay_error");

    if (connected === "1") {
      setNotification({ type: "success", message: "eBay account connected successfully." });
      router.replace("/admin/ebay");
    } else if (disconnected === "1") {
      setNotification({ type: "success", message: "eBay account disconnected." });
      router.replace("/admin/ebay");
    } else if (ebayError) {
      setNotification({
        type: "error",
        message: `eBay connection failed: ${ebayError.replace(/_/g, " ")}`,
      });
      router.replace("/admin/ebay");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!notification) return;
    const t = setTimeout(() => setNotification(null), 6000);
    return () => clearTimeout(t);
  }, [notification]);

  // ── Connection status ───────────────────────────────────────────────────────

  const fetchStatus = useCallback(async () => {
    setConnLoading(true);
    try {
      const res = await fetch("/api/admin/ebay/status");
      if (res.status === 401) return;
      if (!res.ok) { setConnStatus(null); return; }
      const json = await res.json() as { data?: EbayConnectionStatus } & EbayConnectionStatus;
      setConnStatus(json.data ?? json);
    } catch {
      setConnStatus(null);
    } finally {
      setConnLoading(false);
    }
  }, []);

  useEffect(() => { void fetchStatus(); }, [fetchStatus]);

  // ── Readiness ───────────────────────────────────────────────────────────────

  const fetchReadiness = useCallback(async () => {
    setReadinessLoading(true);
    try {
      const res = await fetch("/api/admin/ebay/readiness");
      if (!res.ok) { setReadiness(null); return; }
      const json = await res.json() as { data?: ReadinessData } & ReadinessData;
      setReadiness(json.data ?? json);
    } catch {
      setReadiness(null);
    } finally {
      setReadinessLoading(false);
    }
  }, []);

  useEffect(() => { void fetchReadiness(); }, [fetchReadiness]);

  const handleTestConnection = async () => {
    setTestLoading(true);
    setTestResult(null);
    try {
      const res  = await fetch("/api/admin/ebay/test-connection", { method: "POST" });
      const json = await res.json().catch(() => ({} as Record<string, unknown>));
      const msg  = typeof json.message === "string" ? json.message
                 : res.ok ? "Connection successful — token is valid." : "Connection test failed.";
      setTestResult({ success: res.ok, message: msg });
    } catch {
      setTestResult({ success: false, message: "Network error — could not reach the eBay service." });
    } finally {
      setTestLoading(false);
      setTimeout(() => setTestResult(null), 8000);
    }
  };

  // ── OAuth connect / disconnect ──────────────────────────────────────────────

  const handleConnect = async () => {
    setConnectLoading(true);
    setActionError(null);
    try {
      const res  = await fetch("/api/admin/ebay/auth-url");
      const json = await res.json() as { data?: { url?: string }; url?: string; error?: string };
      if (!res.ok) { setActionError(json.error ?? "Could not get eBay authorization URL."); return; }
      const url = json.data?.url ?? (json as { url?: string }).url;
      if (!url) { setActionError("Backend did not return an authorization URL. Check eBay API configuration."); return; }
      window.location.href = url;
    } catch {
      setActionError("Network error — could not reach authorization service.");
    } finally {
      setConnectLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnectLoading(true);
    setActionError(null);
    try {
      const res  = await fetch("/api/admin/ebay/disconnect", { method: "POST" });
      const json = await res.json().catch(() => ({} as Record<string, unknown>));
      if (res.ok) {
        setConnStatus((prev) => prev ? { ...prev, connected: false, seller_username: null } : null);
        setNotification({ type: "success", message: "eBay account disconnected." });
      } else {
        const msg = typeof json.error === "string"   ? json.error
                  : typeof json.message === "string" ? json.message
                  : "Disconnect failed.";
        setActionError(msg);
      }
    } catch {
      setActionError("Network error — could not disconnect.");
    } finally {
      setDisconnectLoading(false);
    }
  };

  // ── Derived connection + readiness state ────────────────────────────────────
  // Graceful degradation: if endpoint not deployed (null), default to true so
  // existing actions are never blocked by a missing backend feature.

  const isConnected = connStatus === null ? true : connStatus.connected;
  const isReady     = readiness === null   ? true : !readiness.checks.some((c) => c.status === "fail");

  // ── Fetch products ──────────────────────────────────────────────────────────

  const fetchProducts = useCallback(async (opts?: { q?: string; filter?: string; page?: number }) => {
    setLoading(true);
    setError(null);
    const params    = new URLSearchParams();
    const qVal      = opts?.q      !== undefined ? opts.q      : q;
    const filterVal = opts?.filter !== undefined ? opts.filter : filter;
    const pageVal   = opts?.page   !== undefined ? opts.page   : page;

    if (qVal.trim()) params.set("q", qVal.trim());
    if (filterVal === "listed")   params.set("ebay_listed", "1");
    if (filterVal === "unlisted") params.set("ebay_listed", "0");
    params.set("per_page", "25");
    params.set("page", String(pageVal));

    try {
      const res  = await fetch(`/api/admin/products?${params}`);
      if (res.status === 401) { setError("Session expired. Please log in again."); return; }
      const json = await res.json() as { data?: Product[] };
      setProducts(Array.isArray(json.data) ? json.data : []);
      setMeta((json as { meta?: Meta }).meta ?? {});
    } catch {
      setError("Could not load products.");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { void fetchProducts(); }, [fetchProducts]);

  // ── eBay Sync ───────────────────────────────────────────────────────────────

  const handleSync = async () => {
    if (!isConnected || !isReady || !canManage) return;
    setSyncing(true);
    setActionError(null);
    try {
      const res  = await fetch("/api/admin/ebay/sync");
      const data = await res.json() as SyncData;
      if (data.error && !data.listings) {
        setActionError(`Sync error: ${data.error}`);
      } else {
        setSyncData(data);
        if (data.activeSKUs.length > 0) {
          setProducts((prev) =>
            prev.map((p) => ({
              ...p,
              ebay_listed: data.activeSKUs.includes(p.sku),
              ebay_status: data.activeSKUs.includes(p.sku) ? "active" : (p.ebay_status ?? null),
            }))
          );
        }
      }
    } catch {
      setActionError("Sync failed — could not reach eBay API.");
    } finally {
      setSyncing(false);
    }
  };

  // ── Per-product eBay toggle ─────────────────────────────────────────────────

  const toggleEbay = async (product: Product) => {
    if (!isConnected || !isReady || !canManage) return;
    setActionError(null);
    setBulkResult(null);
    setActionLoading((prev) => new Set(prev).add(product.id));

    const endpoint = product.ebay_listed
      ? `/api/admin/products/${product.id}/ebay/remove`
      : `/api/admin/products/${product.id}/ebay/list`;
    const method = product.ebay_listed ? "DELETE" : "POST";

    try {
      const res  = await fetch(endpoint, { method });
      const json = await res.json().catch(() => ({} as Record<string, unknown>));
      if (!res.ok) {
        const msg = typeof json.error === "string"   ? json.error
                  : typeof json.message === "string" ? json.message
                  : "eBay action failed.";
        setActionError(msg);
      } else {
        const itemId = typeof json.itemId === "string" ? json.itemId : null;
        setProducts((prev) =>
          prev.map((p) =>
            p.id === product.id
              ? {
                  ...p,
                  ebay_listed:     !p.ebay_listed,
                  ebay_item_id:    product.ebay_listed ? null : (itemId ?? p.ebay_item_id),
                  ebay_status:     product.ebay_listed ? "withdrawn" : "active",
                  ebay_sync_error: null,
                }
              : p
          )
        );
      }
    } catch {
      setActionError("Network error.");
    } finally {
      setActionLoading((prev) => {
        const next = new Set(prev); next.delete(product.id); return next;
      });
    }
  };

  // ── Per-product Refresh Status ──────────────────────────────────────────────

  const refreshStatus = async (product: Product) => {
    if (!isConnected || !canManage) return;
    setActionError(null);
    setRefreshLoading((prev) => new Set(prev).add(product.id));

    try {
      const res  = await fetch(`/api/admin/products/${product.id}/ebay/refresh-status`, { method: "POST" });
      const json = await res.json().catch(() => ({} as Record<string, unknown>));
      if (!res.ok) {
        const msg = typeof json.error === "string"   ? json.error
                  : typeof json.message === "string" ? json.message
                  : "Refresh failed.";
        setActionError(msg);
      } else {
        const d = (json as { data?: Record<string, unknown> }).data ?? json;
        setProducts((prev) =>
          prev.map((p) =>
            p.id === product.id
              ? {
                  ...p,
                  ebay_status:         (d.ebay_status as EbayStatus)      ?? p.ebay_status,
                  ebay_last_synced_at: (d.ebay_last_synced_at as string)   ?? p.ebay_last_synced_at,
                  ebay_sync_error:     (d.ebay_sync_error as string | null) ?? null,
                  ebay_item_id:        (d.ebay_item_id as string | null)    ?? p.ebay_item_id,
                }
              : p
          )
        );
      }
    } catch {
      setActionError("Network error — refresh failed.");
    } finally {
      setRefreshLoading((prev) => {
        const next = new Set(prev); next.delete(product.id); return next;
      });
    }
  };

  // ── Per-product Update Listing ──────────────────────────────────────────────

  const updateListing = async (product: Product) => {
    if (!isConnected || !isReady || !canManage) return;
    setActionError(null);
    setBulkUpdateResult(null);
    setUpdateLoading((prev) => new Set(prev).add(product.id));

    try {
      const res  = await fetch(`/api/admin/products/${product.id}/ebay/update`, { method: "PATCH" });
      const json = await res.json().catch(() => ({} as Record<string, unknown>));
      if (!res.ok) {
        const msg = typeof json.error === "string"   ? json.error
                  : typeof json.message === "string" ? json.message
                  : "Update failed — check that the product has a public image, valid price, and stock > 0.";
        setActionError(msg);
      } else {
        const d = (json as { data?: Record<string, unknown> }).data ?? json;
        setProducts((prev) =>
          prev.map((p) =>
            p.id === product.id
              ? {
                  ...p,
                  ebay_status:         ((d.ebay_status as EbayStatus) ?? "active"),
                  ebay_last_synced_at: ((d.ebay_last_synced_at as string) ?? new Date().toISOString()),
                  ebay_sync_error:     null,
                }
              : p
          )
        );
        setNotification({ type: "success", message: `"${product.name}" updated on eBay.` });
      }
    } catch {
      setActionError("Network error — update failed.");
    } finally {
      setUpdateLoading((prev) => {
        const next = new Set(prev); next.delete(product.id); return next;
      });
    }
  };

  // ── Bulk list ───────────────────────────────────────────────────────────────

  const handleBulkList = () => {
    if (!isConnected || !isReady || !canManage) return;
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    setBulkProgress({ done: 0, total: ids.length });
    setBulkResult(null);
    setActionError(null);

    startTransition(async () => {
      let succeeded = 0, failed = 0;
      const errors: string[] = [];

      for (const id of ids) {
        try {
          const res  = await fetch(`/api/admin/products/${id}/ebay/list`, { method: "POST" });
          const json = await res.json().catch(() => ({} as Record<string, unknown>));
          if (res.ok) {
            const itemId = typeof json.itemId === "string" ? json.itemId : null;
            succeeded++;
            setProducts((prev) =>
              prev.map((p) =>
                p.id === id
                  ? { ...p, ebay_listed: true, ebay_item_id: itemId ?? p.ebay_item_id, ebay_status: "active", ebay_sync_error: null }
                  : p
              )
            );
          } else {
            failed++;
            const msg = typeof json.error === "string" ? json.error : `Product ${id} failed`;
            errors.push(msg);
          }
        } catch {
          failed++;
          errors.push(`Product ${id}: network error`);
        }
        setBulkProgress((prev) => prev ? { ...prev, done: prev.done + 1 } : null);
      }

      setBulkProgress(null);
      setBulkResult({ succeeded, failed, errors });
      setSelected(new Set());
    });
  };

  // ── Bulk update ─────────────────────────────────────────────────────────────

  const handleBulkUpdate = () => {
    if (!isConnected || !isReady || !canManage) return;
    const ids = Array.from(selectedListed);
    if (ids.length === 0) return;
    setConfirmBulkUpdate(false);
    setBulkUpdateProgress({ done: 0, total: ids.length });
    setBulkUpdateResult(null);
    setActionError(null);

    startTransition(async () => {
      let succeeded = 0, failed = 0;
      const errors: string[] = [];

      for (const id of ids) {
        try {
          const res  = await fetch(`/api/admin/products/${id}/ebay/update`, { method: "PATCH" });
          const json = await res.json().catch(() => ({} as Record<string, unknown>));
          if (res.ok) {
            const d = (json as { data?: Record<string, unknown> }).data ?? json;
            succeeded++;
            setProducts((prev) =>
              prev.map((p) =>
                p.id === id
                  ? {
                      ...p,
                      ebay_status:         ((d.ebay_status as EbayStatus) ?? "active"),
                      ebay_last_synced_at: ((d.ebay_last_synced_at as string) ?? new Date().toISOString()),
                      ebay_sync_error:     null,
                    }
                  : p
              )
            );
          } else {
            failed++;
            const msg = typeof json.error === "string" ? json.error : `Product ${id} failed`;
            errors.push(msg);
          }
        } catch {
          failed++;
          errors.push(`Product ${id}: network error`);
        }
        setBulkUpdateProgress((prev) => prev ? { ...prev, done: prev.done + 1 } : null);
      }

      setBulkUpdateProgress(null);
      setBulkUpdateResult({ succeeded, failed, errors });
      setSelectedListed(new Set());
    });
  };

  // ── Selection helpers — unlisted (bulk list) ────────────────────────────────

  const unlistedProducts    = products.filter((p) => !p.ebay_listed);
  const allUnlistedSelected =
    unlistedProducts.length > 0 && unlistedProducts.every((p) => selected.has(p.id));

  const toggleSelectAll = () => {
    setSelected(allUnlistedSelected ? new Set() : new Set(unlistedProducts.map((p) => p.id)));
  };
  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── Selection helpers — listed (bulk update) ────────────────────────────────

  const listedProducts    = products.filter((p) => p.ebay_listed);
  const allListedSelected =
    listedProducts.length > 0 && listedProducts.every((p) => selectedListed.has(p.id));

  const toggleSelectAllListed = () => {
    setSelectedListed(allListedSelected ? new Set() : new Set(listedProducts.map((p) => p.id)));
  };
  const toggleSelectListed = (id: number) => {
    setSelectedListed((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const headerChecked   = filter === "listed" ? allListedSelected : allUnlistedSelected;
  const toggleHeaderAll = filter === "listed" ? toggleSelectAllListed : toggleSelectAll;

  // ── Computed ────────────────────────────────────────────────────────────────

  const listedCount = products.filter((p) => p.ebay_listed).length;
  const totalCount  = meta.total ?? products.length;
  const lastPage    = meta.last_page ?? 1;

  const handleFilterChange = (val: "all" | "listed" | "unlisted") => {
    setFilter(val);
    setPage(1);
    setSelected(new Set());
    setSelectedListed(new Set());
    void fetchProducts({ filter: val, page: 1 });
  };
  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); void fetchProducts({ page: 1 }); };

  return (
    <div className="p-6 md:p-8">

      {/* ── Confirm per-row update modal ──────────────────────────────────── */}
      {confirmUpdate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-[420px] rounded-2xl bg-white p-8 shadow-2xl">
            <div className="mb-5 flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100">
                <Upload size={18} className="text-blue-600" />
              </div>
              <button
                type="button"
                onClick={() => setConfirmUpdate(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#5c5e62] hover:bg-[#f0f2f5]"
              >
                <X size={16} />
              </button>
            </div>
            <h3 className="text-[1rem] font-extrabold text-[#1a1a1a]">Update eBay Listing?</h3>
            <p className="mt-2 text-[0.875rem] leading-6 text-[#5c5e62]">
              Push the latest price, title, description, and stock for{" "}
              <span className="font-semibold text-[#1a1a1a]">{confirmUpdate.brand} {confirmUpdate.name}</span>{" "}
              ({confirmUpdate.sku}) to eBay?
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmUpdate(null)}
                className="flex h-10 flex-1 items-center justify-center rounded-full border border-black/10 bg-white text-[0.875rem] font-semibold text-[#1a1a1a] transition hover:bg-[#f0f2f5]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => { const p = confirmUpdate; setConfirmUpdate(null); void updateListing(p); }}
                className="flex h-10 flex-1 items-center justify-center rounded-full bg-blue-600 text-[0.875rem] font-semibold text-white transition hover:bg-blue-700"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm bulk update modal ─────────────────────────────────────── */}
      {confirmBulkUpdate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-[420px] rounded-2xl bg-white p-8 shadow-2xl">
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-blue-100">
              <Upload size={18} className="text-blue-600" />
            </div>
            <h3 className="text-[1rem] font-extrabold text-[#1a1a1a]">Update {selectedListed.size} Listing{selectedListed.size !== 1 ? "s" : ""}?</h3>
            <p className="mt-2 text-[0.875rem] leading-6 text-[#5c5e62]">
              Push the latest price, title, description, and stock for{" "}
              <span className="font-semibold text-[#1a1a1a]">{selectedListed.size} selected listing{selectedListed.size !== 1 ? "s" : ""}</span> to eBay?
              Products with missing images or invalid prices will fail individually — other updates will continue.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmBulkUpdate(false)}
                className="flex h-10 flex-1 items-center justify-center rounded-full border border-black/10 bg-white text-[0.875rem] font-semibold text-[#1a1a1a] transition hover:bg-[#f0f2f5]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkUpdate}
                className="flex h-10 flex-1 items-center justify-center rounded-full bg-blue-600 text-[0.875rem] font-semibold text-white transition hover:bg-blue-700"
              >
                Update All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-[0.75rem] font-bold uppercase tracking-[0.18em] text-[#E85C1A]">Sales Channels · eBay</p>
          <p className="mt-1 text-[0.875rem] text-[#5c5e62]">Manage product listings and sync buyer orders from eBay.</p>
        </div>
        <a
          href="https://www.ebay.de/sh/ovw"
          target="_blank"
          rel="noopener noreferrer"
          className="flex shrink-0 items-center gap-1.5 rounded-xl border border-black/[0.09] bg-white px-3.5 py-2 text-[0.8rem] font-semibold text-[#1a1a1a] transition hover:bg-[#f0f2f5]"
        >
          <ExternalLink size={13} strokeWidth={2} />
          Seller Hub
        </a>
      </div>

      {/* Page-level tab switcher */}
      <div className="mb-6 flex gap-1.5">
        {(["products", "orders"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setPageTab(tab)}
            className={[
              "h-9 rounded-xl px-4 text-[0.83rem] font-semibold capitalize transition",
              pageTab === tab
                ? "bg-[#1a1a1a] text-white"
                : "border border-black/[0.09] bg-white text-[#5c5e62] hover:text-[#1a1a1a]",
            ].join(" ")}
          >
            {tab === "products" ? "Product Listings" : "eBay Orders"}
          </button>
        ))}
      </div>

      {/* ── Orders tab ── */}
      {pageTab === "orders" && <EbayOrdersPanel canManage={canManage} />}

      {/* ── Products tab ── */}
      {pageTab === "products" && <>

      {/* Notification banner */}
      {notification && (
        <div
          className={[
            "mb-5 flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-[0.83rem] font-semibold",
            notification.type === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-700",
          ].join(" ")}
        >
          <span className="flex items-center gap-2">
            {notification.type === "success"
              ? <CheckCircle2 size={15} className="shrink-0" />
              : <AlertCircle  size={15} className="shrink-0" />}
            {notification.message}
          </span>
          <button type="button" onClick={() => setNotification(null)} className="shrink-0"><X size={14} /></button>
        </div>
      )}

      {/* Connection status card */}
      <ConnectionCard
        status={connStatus}
        loading={connLoading}
        onConnect={() => void handleConnect()}
        onDisconnect={() => void handleDisconnect()}
        connectLoading={connectLoading}
        disconnectLoading={disconnectLoading}
        canManage={canManage}
      />

      {/* Setup & Readiness panel */}
      <ReadinessPanel
        readiness={readiness}
        loading={readinessLoading}
        testLoading={testLoading}
        testResult={testResult}
        onTest={() => void handleTestConnection()}
        canManage={canManage}
      />

      {/* Stat cards */}
      <StatCards
        listedCount={listedCount}
        totalCount={totalCount}
        ebayCount={syncData ? syncData.activeCount : null}
        syncing={syncing}
        syncedAt={syncData?.syncedAt}
      />

      {/* Error banners */}
      {error && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[0.83rem] text-red-700">
          <AlertCircle size={15} className="shrink-0" />
          {error}
        </div>
      )}
      {actionError && (
        <div className="mb-4 flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[0.83rem] text-red-700">
          <span className="flex items-start gap-2">
            <AlertCircle size={15} className="mt-0.5 shrink-0" />
            {actionError}
          </span>
          <button type="button" onClick={() => setActionError(null)} className="shrink-0"><X size={14} /></button>
        </div>
      )}

      {/* Bulk list result */}
      {bulkResult && (
        <div
          className={[
            "mb-4 flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-[0.83rem]",
            bulkResult.failed > 0
              ? "border-amber-200 bg-amber-50 text-amber-800"
              : "border-green-200 bg-green-50 text-green-800",
          ].join(" ")}
        >
          <div>
            <p className="font-semibold">
              Bulk listing complete — {bulkResult.succeeded} listed{bulkResult.failed > 0 && `, ${bulkResult.failed} failed`}.
            </p>
            {bulkResult.errors.slice(0, 3).map((e, i) => (
              <p key={i} className="mt-0.5 text-[0.78rem] opacity-80">{e}</p>
            ))}
          </div>
          <button type="button" onClick={() => setBulkResult(null)} className="shrink-0"><X size={14} /></button>
        </div>
      )}

      {/* Bulk update result */}
      {bulkUpdateResult && (
        <div
          className={[
            "mb-4 flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-[0.83rem]",
            bulkUpdateResult.failed > 0
              ? "border-amber-200 bg-amber-50 text-amber-800"
              : "border-blue-200 bg-blue-50 text-blue-800",
          ].join(" ")}
        >
          <div>
            <p className="font-semibold">
              Bulk update complete — {bulkUpdateResult.succeeded} updated{bulkUpdateResult.failed > 0 && `, ${bulkUpdateResult.failed} failed`}.
            </p>
            {bulkUpdateResult.errors.slice(0, 3).map((e, i) => (
              <p key={i} className="mt-0.5 text-[0.78rem] opacity-80">{e}</p>
            ))}
          </div>
          <button type="button" onClick={() => setBulkUpdateResult(null)} className="shrink-0"><X size={14} /></button>
        </div>
      )}

      {/* Bulk list progress */}
      {bulkProgress && (
        <div className="mb-4 overflow-hidden rounded-xl border border-green-200 bg-green-50 px-4 py-3">
          <div className="mb-2 flex items-center justify-between text-[0.83rem] font-semibold text-green-800">
            <span>Listing products on eBay…</span>
            <span>{bulkProgress.done} / {bulkProgress.total}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-green-200">
            <div
              className="h-full rounded-full bg-green-500 transition-all duration-300"
              style={{ width: `${Math.round((bulkProgress.done / bulkProgress.total) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Bulk update progress */}
      {bulkUpdateProgress && (
        <div className="mb-4 overflow-hidden rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
          <div className="mb-2 flex items-center justify-between text-[0.83rem] font-semibold text-blue-800">
            <span>Updating listings on eBay…</span>
            <span>{bulkUpdateProgress.done} / {bulkUpdateProgress.total}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-blue-200">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-300"
              style={{ width: `${Math.round((bulkUpdateProgress.done / bulkUpdateProgress.total) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Bulk list action bar */}
      {selected.size > 0 && !bulkProgress && isConnected && isReady && canManage && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-4 py-3">
          <p className="text-[0.83rem] font-semibold text-green-800">
            {selected.size} unlisted product{selected.size > 1 ? "s" : ""} selected
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBulkList}
              className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3.5 py-1.5 text-[0.8rem] font-semibold text-white transition hover:bg-green-700"
            >
              <ShoppingBag size={13} strokeWidth={2} />
              List on eBay
            </button>
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="text-[0.78rem] font-semibold text-green-700 underline hover:text-green-900"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Bulk update action bar */}
      {selectedListed.size > 0 && !bulkUpdateProgress && isConnected && isReady && canManage && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
          <p className="text-[0.83rem] font-semibold text-blue-800">
            {selectedListed.size} listed product{selectedListed.size > 1 ? "s" : ""} selected
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setConfirmBulkUpdate(true)}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-[0.8rem] font-semibold text-white transition hover:bg-blue-700"
            >
              <Upload size={13} strokeWidth={2} />
              Update Selected Listings
            </button>
            <button
              type="button"
              onClick={() => setSelectedListed(new Set())}
              className="text-[0.78rem] font-semibold text-blue-700 underline hover:text-blue-900"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Not connected warning */}
      {!isConnected && !connLoading && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[0.83rem] text-amber-800">
          <AlertTriangle size={15} className="shrink-0" />
          Connect your eBay seller account above to enable listing and sync.
        </div>
      )}

      {/* Setup incomplete warning — only shown when readiness data is available and has failures */}
      {readiness !== null && !isReady && !readinessLoading && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[0.83rem] text-red-700">
          <AlertCircle size={15} className="shrink-0" />
          Complete eBay setup before listing products. See the Setup &amp; Readiness checklist above.
        </div>
      )}

      {/* Search + filter */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <form onSubmit={handleSearch} className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5c5e62]" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by SKU, brand, name…"
              className="h-10 w-full rounded-xl border border-black/[0.09] bg-white pl-9 pr-4 text-[0.875rem] text-[#1a1a1a] outline-none placeholder:text-[#aaa] transition focus:border-[#E85C1A] focus:ring-2 focus:ring-[#E85C1A]/10"
            />
          </div>
          <button type="submit" className="h-10 rounded-xl bg-[#1a1a1a] px-4 text-[0.875rem] font-semibold text-white transition hover:bg-[#333]">
            Search
          </button>
        </form>
        <div className="flex gap-1.5">
          {(["all", "listed", "unlisted"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => handleFilterChange(f)}
              className={[
                "h-10 rounded-xl px-3.5 text-[0.8rem] font-semibold capitalize transition",
                filter === f
                  ? "bg-[#E85C1A] text-white"
                  : "border border-black/[0.09] bg-white text-[#5c5e62] hover:border-[#E85C1A] hover:text-[#E85C1A]",
              ].join(" ")}
            >
              {f === "all" ? "All" : f === "listed" ? "eBay Live" : "Not Listed"}
            </button>
          ))}
          <button
            type="button"
            onClick={() => void fetchProducts()}
            title="Refresh"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/[0.09] bg-white text-[#5c5e62] transition hover:text-[#1a1a1a]"
          >
            <RefreshCw size={14} strokeWidth={2} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left">
            <thead>
              <tr className="border-b border-black/[0.06] bg-[#fafafa]">
                <th className="px-4 py-3">
                  <button
                    type="button"
                    onClick={toggleHeaderAll}
                    disabled={!isConnected || !isReady || !canManage}
                    title={filter === "listed" ? "Select all listed" : "Select all unlisted"}
                    className="text-[#5c5e62] hover:text-[#1a1a1a] disabled:cursor-default"
                  >
                    {headerChecked
                      ? <CheckSquare size={15} strokeWidth={2} className="text-[#E85C1A]" />
                      : <Square      size={15} strokeWidth={1.8} />}
                  </button>
                </th>
                {["SKU / Name", "Brand", "Size", "Price", "eBay Status", "Last Synced", "Listing ID", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-[0.7rem] font-bold uppercase tracking-[0.12em] text-[#5c5e62]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {loading ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center"><Loader2 size={20} className="mx-auto animate-spin text-[#5c5e62]" /></td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-[0.875rem] text-[#5c5e62]">No products found.</td></tr>
              ) : (
                products.map((product) => {
                  const isActing     = actionLoading.has(product.id);
                  const isRefreshing = refreshLoading.has(product.id);
                  const isUpdating   = updateLoading.has(product.id);
                  const busy         = isActing || isRefreshing || isUpdating;
                  const hasError     = product.ebay_status === "error" && product.ebay_sync_error;
                  const stale        = product.ebay_listed && isStale(product);

                  return (
                    <tr key={product.id} className="group transition hover:bg-[#fafafa]">

                      {/* Checkbox */}
                      <td className="px-4 py-3">
                        {isConnected && isReady && canManage && (
                          product.ebay_listed ? (
                            <button
                              type="button"
                              onClick={() => toggleSelectListed(product.id)}
                              className="text-[#5c5e62] hover:text-blue-600"
                              title="Select for bulk update"
                            >
                              {selectedListed.has(product.id)
                                ? <CheckSquare size={15} strokeWidth={2} className="text-blue-500" />
                                : <Square      size={15} strokeWidth={1.8} />}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => toggleSelect(product.id)}
                              className="text-[#5c5e62] hover:text-[#E85C1A]"
                              title="Select for bulk list"
                            >
                              {selected.has(product.id)
                                ? <CheckSquare size={15} strokeWidth={2} className="text-[#E85C1A]" />
                                : <Square      size={15} strokeWidth={1.8} />}
                            </button>
                          )
                        )}
                      </td>

                      {/* Name + SKU */}
                      <td className="px-4 py-3">
                        <p className="text-[0.82rem] font-extrabold text-[#1a1a1a]">{product.name}</p>
                        <p className="text-[0.73rem] font-mono text-[#5c5e62]">{product.sku}</p>
                      </td>

                      {/* Brand */}
                      <td className="px-4 py-3 text-[0.875rem] text-[#1a1a1a]">{product.brand}</td>

                      {/* Size */}
                      <td className="px-4 py-3 text-[0.875rem] text-[#5c5e62]">{product.size}</td>

                      {/* Price */}
                      <td className="px-4 py-3 text-[0.875rem] font-semibold text-[#1a1a1a]">
                        €{Number(product.price).toFixed(2)}
                      </td>

                      {/* eBay Status */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          {product.ebay_listed ? (
                            <EbayBadge itemId={product.ebay_item_id} />
                          ) : (
                            <span className="text-[0.72rem] text-[#aaa]">Not listed</span>
                          )}
                          {product.ebay_status && (
                            <EbayStatusBadge status={product.ebay_status} />
                          )}
                          {stale && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[0.65rem] font-bold text-amber-700">
                              <Clock size={9} strokeWidth={2.5} />
                              Needs update
                            </span>
                          )}
                          {hasError && (
                            <p className="max-w-[180px] truncate text-[0.68rem] text-red-500" title={product.ebay_sync_error ?? ""}>
                              {product.ebay_sync_error}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Last Synced */}
                      <td className="whitespace-nowrap px-4 py-3 text-[0.73rem] text-[#5c5e62]">
                        {fmtSynced(product.ebay_last_synced_at)}
                      </td>

                      {/* Listing ID */}
                      <td className="px-4 py-3">
                        {product.ebay_item_id ? (
                          <a
                            href={`https://www.ebay.de/itm/${product.ebay_item_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 font-mono text-[0.72rem] text-blue-600 underline hover:text-blue-800"
                          >
                            {product.ebay_item_id}
                            <ExternalLink size={9} strokeWidth={2} />
                          </a>
                        ) : (
                          <span className="text-[0.72rem] text-[#ccc]">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">

                          {/* List / Remove */}
                          <button
                            type="button"
                            onClick={() => void toggleEbay(product)}
                            disabled={busy || !isConnected || !isReady || !canManage}
                            title={
                              !isConnected ? "Connect eBay account first"
                              : !isReady   ? "Complete eBay setup first"
                              : !canManage ? "Insufficient permissions"
                              : undefined
                            }
                            className={[
                              "flex h-8 min-w-[76px] items-center justify-center gap-1.5 rounded-lg px-3 text-[0.78rem] font-semibold transition disabled:opacity-40",
                              product.ebay_listed
                                ? "bg-red-50 text-red-600 hover:bg-red-100"
                                : "bg-green-50 text-green-700 hover:bg-green-100",
                            ].join(" ")}
                          >
                            {isActing ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : product.ebay_listed ? (
                              <><XCircle size={12} strokeWidth={2} /> Remove</>
                            ) : (
                              <><ShoppingBag size={12} strokeWidth={2} /> List</>
                            )}
                          </button>

                          {/* Update Listing */}
                          {product.ebay_listed && canManage && (
                            <button
                              type="button"
                              onClick={() => setConfirmUpdate(product)}
                              disabled={busy || !isConnected || !isReady}
                              title={
                                !isConnected ? "Connect eBay account first"
                                : !isReady   ? "Complete eBay setup first"
                                : "Update price, title, description and stock on eBay"
                              }
                              className={[
                                "flex h-8 w-8 items-center justify-center rounded-lg border transition disabled:opacity-40",
                                stale
                                  ? "border-amber-300 bg-amber-50 text-amber-600 hover:bg-amber-100"
                                  : "border-black/[0.09] bg-white text-[#5c5e62] hover:border-blue-300 hover:text-blue-600",
                              ].join(" ")}
                            >
                              {isUpdating
                                ? <Loader2 size={13} className="animate-spin" />
                                : <Upload  size={13} strokeWidth={2} />}
                            </button>
                          )}

                          {/* Refresh Status */}
                          {product.ebay_listed && canManage && (
                            <button
                              type="button"
                              onClick={() => void refreshStatus(product)}
                              disabled={busy || !isConnected}
                              title="Refresh eBay status"
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/[0.09] bg-white text-[#5c5e62] transition hover:border-sky-300 hover:text-sky-600 disabled:opacity-40"
                            >
                              {isRefreshing
                                ? <Loader2   size={13} className="animate-spin" />
                                : <RotateCcw size={13} strokeWidth={2} />}
                            </button>
                          )}

                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {lastPage > 1 && (
          <div className="flex items-center justify-between border-t border-black/[0.06] px-5 py-3">
            <p className="text-[0.78rem] text-[#5c5e62]">
              Page {page} of {lastPage}{typeof meta.total === "number" && ` · ${meta.total} products`}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => { setPage(page - 1); void fetchProducts({ page: page - 1 }); }}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/[0.09] bg-white text-[#1a1a1a] transition hover:border-[#E85C1A] hover:text-[#E85C1A] disabled:pointer-events-none disabled:bg-[#f5f5f5] disabled:text-[#ccc]"
              >‹</button>
              <button
                type="button"
                disabled={page >= lastPage}
                onClick={() => { setPage(page + 1); void fetchProducts({ page: page + 1 }); }}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/[0.09] bg-white text-[#1a1a1a] transition hover:border-[#E85C1A] hover:text-[#E85C1A] disabled:pointer-events-none disabled:bg-[#f5f5f5] disabled:text-[#ccc]"
              >›</button>
            </div>
          </div>
        )}
      </div>

      {/* Sync info */}
      {syncData && !syncing && (
        <div className="mt-4 flex items-center gap-2 text-[0.75rem] text-[#5c5e62]">
          <Clock size={12} />
          Last synced from eBay at {new Date(syncData.syncedAt ?? "").toLocaleTimeString()}
          · {syncData.activeCount} active listing{syncData.activeCount !== 1 ? "s" : ""}
        </div>
      )}

      {/* eBay Logs Panel */}
      <EbayLogsPanel canManage={canManage} />

      </> /* end products tab */}
    </div>
  );
}
