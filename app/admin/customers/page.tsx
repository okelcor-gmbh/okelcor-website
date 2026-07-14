"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Upload, Search, ChevronLeft, ChevronRight, Download,
  FileText, AlertCircle, CheckCircle2, Loader2, Send,
  Eye, Ban, Trash2, ShieldOff, ShieldCheck, UserCheck, UserX, UserPlus,
  Copy, Plus,
} from "lucide-react";
import { BUYER_TIER_STYLES, BUYER_TIER_LABELS, RISK_LEVEL_STYLES, RISK_LEVEL_LABELS } from "@/lib/crm8";
import { useAdminPermissions } from "@/hooks/use-admin-permissions";
import AddCustomerModal from "@/components/admin/add-customer-modal";

// ── Types ─────────────────────────────────────────────────────────────────────

type CustomerStatus = "active" | "suspended" | "banned" | "locked";
type OnboardingStatus = "pending_review" | "approved" | "invited" | "active" | "rejected" | "blocked";
type CustomerAccessLevel = "inquiry_only" | "quote_only" | "approved_buyer" | "wholesale_buyer" | "restricted" | "blocked";

type Customer = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  customer_type: "b2b" | "b2c";
  company_name?: string;
  country?: string;
  phone?: string;
  created_at: string;
  source?: string;
  // extended fields (backend may not return yet)
  status?: CustomerStatus;
  onboarding_status?: OnboardingStatus;
  // CRM-4 segmentation
  customer_segment?: string;
  access_level?: CustomerAccessLevel | string;
  approved_for_checkout?: boolean;
  approved_for_documents?: boolean;
  // CRM-5 data quality
  data_quality_score?: number | null;
  data_review_status?: string;
  // CRM-8 buyer lifecycle
  buyer_tier?: string | null;
  risk_level?: string | null;
  last_login_at?: string | null;
  last_login_location?: string | null;
  failed_login_count?: number;
};

type ImportResult = {
  imported: number; skipped_no_email: number; skipped_duplicate: number;
  b2b: number; b2c: number; errors?: { row: number; message: string }[];
};
type StatusFilter = "all" | "active" | "suspended" | "banned" | "locked" | "new_this_week" | "pending_review" | "duplicate_suspected";
type TypeFilter   = "all" | "b2b" | "b2c" | "wix";

const PER_PAGE = 50;

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string, short = false): string {
  try {
    return new Intl.DateTimeFormat("en-GB", short
      ? { day: "2-digit", month: "short" }
      : { dateStyle: "medium" }
    ).format(new Date(iso));
  } catch { return iso; }
}

function fullName(c: Customer) {
  return [c.first_name, c.last_name].filter(Boolean).join(" ") || "—";
}

function resolvedStatus(c: Customer): CustomerStatus {
  return c.status ?? "active";
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: CustomerStatus }) {
  const map: Record<CustomerStatus, string> = {
    active:    "bg-emerald-100 text-emerald-700",
    suspended: "bg-amber-100 text-amber-700",
    banned:    "bg-red-100 text-red-700",
    locked:    "bg-gray-200 text-gray-600",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.67rem] font-bold capitalize ${map[status]}`}>
      {status}
    </span>
  );
}

function TypeBadge({ type }: { type: "b2b" | "b2c" }) {
  return type === "b2b" ? (
    <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[0.67rem] font-bold text-blue-700">B2B</span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[0.67rem] font-bold text-gray-500">B2C</span>
  );
}

function OnboardingBadge({ status }: { status: OnboardingStatus }) {
  const map: Record<OnboardingStatus, string> = {
    pending_review: "bg-amber-100 text-amber-700",
    approved:       "bg-blue-100 text-blue-700",
    invited:        "bg-purple-100 text-purple-700",
    active:         "bg-emerald-100 text-emerald-700",
    rejected:       "bg-red-100 text-red-700",
    blocked:        "bg-gray-200 text-gray-600",
  };
  const label: Record<OnboardingStatus, string> = {
    pending_review: "Pending Review",
    approved:       "Approved",
    invited:        "Invited",
    active:         "Active",
    rejected:       "Rejected",
    blocked:        "Blocked",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.67rem] font-bold ${map[status]}`}>
      {label[status]}
    </span>
  );
}

const ACCESS_LEVEL_STYLES: Record<string, string> = {
  inquiry_only:     "bg-gray-100 text-gray-500",
  quote_only:       "bg-blue-100 text-blue-600",
  approved_buyer:   "bg-emerald-100 text-emerald-700",
  wholesale_buyer:  "bg-teal-100 text-teal-700",
  restricted:       "bg-amber-100 text-amber-700",
  blocked:          "bg-red-100 text-red-700",
};
const ACCESS_LEVEL_LABELS: Record<string, string> = {
  inquiry_only:    "Inquiry Only",
  quote_only:      "Quote Only",
  approved_buyer:  "Approved Buyer",
  wholesale_buyer: "Wholesale",
  restricted:      "Restricted",
  blocked:         "Blocked",
};

function AccessLevelBadge({ level }: { level?: string | null }) {
  if (!level) return null;
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.63rem] font-bold ${ACCESS_LEVEL_STYLES[level] ?? "bg-gray-100 text-gray-500"}`}>
      {ACCESS_LEVEL_LABELS[level] ?? level.replace(/_/g, " ")}
    </span>
  );
}

function SegmentBadge({ segment }: { segment?: string | null }) {
  if (!segment || segment === "unknown") return null;
  return (
    <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[0.63rem] font-bold capitalize text-indigo-600">
      {segment.replace(/_/g, " ")}
    </span>
  );
}

function PermissionDots({ checkout, documents }: { checkout?: boolean; documents?: boolean }) {
  if (checkout === undefined && documents === undefined) return null;
  return (
    <div className="flex items-center gap-1 mt-0.5">
      {checkout !== undefined && (
        <span title={`Checkout: ${checkout ? "allowed" : "blocked"}`}
          className={`h-2 w-2 rounded-full ${checkout ? "bg-emerald-400" : "bg-red-400"}`} />
      )}
      {documents !== undefined && (
        <span title={`Documents: ${documents ? "allowed" : "blocked"}`}
          className={`h-2 w-2 rounded-full ${documents ? "bg-emerald-400" : "bg-red-400"}`} />
      )}
    </div>
  );
}

function DataQualityBadge({ score, reviewStatus }: { score?: number | null; reviewStatus?: string }) {
  if (score == null && !reviewStatus) return null;
  const isDuplicate = reviewStatus === "duplicate_suspected";
  const scoreColor =
    score == null ? "" :
    score >= 80 ? "text-emerald-700 bg-emerald-50 border-emerald-200" :
    score >= 50 ? "text-amber-700 bg-amber-50 border-amber-200" :
    "text-red-700 bg-red-50 border-red-200";
  return (
    <div className="mt-0.5 flex items-center gap-1">
      {score != null && (
        <span className={`inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[0.62rem] font-bold ${scoreColor}`}>
          Q{score}
        </span>
      )}
      {isDuplicate && (
        <span title="Possible duplicate" className="inline-flex items-center rounded border border-amber-200 bg-amber-50 px-1 py-0.5 text-amber-600">
          <Copy size={9} strokeWidth={2.5} />
        </span>
      )}
    </div>
  );
}

function BuyerTierBadge({ tier }: { tier?: string | null }) {
  if (!tier || tier === "none") return null;
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.63rem] font-bold ${BUYER_TIER_STYLES[tier] ?? "bg-gray-100 text-gray-500"}`}>
      {BUYER_TIER_LABELS[tier] ?? tier}
    </span>
  );
}

function RiskLevelBadge({ risk }: { risk?: string | null }) {
  if (!risk || risk === "low" || risk === "unknown") return null;
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.63rem] font-bold ${RISK_LEVEL_STYLES[risk] ?? "bg-gray-100 text-gray-500"}`}>
      {RISK_LEVEL_LABELS[risk] ?? risk}
    </span>
  );
}

// ── Action modal ──────────────────────────────────────────────────────────────

function ConfirmModal({
  title, body, confirmLabel, danger = false,
  onConfirm, onCancel,
}: {
  title: string; body: string; confirmLabel: string;
  danger?: boolean; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-7 shadow-2xl">
        <p className="text-[1rem] font-extrabold text-[#1a1a1a]">{title}</p>
        <p className="mt-2 text-[0.83rem] leading-relaxed text-[#5c5e62]">{body}</p>
        <div className="mt-6 flex gap-3">
          <button type="button" onClick={onCancel}
            className="flex-1 h-10 rounded-xl border border-black/[0.1] text-[0.83rem] font-semibold text-[#5c5e62] transition hover:bg-[#f0f2f5]">
            Cancel
          </button>
          <button type="button" onClick={onConfirm}
            className={`flex-1 h-10 rounded-xl text-[0.83rem] font-semibold text-white transition ${danger ? "bg-red-600 hover:bg-red-700" : "bg-[#E85C1A] hover:bg-[#d44d10]"}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CustomersPage() {
  const router = useRouter();
  const { can } = useAdminPermissions();

  // ── Add-customer modal ────────────────────────────────────────────────────
  const [addOpen, setAddOpen] = useState(false);

  // ── Import state ─────────────────────────────────────────────────────────
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile]               = useState<File | null>(null);
  const [importing, setImporting]     = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  // ── Table state ──────────────────────────────────────────────────────────
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [statusTab, setStatusTab] = useState<StatusFilter>("all");
  const [typeTab, setTypeTab]     = useState<TypeFilter>("all");
  const [search, setSearch]       = useState("");
  const [debSearch, setDebSearch] = useState("");
  const [loading, setLoading]     = useState(true);
  const [tableError, setTableError] = useState<string | null>(null);

  // ── Inline action state ───────────────────────────────────────────────────
  const [actionPending, setActionPending] = useState<number | null>(null);
  const [pendingAction, setPendingAction] = useState<
    { customerId: number; type: "suspend" | "ban" | "delete" } | null
  >(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(1); }, [statusTab, typeTab, debSearch]);

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setTableError(null);
    const p = new URLSearchParams({ per_page: String(PER_PAGE), page: String(page) });
    if (debSearch)                          p.set("search", debSearch);
    if (typeTab === "b2b")                  p.set("customer_type", "b2b");
    if (typeTab === "b2c")                  p.set("customer_type", "b2c");
    if (typeTab === "wix")                  p.set("source", "wix");
    if (statusTab === "pending_review")       p.set("onboarding_status", "pending_review");
    else if (statusTab === "duplicate_suspected") p.set("data_review_status", "duplicate_suspected");
    else if (statusTab !== "all")           p.set("status", statusTab);

    try {
      const res = await fetch(`/api/admin/customers?${p}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) { setTableError(json.error ?? `Error ${res.status}`); return; }
      setCustomers(Array.isArray(json.data) ? json.data : []);
      setTotal(json.meta?.total ?? 0);
    } catch {
      setTableError("Could not load customers.");
    } finally {
      setLoading(false);
    }
  }, [page, statusTab, typeTab, debSearch]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  // ── Import ────────────────────────────────────────────────────────────────

  const handleImport = async () => {
    if (!file) return;
    setImporting(true); setImportError(null); setImportResult(null);
    const form = new FormData(); form.append("file", file);
    try {
      const res = await fetch("/api/admin/customers/import", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) { setImportError(json.error ?? json.message ?? "Import failed."); }
      else { setImportResult(json.data ?? json); setFile(null); if (fileRef.current) fileRef.current.value = ""; fetchCustomers(); }
    } catch { setImportError("Network error."); } finally { setImporting(false); }
  };

  // ── Inline actions ────────────────────────────────────────────────────────

  async function doAction(customerId: number, action: "suspend" | "ban" | "activate" | "delete" | "approve" | "reject" | "invite" | "block" | "resend_invite") {
    setActionPending(customerId);
    try {
      if (action === "delete") {
        const res = await fetch(`/api/admin/customers/${customerId}`, { method: "DELETE" });
        if (res.ok) {
          setCustomers(prev => prev.filter(c => c.id !== customerId));
          setTotal(t => Math.max(0, t - 1));
        }
      } else {
        const res = await fetch(`/api/admin/customers/${customerId}/actions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        });
        if (res.ok) {
          // Update local row state based on action
          setCustomers(prev => prev.map(c => {
            if (c.id !== customerId) return c;
            if (action === "suspend") return { ...c, status: "suspended" as CustomerStatus };
            if (action === "ban" || action === "block") return { ...c, status: "banned" as CustomerStatus, onboarding_status: "blocked" as OnboardingStatus };
            if (action === "activate") return { ...c, status: "active" as CustomerStatus };
            if (action === "approve") return { ...c, onboarding_status: "approved" as OnboardingStatus };
            if (action === "reject") return { ...c, onboarding_status: "rejected" as OnboardingStatus };
            if (action === "invite") return { ...c, onboarding_status: "invited" as OnboardingStatus };
            return c;
          }));
        }
      }
    } catch { /* silent — row stays unchanged */ } finally {
      setActionPending(null);
      setPendingAction(null);
    }
  }

  // ── CSV export ────────────────────────────────────────────────────────────

  function handleExport() {
    const p = new URLSearchParams();
    if (statusTab !== "all") p.set("status", statusTab);
    const url = `/api/admin/customers/export?${p}`;
    const a = document.createElement("a"); a.href = url; a.click();
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const totalPages = Math.ceil(total / PER_PAGE);

  const STATUS_TABS: { key: StatusFilter; label: string }[] = [
    { key: "all",            label: "All" },
    { key: "pending_review", label: "Pending Review" },
    { key: "active",         label: "Active" },
    { key: "suspended",      label: "Suspended" },
    { key: "banned",         label: "Banned" },
    { key: "locked",         label: "Locked" },
    { key: "new_this_week",  label: "New This Week" },
    { key: "duplicate_suspected" as StatusFilter, label: "Duplicates" },
  ];

  const TYPE_TABS: { key: TypeFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "b2b", label: "B2B" },
    { key: "b2c", label: "B2C" },
    { key: "wix", label: "Wix" },
  ];

  return (
    <div className="p-6 md:p-8">

      {/* Page header */}
      <div className="mb-7 flex items-start justify-between gap-4">
        <div>
          <p className="text-[0.75rem] font-bold uppercase tracking-[0.18em] text-[#E85C1A]">Customer Management</p>
          <p className="mt-1 text-[0.875rem] text-[#5c5e62]">Manage accounts, review status, and monitor security.</p>
        </div>
        {can("customers.create") && (
          <button type="button" onClick={() => setAddOpen(true)}
            className="flex h-[42px] shrink-0 items-center gap-2 rounded-full bg-[#E85C1A] px-5 text-[0.875rem] font-semibold text-white transition hover:bg-[#d44d10]">
            <Plus size={16} /> Add Customer
          </button>
        )}
      </div>

      {/* Add-customer modal */}
      {addOpen && (
        <AddCustomerModal
          onClose={() => setAddOpen(false)}
          onCreated={() => { setAddOpen(false); setPage(1); fetchCustomers(); }}
        />
      )}

      {/* ── Import card ── */}
      <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E85C1A]">
            <FileText size={18} strokeWidth={1.8} className="text-white" />
          </div>
          <div>
            <p className="font-extrabold text-[#1a1a1a]">Import Customers from Wix</p>
            <p className="mt-0.5 text-[0.83rem] text-[#5c5e62]">Upload a Wix contacts CSV. B2B/B2C is detected automatically.</p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="flex flex-1 cursor-pointer items-center gap-3 rounded-xl border border-dashed border-black/[0.12] bg-[#fafafa] px-4 py-3 transition hover:border-[#E85C1A]/40 hover:bg-orange-50/30">
            <Upload size={16} className="shrink-0 text-[#5c5e62]" />
            <span className="truncate text-[0.875rem] text-[#5c5e62]">{file ? file.name : "Choose a .csv file…"}</span>
            <input ref={fileRef} type="file" accept=".csv" className="hidden"
              onChange={e => { setFile(e.target.files?.[0] ?? null); setImportResult(null); setImportError(null); }} />
          </label>
          <button type="button" disabled={!file || importing} onClick={handleImport}
            className="flex h-[42px] items-center gap-2 rounded-full bg-[#E85C1A] px-6 text-[0.875rem] font-semibold text-white transition hover:bg-[#d44d10] disabled:cursor-not-allowed disabled:opacity-50">
            {importing ? <><Loader2 size={15} className="animate-spin" /> Importing…</> : <><Upload size={15} /> Import</>}
          </button>
        </div>
        {importError && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5">
            <AlertCircle size={14} className="shrink-0 text-red-500" /><p className="text-[0.83rem] text-red-700">{importError}</p>
          </div>
        )}
        {importResult && (
          <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="mb-3 flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-600" /><p className="text-[0.875rem] font-semibold text-emerald-800">Import complete</p></div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {[["Imported", importResult.imported], ["Skip no email", importResult.skipped_no_email], ["Skip duplicate", importResult.skipped_duplicate], ["B2B", importResult.b2b], ["B2C", importResult.b2c]].map(([l, v]) => (
                <div key={String(l)} className="rounded-lg bg-white px-3 py-2 text-center shadow-sm">
                  <p className="text-[1rem] font-extrabold">{v}</p><p className="text-[0.68rem] text-[#5c5e62]">{l}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Inline action confirm modal */}
      {pendingAction && (
        <ConfirmModal
          title={pendingAction.type === "delete" ? "Delete customer?" : pendingAction.type === "ban" ? "Ban this account?" : "Suspend this account?"}
          body={pendingAction.type === "delete"
            ? "This permanently deletes the customer and all their data. This cannot be undone."
            : pendingAction.type === "ban"
            ? "The account will be permanently banned. All active sessions will be invalidated immediately."
            : "The account will be suspended. The customer will see a suspension notice when they try to log in."}
          confirmLabel={pendingAction.type === "delete" ? "Delete" : pendingAction.type === "ban" ? "Ban Account" : "Suspend Account"}
          danger={pendingAction.type === "delete" || pendingAction.type === "ban"}
          onCancel={() => setPendingAction(null)}
          onConfirm={() => doAction(pendingAction.customerId, pendingAction.type)}
        />
      )}

      {/* ── Customers table ── */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">

        {/* Filters row */}
        <div className="border-b border-black/[0.06] px-5 py-3">
          {/* Status tabs */}
          <div className="mb-2.5 flex flex-wrap gap-1">
            {STATUS_TABS.map(({ key, label }) => (
              <button key={key} type="button" onClick={() => setStatusTab(key)}
                className={`rounded-full px-3 py-1 text-[0.75rem] font-semibold transition ${statusTab === key ? "bg-[#E85C1A] text-white" : "text-[#5c5e62] hover:bg-[#f0f2f5]"}`}>
                {label}
              </button>
            ))}
          </div>
          {/* Type + search row */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-1">
              {TYPE_TABS.map(({ key, label }) => (
                <button key={key} type="button" onClick={() => setTypeTab(key)}
                  className={`rounded-lg px-2.5 py-1 text-[0.72rem] font-semibold transition ${typeTab === key ? "bg-[#1a1a1a] text-white" : "text-[#9ca3af] hover:bg-[#f0f2f5] hover:text-[#1a1a1a]"}`}>
                  {label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#aaa]" />
                <input type="search" placeholder="Name, email, company…" value={search} onChange={e => setSearch(e.target.value)}
                  className="h-8 w-60 rounded-xl border border-black/[0.09] bg-[#fafafa] pl-8 pr-3 text-[0.8rem] text-[#1a1a1a] outline-none placeholder:text-[#aaa] focus:border-[#E85C1A] focus:ring-2 focus:ring-[#E85C1A]/10" />
              </div>
              <button type="button" onClick={handleExport}
                className="flex h-8 items-center gap-1.5 rounded-xl border border-black/[0.09] bg-white px-3 text-[0.78rem] font-semibold text-[#5c5e62] transition hover:bg-[#f0f2f5]">
                <Download size={13} /> Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left">
            <thead>
              <tr className="border-b border-black/[0.05] bg-[#fafafa]">
                {["Customer", "Status", "Type", "Last Login", "Registered", "Actions"].map(h => (
                  <th key={h} className="px-5 py-2.5 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[#5c5e62]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {loading ? (
                <tr><td colSpan={6} className="px-5 py-10 text-center"><Loader2 size={20} className="mx-auto animate-spin text-[#E85C1A]" /></td></tr>
              ) : tableError ? (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-[0.875rem] text-red-500">{tableError}</td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-[0.875rem] text-[#5c5e62]">No customers found.</td></tr>
              ) : (
                customers.map(c => {
                  const status = resolvedStatus(c);
                  const isPending = actionPending === c.id;
                  return (
                    <tr key={c.id} className="group hover:bg-[#fafafa]">
                      {/* Customer */}
                      <td className="px-5 py-3">
                        <p className="text-[0.85rem] font-semibold text-[#1a1a1a]">{fullName(c)}</p>
                        <p className="text-[0.75rem] text-[#5c5e62]">{c.email}</p>
                        {c.company_name && <p className="text-[0.72rem] text-[#9ca3af]">{c.company_name}</p>}
                      </td>
                      {/* Status */}
                      <td className="px-5 py-3">
                        <StatusBadge status={status} />
                        {c.onboarding_status && (
                          <div className="mt-0.5">
                            <OnboardingBadge status={c.onboarding_status} />
                          </div>
                        )}
                        {(c.access_level || c.buyer_tier || c.risk_level) && (
                          <div className="mt-0.5 flex flex-wrap items-center gap-1">
                            <AccessLevelBadge level={c.access_level} />
                            <SegmentBadge segment={c.customer_segment} />
                            <BuyerTierBadge tier={c.buyer_tier} />
                            <RiskLevelBadge risk={c.risk_level} />
                          </div>
                        )}
                        <PermissionDots checkout={c.approved_for_checkout} documents={c.approved_for_documents} />
                        <DataQualityBadge score={c.data_quality_score} reviewStatus={c.data_review_status} />
                        {(c.failed_login_count ?? 0) >= 5 && (
                          <p className="mt-0.5 text-[0.67rem] text-red-500">{c.failed_login_count} failed attempts</p>
                        )}
                      </td>
                      {/* Type */}
                      <td className="px-5 py-3">
                        <TypeBadge type={c.customer_type} />
                        {c.source === "wix" && (
                          <span className="ml-1 rounded-full bg-violet-100 px-1.5 py-0.5 text-[0.63rem] font-bold text-violet-600">Wix</span>
                        )}
                      </td>
                      {/* Last login */}
                      <td className="px-5 py-3">
                        {c.last_login_at ? (
                          <>
                            <p className="text-[0.8rem] text-[#1a1a1a]">{fmtDate(c.last_login_at, true)}</p>
                            {c.last_login_location && <p className="text-[0.72rem] text-[#9ca3af]">{c.last_login_location}</p>}
                          </>
                        ) : <span className="text-[0.78rem] text-[#9ca3af]">Never</span>}
                      </td>
                      {/* Registered */}
                      <td className="px-5 py-3 text-[0.8rem] text-[#5c5e62]">{fmtDate(c.created_at)}</td>
                      {/* Actions */}
                      <td className="px-5 py-3">
                        {isPending ? (
                          <Loader2 size={16} className="animate-spin text-[#E85C1A]" />
                        ) : (
                          <div className="flex items-center gap-1.5">
                            {/* View */}
                            <button type="button" title="View profile" onClick={() => router.push(`/admin/customers/${c.id}`)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-black/[0.08] text-[#5c5e62] transition hover:bg-[#f0f2f5] hover:text-[#1a1a1a]">
                              <Eye size={13} />
                            </button>
                            {/* Onboarding: Approve */}
                            {c.onboarding_status === "pending_review" && (
                              <button type="button" title="Approve account" onClick={() => doAction(c.id, "approve")}
                                className="flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-200 text-emerald-600 transition hover:bg-emerald-50">
                                <UserCheck size={13} />
                              </button>
                            )}
                            {/* Onboarding: Reject */}
                            {c.onboarding_status === "pending_review" && (
                              <button type="button" title="Reject account" onClick={() => doAction(c.id, "reject")}
                                className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-200 text-red-500 transition hover:bg-red-50">
                                <UserX size={13} />
                              </button>
                            )}
                            {/* Onboarding: Invite */}
                            {(c.onboarding_status === "approved" || c.onboarding_status === "rejected") && (
                              <button type="button" title="Send invitation" onClick={() => doAction(c.id, "invite")}
                                className="flex h-7 w-7 items-center justify-center rounded-lg border border-purple-200 text-purple-600 transition hover:bg-purple-50">
                                <UserPlus size={13} />
                              </button>
                            )}
                            {/* Onboarding: Resend invitation */}
                            {c.onboarding_status === "invited" && (
                              <button type="button" title="Resend invitation" onClick={() => doAction(c.id, "resend_invite")}
                                className="flex h-7 w-7 items-center justify-center rounded-lg border border-purple-200 text-purple-600 transition hover:bg-purple-50">
                                <Send size={13} />
                              </button>
                            )}
                            {/* Suspend / Activate */}
                            {status === "active" || status === "locked" ? (
                              <button type="button" title="Suspend account" onClick={() => setPendingAction({ customerId: c.id, type: "suspend" })}
                                className="flex h-7 w-7 items-center justify-center rounded-lg border border-black/[0.08] text-amber-600 transition hover:bg-amber-50">
                                <ShieldOff size={13} />
                              </button>
                            ) : status === "suspended" ? (
                              <button type="button" title="Activate account" onClick={() => doAction(c.id, "activate")}
                                className="flex h-7 w-7 items-center justify-center rounded-lg border border-black/[0.08] text-emerald-600 transition hover:bg-emerald-50">
                                <ShieldCheck size={13} />
                              </button>
                            ) : null}
                            {/* Ban */}
                            {status !== "banned" && (
                              <button type="button" title="Ban account" onClick={() => setPendingAction({ customerId: c.id, type: "ban" })}
                                className="flex h-7 w-7 items-center justify-center rounded-lg border border-black/[0.08] text-red-500 transition hover:bg-red-50">
                                <Ban size={13} />
                              </button>
                            )}
                            {/* Delete */}
                            <button type="button" title="Delete customer" onClick={() => setPendingAction({ customerId: c.id, type: "delete" })}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-black/[0.08] text-red-400 transition hover:bg-red-50 hover:text-red-600">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer: total + pagination */}
        <div className="flex items-center justify-between border-t border-black/[0.05] px-5 py-3">
          <p className="text-[0.78rem] text-[#5c5e62]">
            {total.toLocaleString()} customer{total !== 1 ? "s" : ""}
            {totalPages > 1 && ` · page ${page} of ${totalPages}`}
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button type="button" disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/[0.08] bg-white transition hover:bg-[#f0f2f5] disabled:cursor-not-allowed disabled:opacity-40">
                <ChevronLeft size={14} />
              </button>
              <button type="button" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/[0.08] bg-white transition hover:bg-[#f0f2f5] disabled:cursor-not-allowed disabled:opacity-40">
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
