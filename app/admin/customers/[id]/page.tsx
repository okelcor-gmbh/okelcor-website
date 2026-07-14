"use client";

import { useCallback, useEffect, useState, lazy, Suspense } from "react";
const CommunicationTimeline = lazy(() => import("@/components/admin/communication-timeline"));
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft, User, Mail, Phone, MapPin, Calendar, Shield,
  ShieldOff, ShieldCheck, Ban, Trash2, KeyRound, LogOut,
  Lock, Loader2, AlertCircle, CheckCircle2, Monitor,
  ShoppingCart, FileText, Activity, Edit3, Save, X,
  UserCheck, UserX, UserPlus, Send,
  Gauge, RefreshCw, Copy, ExternalLink,
} from "lucide-react";
import BuyerLifecycleCard from "@/components/admin/buyer-lifecycle-card";
import CustomerVerificationsCard from "@/components/admin/customer-verifications-card";
import CustomerTimelineCard from "@/components/admin/customer-timeline-card";
import EditCustomerModal from "@/components/admin/edit-customer-modal";

// ── Types ─────────────────────────────────────────────────────────────────────

type Status = "active" | "suspended" | "banned" | "locked";
type OnboardingStatus = "pending_review" | "approved" | "invited" | "active" | "rejected" | "blocked";

type CustomerFull = {
  id: number; first_name: string; last_name: string; email: string;
  phone?: string; customer_type: "b2b" | "b2c"; company_name?: string;
  country?: string; status?: Status; onboarding_status?: OnboardingStatus;
  last_login_at?: string; last_login_ip?: string; last_login_location?: string;
  admin_notes?: string; created_at: string;
  failed_login_count?: number; is_locked?: boolean;
  vat_number?: string | null; vat_verified?: boolean; industry?: string | null;
  // CRM-4 segmentation & access
  customer_segment?: string;
  access_level?: string;
  market_region?: string;
  approved_for_checkout?: boolean;
  approved_for_quotes?: boolean;
  approved_for_wholesale_pricing?: boolean;
  approved_for_documents?: boolean;
  // CRM-5 data quality
  data_quality_score?: number | null;
  data_quality_flags?: string[] | null;
  data_review_status?: string;
  normalized_email?: string | null;
  normalized_company_name?: string | null;
  possible_duplicate_of?: number | null;
  possible_duplicate_name?: string | null;
  // CRM-8 buyer lifecycle (undefined = not yet backfilled → treat as approved/low-risk)
  buyer_tier?: string | null;
  verification_status?: string | null;
  health_score?: number | null;
  risk_level?: string | null;
  approved_by?: number | null;
  approved_by_name?: string | null;
  approved_at?: string | null;
  approval_notes?: string | null;
  rejection_reason?: string | null;
};

type LoginEvent = {
  id: number; success: boolean; ip_address: string; user_agent?: string;
  location?: string; created_at: string;
};

type Session = {
  id: string; ip_address?: string; user_agent?: string; created_at: string; last_active?: string;
};

type Order = {
  id: number; order_ref: string; total: number; status: string;
  payment_status?: string; created_at: string;
};

type Quote = {
  id: number; ref_number: string; tyre_category: string; status: string; created_at: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDT(iso: string) {
  try {
    return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
  } catch { return iso; }
}
function fmtD(iso: string) {
  try { return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(iso)); } catch { return iso; }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Status }) {
  const map: Record<Status, string> = {
    active:    "bg-emerald-100 text-emerald-700",
    suspended: "bg-amber-100 text-amber-700",
    banned:    "bg-red-100 text-red-700",
    locked:    "bg-gray-200 text-gray-600",
  };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.72rem] font-bold capitalize ${map[status]}`}>{status}</span>;
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
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.72rem] font-bold ${map[status]}`}>
      {label[status]}
    </span>
  );
}

function OrderStatusBadge({ status, paymentStatus }: { status: string; paymentStatus?: string }) {
  const map: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700", confirmed: "bg-blue-100 text-blue-700",
    shipped: "bg-purple-100 text-purple-700", delivered: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };
  const isAlert = status === "cancelled" || paymentStatus === "unpaid";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.67rem] font-bold capitalize ${isAlert ? "bg-red-100 text-red-700" : (map[status] ?? "bg-gray-100 text-gray-500")}`}>
      {status}{paymentStatus === "unpaid" ? " · unpaid" : ""}
    </span>
  );
}

function SectionCard({ title, icon: Icon, action, children }: { title: string; icon: React.ElementType; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
      <div className="flex items-center justify-between gap-2.5 border-b border-black/[0.06] px-5 py-4">
        <div className="flex items-center gap-2.5">
          <Icon size={15} className="text-[#5c5e62]" />
          <p className="text-[0.9rem] font-extrabold text-[#1a1a1a]">{title}</p>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <p className="px-5 py-8 text-center text-[0.83rem] text-[#9ca3af]">{message}</p>;
}

function Unavailable({ endpoint }: { endpoint: string }) {
  return (
    <div className="px-5 py-8 text-center">
      <p className="text-[0.83rem] text-[#9ca3af]">Data not available yet.</p>
      <p className="mt-1 text-[0.72rem] font-mono text-[#d1d5db]">Backend: {endpoint}</p>
    </div>
  );
}

function ActionButton({
  label, icon: Icon, variant = "default", loading = false, onClick,
}: {
  label: string; icon: React.ElementType; variant?: "default" | "warning" | "danger" | "success";
  loading?: boolean; onClick: () => void;
}) {
  const styles = {
    default: "border border-black/[0.1] text-[#1a1a1a] hover:bg-[#f0f2f5]",
    warning: "border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100",
    danger:  "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
    success: "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
  };
  return (
    <button type="button" disabled={loading} onClick={onClick}
      className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-[0.8rem] font-semibold transition disabled:opacity-50 ${styles[variant]}`}>
      {loading ? <Loader2 size={13} className="animate-spin" /> : <Icon size={13} />}
      {label}
    </button>
  );
}

function ConfirmModal({ title, body, confirmLabel, danger = false, onConfirm, onCancel }: {
  title: string; body: string; confirmLabel: string; danger?: boolean; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-7 shadow-2xl">
        <p className="text-[1rem] font-extrabold text-[#1a1a1a]">{title}</p>
        <p className="mt-2 text-[0.83rem] leading-relaxed text-[#5c5e62]">{body}</p>
        <div className="mt-6 flex gap-3">
          <button type="button" onClick={onCancel} className="flex-1 h-10 rounded-xl border border-black/[0.1] text-[0.83rem] font-semibold text-[#5c5e62] hover:bg-[#f0f2f5]">Cancel</button>
          <button type="button" onClick={onConfirm} className={`flex-1 h-10 rounded-xl text-[0.83rem] font-semibold text-white ${danger ? "bg-red-600 hover:bg-red-700" : "bg-[#E85C1A] hover:bg-[#d44d10]"}`}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CustomerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [customer, setCustomer]     = useState<CustomerFull | null>(null);
  const [loginHistory, setLoginH]   = useState<LoginEvent[] | null>(null);
  const [sessions, setSessions]     = useState<Session[] | null>(null);
  const [orders, setOrders]         = useState<Order[] | null>(null);
  const [quotes, setQuotes]         = useState<Quote[] | null>(null);
  const [loginUnavail, setLoginUA]  = useState(false);
  const [sessUnavail, setSessUA]    = useState(false);

  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [actionPending, setAP]      = useState<string | null>(null);
  const [actionMsg, setActionMsg]   = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [confirm, setConfirm]       = useState<string | null>(null);

  // Admin notes editing
  const [notes, setNotes]           = useState("");
  const [editNotes, setEditNotes]   = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);

  // Edit customer modal
  const [editOpen, setEditOpen] = useState(false);

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const loadCustomer = useCallback(async () => {
    setLoading(true); setError(null);
    const res = await fetch(`/api/admin/customers/${id}`, { cache: "no-store" })
      .then(r => r.ok ? r.json() : null).catch(() => null);
    if (!res) { setError("Customer not found or could not be loaded."); setLoading(false); return; }
    const c: CustomerFull = res.data ?? res;
    setCustomer(c);
    setNotes(c.admin_notes ?? "");
    setLoading(false);
  }, [id]);

  const loadSections = useCallback(async () => {
    if (!customer) return;

    const [lhRes, sessRes, ordRes, qRes] = await Promise.all([
      // Login history via security events
      fetch(`/api/admin/security/events?customer_id=${id}&per_page=50`, { cache: "no-store" })
        .then(r => r.json()).catch(() => null),
      // Active sessions (backend may not have this yet)
      fetch(`/api/admin/customers/${id}?section=sessions`, { cache: "no-store" })
        .then(r => r.ok ? r.json() : null).catch(() => null),
      // Orders filtered by customer ID (falls back to customer_email if empty)
      fetch(`/api/admin/orders?customer_id=${id}&per_page=50&sort=latest`, { cache: "no-store" })
        .then(r => r.ok ? r.json() : null).catch(() => null),
      // Quotes filtered by customer ID
      fetch(`/api/admin/quotes?customer_id=${id}&per_page=50&sort=latest`, { cache: "no-store" })
        .then(r => r.ok ? r.json() : null).catch(() => null),
    ]);

    // Login history
    if (lhRes?._unavailable) setLoginUA(true);
    else if (Array.isArray(lhRes?.data)) setLoginH(lhRes.data);
    else setLoginUA(true);

    // Sessions
    if (!sessRes || sessRes._unavailable) setSessUA(true);
    else {
      const s = sessRes.data ?? sessRes;
      setSessions(Array.isArray(s) ? s : []);
    }

    // Orders — if customer_id filter returned nothing, retry with customer email
    const ordRows: Order[] = ordRes?.data ?? (Array.isArray(ordRes) ? ordRes : []);
    if (ordRows.length === 0 && customer.email) {
      const byEmail = await fetch(
        `/api/admin/orders?customer_email=${encodeURIComponent(customer.email)}&per_page=50&sort=latest`,
        { cache: "no-store" }
      ).then(r => r.ok ? r.json() : null).catch(() => null);
      setOrders(byEmail?.data ?? (Array.isArray(byEmail) ? byEmail : []));
    } else {
      setOrders(ordRows);
    }

    // Quotes — same fallback pattern
    const qRows: Quote[] = qRes?.data ?? (Array.isArray(qRes) ? qRes : []);
    if (qRows.length === 0 && customer.email) {
      const byEmail = await fetch(
        `/api/admin/quotes?customer_email=${encodeURIComponent(customer.email)}&per_page=50&sort=latest`,
        { cache: "no-store" }
      ).then(r => r.ok ? r.json() : null).catch(() => null);
      setQuotes(byEmail?.data ?? (Array.isArray(byEmail) ? byEmail : []));
    } else {
      setQuotes(qRows);
    }
  }, [id, customer]);

  useEffect(() => { loadCustomer(); }, [loadCustomer]);
  useEffect(() => { if (customer) loadSections(); }, [customer, loadSections]);

  // ── Actions ───────────────────────────────────────────────────────────────

  async function doAction(action: string) {
    setAP(action); setActionMsg(null); setConfirm(null);
    try {
      const res = await fetch(`/api/admin/customers/${id}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setActionMsg({ type: "err", text: json.error ?? json.message ?? `Action failed (HTTP ${res.status})` });
      } else {
        setActionMsg({ type: "ok", text: json.message ?? "Action completed successfully." });
        if (action === "delete") { router.push("/admin/customers"); return; }
        // Optimistically update onboarding_status for CRM-1 actions
        const onboardingUpdate: Record<string, OnboardingStatus> = {
          approve: "approved",
          reject:  "rejected",
          invite:  "invited",
          block:   "blocked",
        };
        if (onboardingUpdate[action]) {
          setCustomer(prev => prev ? { ...prev, onboarding_status: onboardingUpdate[action] } : prev);
          return;
        }
        // Refresh customer status for other actions
        const refreshed = await fetch(`/api/admin/customers/${id}`, { cache: "no-store" })
          .then(r => r.ok ? r.json() : null).catch(() => null);
        if (refreshed) setCustomer(refreshed.data ?? refreshed);
      }
    } catch {
      setActionMsg({ type: "err", text: "Network error — action could not be completed." });
    } finally { setAP(null); }
  }

  async function saveNotes() {
    setSavingNotes(true);
    const res = await fetch(`/api/admin/customers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ admin_notes: notes }),
    }).catch(() => null);
    if (res?.ok) {
      setCustomer(prev => prev ? { ...prev, admin_notes: notes } : prev);
      setEditNotes(false);
    }
    setSavingNotes(false);
  }

  // ── CRM-4: Access Control state ──────────────────────────────────────────

  const [access, setAccess] = useState({
    customer_segment:               "unknown",
    access_level:                   "approved_buyer",
    market_region:                  "unknown",
    approved_for_checkout:          true,
    approved_for_quotes:            true,
    approved_for_wholesale_pricing: false,
    approved_for_documents:         true,
  });

  // Sync access state once customer data is loaded
  useEffect(() => {
    if (!customer) return;
    setAccess({
      customer_segment:               customer.customer_segment               ?? "unknown",
      access_level:                   customer.access_level                   ?? "approved_buyer",
      market_region:                  customer.market_region                  ?? "unknown",
      approved_for_checkout:          customer.approved_for_checkout          ?? true,
      approved_for_quotes:            customer.approved_for_quotes            ?? true,
      approved_for_wholesale_pricing: customer.approved_for_wholesale_pricing ?? false,
      approved_for_documents:         customer.approved_for_documents         ?? true,
    });
  }, [customer]);
  const [accessSaving, setAccessSaving] = useState(false);
  const [accessMsg, setAccessMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // ── CRM-5: Data Quality actions ──────────────────────────────────────────

  const [dqAction, setDqAction] = useState<string | null>(null);
  const [dqMsg, setDqMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [dqData, setDqData] = useState<{
    score?: number | null;
    flags?: string[] | null;
    review_status?: string;
    normalized_email?: string | null;
    normalized_company_name?: string | null;
    possible_duplicate_of?: number | null;
    possible_duplicate_name?: string | null;
  }>({
    score:                   customer?.data_quality_score,
    flags:                   customer?.data_quality_flags,
    review_status:           customer?.data_review_status,
    normalized_email:        customer?.normalized_email,
    normalized_company_name: customer?.normalized_company_name,
    possible_duplicate_of:   customer?.possible_duplicate_of,
    possible_duplicate_name: customer?.possible_duplicate_name,
  });

  useEffect(() => {
    if (!customer) return;
    setDqData({
      score:                   customer.data_quality_score,
      flags:                   customer.data_quality_flags,
      review_status:           customer.data_review_status,
      normalized_email:        customer.normalized_email,
      normalized_company_name: customer.normalized_company_name,
      possible_duplicate_of:   customer.possible_duplicate_of,
      possible_duplicate_name: customer.possible_duplicate_name,
    });
  }, [customer]);

  async function dqPost(action: string, body?: Record<string, unknown>) {
    setDqAction(action);
    setDqMsg(null);
    try {
      const res = await fetch(`/api/admin/customers/${id}/data-quality/${action}`, {
        method: "POST",
        headers: body ? { "Content-Type": "application/json" } : {},
        body: body ? JSON.stringify(body) : undefined,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((json as Record<string, unknown>).error as string ?? `Error ${res.status}`);
      const updated = (json.data ?? json) as typeof dqData;
      if (updated.score !== undefined || updated.flags !== undefined) {
        setDqData((prev) => ({ ...prev, ...updated }));
      }
      setDqMsg({ type: "ok", text: (json as Record<string, unknown>).message as string ?? "Done." });
    } catch (err) {
      setDqMsg({ type: "err", text: err instanceof Error ? err.message : "Action failed." });
    } finally { setDqAction(null); }
  }

  async function saveAccess() {
    setAccessSaving(true);
    setAccessMsg(null);
    try {
      const res = await fetch(`/api/admin/customers/${id}/access`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(access),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((json as Record<string, unknown>).error as string ?? `Error ${res.status}`);
      setCustomer((prev) => prev ? { ...prev, ...access } : prev);
      setAccessMsg({ type: "ok", text: "Access settings saved." });
    } catch (err) {
      setAccessMsg({ type: "err", text: err instanceof Error ? err.message : "Save failed." });
    } finally {
      setAccessSaving(false);
    }
  }

  // ── CRM-8: Buyer lifecycle ─────────────────────────────────────────────────
  // Bumped after any lifecycle action so the timeline re-fetches its events.
  const [timelineRefresh, setTimelineRefresh] = useState(0);

  function patchCustomer(fields: Record<string, unknown>) {
    setCustomer((prev) => (prev ? { ...prev, ...fields } : prev));
    setTimelineRefresh((k) => k + 1);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-8">
        <Loader2 size={28} className="animate-spin text-[#E85C1A]" />
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="p-8 text-center">
        <AlertCircle size={32} className="mx-auto mb-3 text-red-400" />
        <p className="text-[0.9rem] font-semibold text-[#1a1a1a]">{error ?? "Customer not found."}</p>
        <Link href="/admin/customers" className="mt-4 inline-flex items-center gap-1.5 text-[0.83rem] text-[#E85C1A] hover:underline">
          <ChevronLeft size={14} /> Back to customers
        </Link>
      </div>
    );
  }

  const status = customer.status ?? "active";
  const name   = [customer.first_name, customer.last_name].filter(Boolean).join(" ") || customer.email;

  return (
    <div className="p-6 md:p-8">

      {/* Breadcrumb */}
      <Link href="/admin/customers" className="mb-6 flex items-center gap-1.5 text-[0.8rem] text-[#5c5e62] transition hover:text-[#1a1a1a]">
        <ChevronLeft size={14} /> Back to Customers
      </Link>

      {/* Action feedback */}
      {actionMsg && (
        <div className={`mb-5 flex items-center gap-2.5 rounded-xl border px-4 py-3 text-[0.83rem] ${actionMsg.type === "ok" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700"}`}>
          {actionMsg.type === "ok" ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
          {actionMsg.text}
          <button type="button" onClick={() => setActionMsg(null)} className="ml-auto"><X size={14} /></button>
        </div>
      )}

      {/* Confirm modal */}
      {confirm && (
        <ConfirmModal
          title={
            confirm === "delete"               ? "Delete this account?"
            : confirm === "ban"                ? "Ban this account?"
            : confirm === "suspend"            ? "Suspend this account?"
            : confirm === "logout_all"         ? "Log out all devices?"
            : confirm === "reject"             ? "Reject this account application?"
            : confirm === "block"              ? "Block this account?"
            : "Force password reset?"
          }
          body={
            confirm === "delete"       ? "This permanently deletes the customer and all associated data. Cannot be undone."
            : confirm === "ban"        ? "The account will be permanently banned and all active sessions invalidated."
            : confirm === "suspend"    ? "The account will be suspended. The customer will see a suspension notice when logging in."
            : confirm === "logout_all" ? "This will immediately invalidate all active sessions for this customer."
            : confirm === "reject"     ? "The account application will be rejected. The customer will be notified by email."
            : confirm === "block"      ? "The account will be blocked from all access. Sessions invalidated immediately."
            : "A password reset email will be sent and the current session will be invalidated."
          }
          confirmLabel={
            confirm === "delete"    ? "Delete Account"
            : confirm === "ban"     ? "Ban Account"
            : confirm === "suspend" ? "Suspend"
            : confirm === "logout_all" ? "Log Out All"
            : confirm === "reject"  ? "Reject Application"
            : confirm === "block"   ? "Block Account"
            : "Send Reset"
          }
          danger={confirm === "delete" || confirm === "ban" || confirm === "reject" || confirm === "block"}
          onCancel={() => setConfirm(null)}
          onConfirm={() => doAction(confirm)}
        />
      )}

      {/* Edit customer modal */}
      {editOpen && (
        <EditCustomerModal
          customer={customer}
          onClose={() => setEditOpen(false)}
          onSaved={(patch, message) => {
            patchCustomer(patch);
            setNotes((patch.admin_notes as string | undefined) ?? notes);
            setActionMsg({ type: "ok", text: message ?? "Customer updated successfully." });
            setEditOpen(false);
          }}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-3">

        {/* ── LEFT COLUMN ── */}
        <div className="space-y-5 lg:col-span-1">

          {/* Account info */}
          <SectionCard
            title="Account Info"
            icon={User}
            action={
              <button type="button" onClick={() => setEditOpen(true)}
                className="flex items-center gap-1.5 rounded-lg border border-black/[0.08] px-2.5 py-1 text-[0.75rem] font-semibold text-[#5c5e62] transition hover:bg-[#f0f2f5] hover:text-[#1a1a1a]">
                <Edit3 size={12} /> Edit
              </button>
            }
          >
            <div className="divide-y divide-black/[0.04]">
              {[
                { icon: User,     label: "Name",    value: name },
                { icon: Mail,     label: "Email",   value: customer.email },
                { icon: Phone,    label: "Phone",   value: customer.phone || "—" },
                { icon: MapPin,   label: "Country", value: customer.country || "—" },
                { icon: Calendar, label: "Joined",  value: fmtD(customer.created_at) },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3 px-5 py-2.5">
                  <Icon size={13} className="shrink-0 text-[#9ca3af]" />
                  <span className="w-16 shrink-0 text-[0.72rem] font-semibold uppercase tracking-wide text-[#9ca3af]">{label}</span>
                  <span className="text-[0.83rem] text-[#1a1a1a]">{value}</span>
                </div>
              ))}
              {customer.company_name && (
                <div className="flex items-center gap-3 px-5 py-2.5">
                  <Shield size={13} className="shrink-0 text-[#9ca3af]" />
                  <span className="w-16 shrink-0 text-[0.72rem] font-semibold uppercase tracking-wide text-[#9ca3af]">Company</span>
                  <span className="text-[0.83rem] text-[#1a1a1a]">{customer.company_name}</span>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between border-t border-black/[0.06] px-5 py-3">
              <span className="text-[0.72rem] font-semibold uppercase tracking-wide text-[#9ca3af]">Status</span>
              <StatusBadge status={status} />
            </div>
            {customer.onboarding_status && (
              <div className="flex items-center justify-between border-t border-black/[0.06] px-5 py-3">
                <span className="text-[0.72rem] font-semibold uppercase tracking-wide text-[#9ca3af]">Onboarding</span>
                <OnboardingBadge status={customer.onboarding_status} />
              </div>
            )}
            {(customer.failed_login_count ?? 0) >= 3 && (
              <div className="flex items-center gap-2 border-t border-red-100 bg-red-50 px-5 py-2.5">
                <Lock size={12} className="shrink-0 text-red-500" />
                <p className="text-[0.78rem] text-red-700">{customer.failed_login_count} failed login attempt{customer.failed_login_count !== 1 ? "s" : ""}</p>
              </div>
            )}
          </SectionCard>

          {/* Admin notes */}
          <SectionCard title="Internal Admin Notes" icon={Edit3}>
            <div className="p-5">
              {!editNotes ? (
                <>
                  <p className="min-h-[60px] text-[0.83rem] leading-relaxed text-[#5c5e62]">
                    {customer.admin_notes || <span className="text-[#9ca3af]">No notes yet.</span>}
                  </p>
                  <button type="button" onClick={() => setEditNotes(true)}
                    className="mt-3 flex items-center gap-1.5 text-[0.78rem] font-semibold text-[#E85C1A] hover:underline">
                    <Edit3 size={12} /> Edit notes
                  </button>
                </>
              ) : (
                <>
                  <textarea
                    value={notes} onChange={e => setNotes(e.target.value)} rows={4}
                    className="w-full resize-none rounded-xl border border-black/[0.1] bg-[#fafafa] p-3 text-[0.83rem] text-[#1a1a1a] outline-none focus:border-[#E85C1A] focus:ring-2 focus:ring-[#E85C1A]/10"
                    placeholder="Internal notes — not visible to the customer…"
                  />
                  <div className="mt-2 flex gap-2">
                    <button type="button" disabled={savingNotes} onClick={saveNotes}
                      className="flex items-center gap-1.5 rounded-xl bg-[#E85C1A] px-3.5 py-1.5 text-[0.78rem] font-semibold text-white hover:bg-[#d44d10] disabled:opacity-50">
                      {savingNotes ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save
                    </button>
                    <button type="button" onClick={() => { setEditNotes(false); setNotes(customer.admin_notes ?? ""); }}
                      className="flex items-center gap-1.5 rounded-xl border border-black/[0.1] px-3.5 py-1.5 text-[0.78rem] font-semibold text-[#5c5e62] hover:bg-[#f0f2f5]">
                      <X size={12} /> Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          </SectionCard>

          {/* CRM-4: Access Control */}
          <SectionCard title="Access Control" icon={Shield}>
            <div className="p-5 space-y-4">
              {accessMsg && (
                <div className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-[0.8rem] ${accessMsg.type === "ok" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700"}`}>
                  {accessMsg.type === "ok" ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                  {accessMsg.text}
                </div>
              )}

              {/* Segment */}
              <div>
                <p className="mb-1 text-[0.7rem] font-semibold uppercase tracking-wide text-[#9ca3af]">Segment</p>
                <select value={access.customer_segment}
                  onChange={(e) => setAccess((p) => ({ ...p, customer_segment: e.target.value }))}
                  className="w-full rounded-xl border border-black/[0.09] bg-white px-3 py-2 text-[0.83rem] text-[#1a1a1a] outline-none focus:border-[#E85C1A]">
                  {["unknown","private_buyer","dealer","workshop","fleet","exporter","distributor","partner"].map((s) => (
                    <option key={s} value={s}>{s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</option>
                  ))}
                </select>
              </div>

              {/* Access level */}
              <div>
                <p className="mb-1 text-[0.7rem] font-semibold uppercase tracking-wide text-[#9ca3af]">Access Level</p>
                <select value={access.access_level}
                  onChange={(e) => setAccess((p) => ({ ...p, access_level: e.target.value }))}
                  className="w-full rounded-xl border border-black/[0.09] bg-white px-3 py-2 text-[0.83rem] text-[#1a1a1a] outline-none focus:border-[#E85C1A]">
                  {[
                    ["inquiry_only",    "Inquiry Only"],
                    ["quote_only",      "Quote Only"],
                    ["approved_buyer",  "Approved Buyer"],
                    ["wholesale_buyer", "Wholesale Buyer"],
                    ["restricted",      "Restricted"],
                    ["blocked",         "Blocked"],
                  ].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>

              {/* Market region */}
              <div>
                <p className="mb-1 text-[0.7rem] font-semibold uppercase tracking-wide text-[#9ca3af]">Market Region</p>
                <select value={access.market_region}
                  onChange={(e) => setAccess((p) => ({ ...p, market_region: e.target.value }))}
                  className="w-full rounded-xl border border-black/[0.09] bg-white px-3 py-2 text-[0.83rem] text-[#1a1a1a] outline-none focus:border-[#E85C1A]">
                  {[["unknown","Unknown"],["eu","EU"],["africa","Africa"],["middle_east","Middle East"],["global","Global"]].map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>

              {/* Permission toggles */}
              <div>
                <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-wide text-[#9ca3af]">Permissions</p>
                <div className="space-y-2">
                  {([
                    ["approved_for_checkout",          "Checkout"],
                    ["approved_for_quotes",            "Quote Requests"],
                    ["approved_for_wholesale_pricing", "Wholesale Pricing"],
                    ["approved_for_documents",         "Trade Documents"],
                  ] as const).map(([key, label]) => (
                    <label key={key} className="flex cursor-pointer items-center justify-between gap-2">
                      <span className="text-[0.82rem] text-[#1a1a1a]">{label}</span>
                      <input type="checkbox" checked={access[key]}
                        onChange={(e) => setAccess((p) => ({ ...p, [key]: e.target.checked }))}
                        className="h-4 w-4 rounded accent-[#E85C1A]" />
                    </label>
                  ))}
                </div>
              </div>

              <button type="button" disabled={accessSaving} onClick={saveAccess}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#E85C1A] py-2.5 text-[0.83rem] font-semibold text-white transition hover:bg-[#d44d10] disabled:opacity-50">
                {accessSaving ? <><Loader2 size={13} className="animate-spin" /> Saving…</> : "Save Access Settings"}
              </button>
            </div>
          </SectionCard>

          {/* CRM-8: Buyer Lifecycle */}
          <BuyerLifecycleCard
            customerId={customer.id}
            lifecycle={{
              buyer_tier:          customer.buyer_tier,
              verification_status: customer.verification_status,
              health_score:        customer.health_score,
              risk_level:          customer.risk_level,
              approved_by:         customer.approved_by,
              approved_by_name:    customer.approved_by_name,
              approved_at:         customer.approved_at,
              approval_notes:      customer.approval_notes,
              rejection_reason:    customer.rejection_reason,
            }}
            access={{
              access_level:                   access.access_level,
              approved_for_quotes:            access.approved_for_quotes,
              approved_for_checkout:          access.approved_for_checkout,
              approved_for_documents:         access.approved_for_documents,
              approved_for_wholesale_pricing: access.approved_for_wholesale_pricing,
            }}
            onPatch={patchCustomer}
          />

          {/* CRM-8: Verification */}
          <CustomerVerificationsCard customerId={customer.id} />

          {/* Actions */}
          <SectionCard title="Admin Actions" icon={Shield}>
            <div className="flex flex-wrap gap-2 p-5">
              {/* CRM-1 onboarding actions */}
              {customer.onboarding_status === "pending_review" && (
                <>
                  <ActionButton label="Approve" icon={UserCheck} variant="success" loading={actionPending === "approve"} onClick={() => doAction("approve")} />
                  <ActionButton label="Reject" icon={UserX} variant="danger" loading={actionPending === "reject"} onClick={() => setConfirm("reject")} />
                </>
              )}
              {(customer.onboarding_status === "approved" || customer.onboarding_status === "rejected") && (
                <ActionButton label="Send Invitation" icon={UserPlus} variant="success" loading={actionPending === "invite"} onClick={() => doAction("invite")} />
              )}
              {customer.onboarding_status === "invited" && (
                <ActionButton label="Resend Invitation" icon={Send} loading={actionPending === "resend_invite"} onClick={() => doAction("resend_invite")} />
              )}
              {customer.onboarding_status && !["rejected", "blocked"].includes(customer.onboarding_status) && customer.onboarding_status !== "pending_review" && (
                <ActionButton label="Block Account" icon={UserX} variant="danger" loading={actionPending === "block"} onClick={() => setConfirm("block")} />
              )}
              {/* Session / account actions */}
              {status === "active" || status === "locked" ? (
                <ActionButton label="Suspend Account" icon={ShieldOff} variant="warning" loading={actionPending === "suspend"} onClick={() => setConfirm("suspend")} />
              ) : status === "suspended" ? (
                <ActionButton label="Activate Account" icon={ShieldCheck} variant="success" loading={actionPending === "activate"} onClick={() => doAction("activate")} />
              ) : null}
              {status !== "banned" && (
                <ActionButton label="Ban Account" icon={Ban} variant="danger" loading={actionPending === "ban"} onClick={() => setConfirm("ban")} />
              )}
              {status === "locked" && (
                <ActionButton label="Unlock Account" icon={ShieldCheck} variant="success" loading={actionPending === "unlock"} onClick={() => doAction("unlock")} />
              )}
              <ActionButton label="Force Password Reset" icon={KeyRound} loading={actionPending === "force_password_reset"} onClick={() => setConfirm("force_password_reset")} />
              <ActionButton label="Log Out All Devices" icon={LogOut} loading={actionPending === "logout_all"} onClick={() => setConfirm("logout_all")} />
              <ActionButton label="Delete Account" icon={Trash2} variant="danger" loading={actionPending === "delete"} onClick={() => setConfirm("delete")} />
            </div>
          </SectionCard>

          {/* Active sessions */}
          <SectionCard title="Active Sessions" icon={Monitor}>
            {sessUnavail ? (
              <Unavailable endpoint="GET /admin/customers/{id}?section=sessions" />
            ) : sessions === null ? (
              <div className="flex justify-center py-6"><Loader2 size={18} className="animate-spin text-[#E85C1A]" /></div>
            ) : sessions.length === 0 ? (
              <EmptyState message="No active sessions." />
            ) : (
              <div className="divide-y divide-black/[0.04]">
                {sessions.map(s => (
                  <div key={s.id} className="px-5 py-3">
                    <p className="text-[0.8rem] font-semibold text-[#1a1a1a]">{s.ip_address ?? "Unknown IP"}</p>
                    <p className="text-[0.72rem] text-[#9ca3af]">{s.user_agent ?? "Unknown device"}</p>
                    <p className="text-[0.72rem] text-[#9ca3af]">{s.last_active ? `Last active ${fmtDT(s.last_active)}` : fmtDT(s.created_at)}</p>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* ── RIGHT COLUMNS ── */}
        <div className="space-y-5 lg:col-span-2">

          {/* Login history */}
          <SectionCard title="Login History" icon={Activity}>
            {loginUnavail ? (
              <Unavailable endpoint="GET /admin/security/events?customer_id={id}" />
            ) : loginHistory === null ? (
              <div className="flex justify-center py-6"><Loader2 size={18} className="animate-spin text-[#E85C1A]" /></div>
            ) : loginHistory.length === 0 ? (
              <EmptyState message="No login history available." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-left">
                  <thead>
                    <tr className="border-b border-black/[0.05] bg-[#fafafa]">
                      {["Date & Time", "Result", "IP Address", "Location", "Device"].map(h => (
                        <th key={h} className="px-5 py-2.5 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[#5c5e62]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.04]">
                    {loginHistory.map(e => (
                      <tr key={e.id} className="hover:bg-[#fafafa]">
                        <td className="px-5 py-2.5 text-[0.8rem] font-mono text-[#5c5e62]">{fmtDT(e.created_at)}</td>
                        <td className="px-5 py-2.5">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.67rem] font-bold ${e.success ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                            {e.success ? "Success" : "Failed"}
                          </span>
                        </td>
                        <td className="px-5 py-2.5 font-mono text-[0.78rem] text-[#5c5e62]">{e.ip_address}</td>
                        <td className="px-5 py-2.5 text-[0.78rem] text-[#5c5e62]">{e.location ?? "—"}</td>
                        <td className="max-w-[200px] truncate px-5 py-2.5 text-[0.72rem] text-[#9ca3af]">{e.user_agent ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>

          {/* Order history */}
          <SectionCard title="Order History" icon={ShoppingCart}>
            {orders === null ? (
              <div className="flex justify-center py-6"><Loader2 size={18} className="animate-spin text-[#E85C1A]" /></div>
            ) : orders.length === 0 ? (
              <EmptyState message="No orders found for this customer." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-black/[0.05] bg-[#fafafa]">
                      {["Ref", "Status", "Amount", "Date"].map(h => (
                        <th key={h} className="px-5 py-2.5 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[#5c5e62]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.04]">
                    {orders.map(o => (
                      <tr key={o.id} className="hover:bg-[#fafafa]">
                        <td className="px-5 py-2.5">
                          <Link href={`/admin/orders/${o.id}`} className="text-[0.82rem] font-semibold text-[#E85C1A] hover:underline">{o.order_ref}</Link>
                        </td>
                        <td className="px-5 py-2.5">
                          <OrderStatusBadge status={o.status} paymentStatus={o.payment_status} />
                        </td>
                        <td className="px-5 py-2.5 text-[0.82rem] font-semibold text-[#1a1a1a]">€{Number(o.total).toFixed(2)}</td>
                        <td className="px-5 py-2.5 text-[0.8rem] text-[#5c5e62]">{fmtD(o.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>

          {/* CRM-5: Data Quality card */}
          <SectionCard title="Data Quality" icon={Gauge}>
            <div className="p-5">
              {dqMsg && (
                <div className={`mb-4 flex items-center gap-2.5 rounded-xl border px-4 py-2.5 text-[0.8rem] ${dqMsg.type === "ok" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700"}`}>
                  {dqMsg.type === "ok" ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                  {dqMsg.text}
                </div>
              )}

              {/* Score */}
              {dqData.score != null && (
                <div className="mb-4 flex items-center gap-3">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-[1rem] font-extrabold ${dqData.score >= 80 ? "bg-emerald-100 text-emerald-700" : dqData.score >= 50 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                    {dqData.score}
                  </div>
                  <div>
                    <p className="text-[0.83rem] font-semibold text-[#1a1a1a]">Quality Score</p>
                    <p className="text-[0.72rem] text-[#9ca3af]">
                      {dqData.score >= 80 ? "Good — complete profile" : dqData.score >= 50 ? "Needs attention" : "Poor — significant gaps"}
                    </p>
                    {dqData.review_status && (
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.63rem] font-bold ${dqData.review_status === "clean" ? "bg-emerald-100 text-emerald-700" : dqData.review_status === "duplicate_suspected" ? "bg-amber-100 text-amber-700" : dqData.review_status === "merged" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}>
                        {dqData.review_status.replace(/_/g, " ")}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Flags */}
              {dqData.flags && dqData.flags.length > 0 && (
                <div className="mb-4">
                  <p className="mb-1.5 text-[0.7rem] font-semibold uppercase tracking-wide text-[#9ca3af]">Quality Flags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {dqData.flags.map((f) => (
                      <span key={f} className={`rounded-md px-2 py-0.5 text-[0.7rem] font-semibold ${f.startsWith("duplicate") ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-600"}`}>
                        {f.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Normalised values */}
              {(dqData.normalized_email || dqData.normalized_company_name) && (
                <div className="mb-4 rounded-xl border border-black/[0.07] bg-[#fafafa] px-3 py-2.5 text-[0.78rem]">
                  {dqData.normalized_email && (
                    <p className="text-[#5c5e62]"><span className="font-semibold text-[#9ca3af]">Normalised email:</span> {dqData.normalized_email}</p>
                  )}
                  {dqData.normalized_company_name && (
                    <p className="mt-0.5 text-[#5c5e62]"><span className="font-semibold text-[#9ca3af]">Normalised company:</span> {dqData.normalized_company_name}</p>
                  )}
                </div>
              )}

              {/* Possible duplicate link */}
              {dqData.possible_duplicate_of && (
                <div className="mb-4 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
                  <Copy size={14} className="shrink-0 text-amber-600" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[0.78rem] font-semibold text-amber-800">Possible duplicate of</p>
                    <p className="text-[0.75rem] text-amber-700">{dqData.possible_duplicate_name ?? `Customer #${dqData.possible_duplicate_of}`}</p>
                  </div>
                  <Link href={`/admin/customers/${dqData.possible_duplicate_of}`}
                    className="flex shrink-0 items-center gap-1 text-[0.75rem] font-semibold text-amber-700 hover:underline">
                    <ExternalLink size={11} /> View
                  </Link>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={dqAction !== null} onClick={() => dqPost("recalculate")}
                  className="flex items-center gap-1.5 rounded-xl border border-black/[0.09] bg-white px-3 py-2 text-[0.78rem] font-semibold text-[#5c5e62] transition hover:bg-[#f5f5f5] disabled:opacity-50">
                  {dqAction === "recalculate" ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                  Recalculate
                </button>
                {dqData.review_status !== "clean" && (
                  <button type="button" disabled={dqAction !== null} onClick={() => dqPost("mark-clean")}
                    className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[0.78rem] font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50">
                    {dqAction === "mark-clean" ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                    Mark Clean
                  </button>
                )}
                {dqData.possible_duplicate_of && dqData.review_status !== "ignored" && (
                  <button type="button" disabled={dqAction !== null} onClick={() => dqPost("ignore-duplicate")}
                    className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-[0.78rem] font-semibold text-gray-600 transition hover:bg-gray-100 disabled:opacity-50">
                    {dqAction === "ignore-duplicate" ? <Loader2 size={12} className="animate-spin" /> : <AlertCircle size={12} />}
                    Ignore Duplicate
                  </button>
                )}
              </div>
            </div>
          </SectionCard>

          {/* CRM-8: Lifecycle Timeline */}
          <CustomerTimelineCard customerId={customer.id} refreshKey={timelineRefresh} />

          {/* CRM-6: Communication Timeline */}
          {customer && (
            <SectionCard title="Communications" icon={Activity}>
              <div className="p-5">
                <Suspense fallback={<div className="py-6 text-center text-[0.83rem] text-[#9ca3af]">Loading…</div>}>
                  <CommunicationTimeline context="customer" entityId={customer.id} compact />
                </Suspense>
              </div>
            </SectionCard>
          )}

          {/* Quote history */}
          <SectionCard title="Quote Requests" icon={FileText}>
            {quotes === null ? (
              <div className="flex justify-center py-6"><Loader2 size={18} className="animate-spin text-[#E85C1A]" /></div>
            ) : quotes.length === 0 ? (
              <EmptyState message="No quote requests found for this customer." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-black/[0.05] bg-[#fafafa]">
                      {["Ref", "Category", "Status", "Date"].map(h => (
                        <th key={h} className="px-5 py-2.5 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[#5c5e62]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.04]">
                    {quotes.map(q => (
                      <tr key={q.id} className="hover:bg-[#fafafa]">
                        <td className="px-5 py-2.5">
                          <Link href={`/admin/quotes/${q.id}`} className="text-[0.82rem] font-semibold text-[#E85C1A] hover:underline">{q.ref_number}</Link>
                        </td>
                        <td className="px-5 py-2.5 text-[0.82rem] text-[#5c5e62]">{q.tyre_category}</td>
                        <td className="px-5 py-2.5">
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[0.67rem] font-bold capitalize text-gray-600">{q.status}</span>
                        </td>
                        <td className="px-5 py-2.5 text-[0.8rem] text-[#5c5e62]">{fmtD(q.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
