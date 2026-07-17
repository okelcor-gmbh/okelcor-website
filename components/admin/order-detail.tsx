"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Activity, AlertCircle, AlertOctagon, AlertTriangle, ArrowRight,
  CheckCircle2, ChevronDown, ChevronRight, Copy, FileWarning,
  Landmark, Lock, Loader2, Mail, MapPin, Plus, Pencil, RotateCcw, ShoppingBag, Trash2, UserCheck,
} from "lucide-react";
import { SITE_URL } from "@/lib/constants";
import { updateOrderStatus, cancelOrder, deleteOrder, addShipmentEvent, updateShipmentEvent, deleteShipmentEvent } from "@/app/admin/orders/actions";
import type { AdminOrderFull, AdminOrderItem, AdminOrderLog, ShipmentEvent } from "@/lib/admin-api";
import { canDo } from "@/lib/admin-permissions";
import { ORDER_CURRENCIES, formatMoney } from "@/lib/currency";
import TradeDocumentsCard from "@/components/admin/trade-documents-card";
import PaymentMilestonesCard from "@/components/admin/payment-milestones-card";
import TrackShipmentControl from "@/components/admin/tracking/track-shipment-control";

// ── Types ─────────────────────────────────────────────────────────────────────

const ORDER_STATUSES = ["pending", "confirmed", "awaiting_proforma", "shipped", "delivered", "cancelled"] as const;
type OrderStatus = (typeof ORDER_STATUSES)[number];

type TabId = "overview" | "payments" | "documents" | "logistics" | "compliance" | "activity";
type RevisionItemDraft = { id: number; name: string; unit_price: string; quantity: string; remove: boolean };
type RevisionNewItemDraft = { name: string; unit_price: string; quantity: string };

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  pending:            "bg-amber-100 text-amber-700",
  confirmed:          "bg-blue-100 text-blue-700",
  awaiting_proforma:  "bg-indigo-100 text-indigo-700",
  shipped:            "bg-purple-100 text-purple-700",
  delivered:          "bg-emerald-100 text-emerald-700",
  cancelled:          "bg-red-100 text-red-600",
};

const STATUS_LABEL: Record<string, string> = {
  pending:           "Pending",
  confirmed:         "Confirmed",
  awaiting_proforma: "Awaiting Proforma",
  shipped:           "Shipped",
  delivered:         "Delivered",
  cancelled:         "Cancelled",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-[0.75rem] font-bold ${STATUS_STYLES[status] ?? "bg-gray-100 text-gray-500"}`}>
      {STATUS_LABEL[status] ?? status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function shortDate(iso?: string): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    }).format(new Date(iso));
  } catch { return iso; }
}

function shortDateOnly(iso?: string): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
    }).format(new Date(iso));
  } catch { return iso; }
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">{label}</p>
      <p className="text-[0.875rem] text-[#1a1a1a]">{value}</p>
    </div>
  );
}

function toDateInputValue(iso?: string): string {
  if (!iso) return "";
  try { return new Date(iso).toISOString().slice(0, 10); } catch { return ""; }
}

// ── Shipment event manager ────────────────────────────────────────────────────

type EventFormData = {
  date: string;
  status_label: string;
  location: string;
  description: string;
};

const EMPTY_FORM: EventFormData = { date: "", status_label: "", location: "", description: "" };

function EventForm({
  data,
  onChange,
  onSave,
  onCancel,
  saving,
  error,
  saveLabel,
}: {
  data: EventFormData;
  onChange: (field: keyof EventFormData, value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  error: string | null;
  saveLabel: string;
}) {
  const inp = "h-9 rounded-lg border border-black/[0.09] bg-white px-3 text-[0.83rem] text-[#1a1a1a] outline-none placeholder:text-[#aaa] transition focus:border-[#E85C1A] focus:ring-2 focus:ring-[#E85C1A]/10";
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-black/[0.09] bg-[#fafafa] p-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">Date *</span>
          <input type="date" value={data.date} onChange={(e) => onChange("date", e.target.value)} className={inp} />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">Status Label *</span>
          <input type="text" value={data.status_label} onChange={(e) => onChange("status_label", e.target.value)}
            placeholder="e.g. Dispatched, In Transit" className={inp} />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">Location</span>
          <input type="text" value={data.location} onChange={(e) => onChange("location", e.target.value)}
            placeholder="e.g. Brussels, Belgium" className={inp} />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">Description</span>
          <input type="text" value={data.description} onChange={(e) => onChange("description", e.target.value)}
            placeholder="Optional note" className={inp} />
        </div>
      </div>
      {error && (
        <div className="flex items-center gap-1.5 text-[0.8rem] text-red-600">
          <AlertCircle size={13} className="shrink-0" />
          {error}
        </div>
      )}
      <div className="flex items-center gap-2">
        <button type="button" onClick={onSave} disabled={saving || !data.date || !data.status_label}
          className="h-8 rounded-full bg-[#E85C1A] px-5 text-[0.78rem] font-semibold text-white transition hover:bg-[#d14f14] disabled:opacity-50">
          {saving ? "Saving…" : saveLabel}
        </button>
        <button type="button" onClick={onCancel} disabled={saving}
          className="h-8 rounded-full border border-black/[0.09] bg-white px-4 text-[0.78rem] font-semibold text-[#5c5e62] transition hover:bg-[#f0f0f0] disabled:opacity-50">
          Cancel
        </button>
      </div>
    </div>
  );
}

function ShipmentEventManager({
  orderId,
  initialEvents,
}: {
  orderId: number;
  initialEvents: ShipmentEvent[];
}) {
  const router = useRouter();
  const [events,     setEvents]     = useState<ShipmentEvent[]>(initialEvents);
  const [adding,     setAdding]     = useState(false);
  const [editingId,  setEditingId]  = useState<number | null>(null);
  const [form,       setForm]       = useState<EventFormData>(EMPTY_FORM);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const sorted = [...events].sort((a, b) => (a.event_date ?? "").localeCompare(b.event_date ?? ""));
  const setField = (field: keyof EventFormData, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleAdd = async () => {
    setSaving(true); setError(null);
    const result = await addShipmentEvent(orderId, {
      date: form.date, status_label: form.status_label,
      location: form.location || undefined, description: form.description || undefined,
    });
    setSaving(false);
    if (result.error) { setError(result.error); return; }
    const newEvent: ShipmentEvent = result.event ?? { id: Date.now(), event_date: form.date, status_label: form.status_label, location: form.location || null, description: form.description || null };
    setEvents((evs) => [...evs, newEvent]);
    setAdding(false); setForm(EMPTY_FORM);
    router.refresh();
  };

  const startEdit = (ev: ShipmentEvent) => {
    setEditingId(ev.id);
    setForm({ date: (ev.event_date ?? "").slice(0, 10), status_label: ev.status_label, location: ev.location ?? "", description: ev.description ?? "" });
    setError(null);
  };

  const handleEdit = async () => {
    if (!editingId) return;
    setSaving(true); setError(null);
    const result = await updateShipmentEvent(orderId, editingId, {
      date: form.date, status_label: form.status_label,
      location: form.location || undefined, description: form.description || undefined,
    });
    setSaving(false);
    if (result.error) { setError(result.error); return; }
    setEvents((evs) => evs.map((e) => e.id === editingId
      ? { ...e, event_date: form.date, status_label: form.status_label, location: form.location || null, description: form.description || null }
      : e
    ));
    setEditingId(null); setForm(EMPTY_FORM);
    router.refresh();
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id); setError(null);
    const result = await deleteShipmentEvent(orderId, id);
    setDeletingId(null);
    if (result.error) { setError(result.error); return; }
    setEvents((evs) => evs.filter((e) => e.id !== id));
    router.refresh();
  };

  const cancelForm = () => { setAdding(false); setEditingId(null); setForm(EMPTY_FORM); setError(null); };

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#E85C1A]">
          Shipment Events
        </p>
        {!adding && editingId === null && (
          <button type="button"
            onClick={() => { setAdding(true); setForm(EMPTY_FORM); setError(null); }}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#E85C1A]/30 bg-[#fff5f2] px-3 py-1.5 text-[0.75rem] font-semibold text-[#E85C1A] transition hover:bg-[#fff0ea]">
            <Plus size={13} strokeWidth={2.2} />
            Add Event
          </button>
        )}
      </div>

      {error && !adding && editingId === null && (
        <div className="mb-3 flex items-center gap-1.5 text-[0.8rem] text-red-600">
          <AlertCircle size={13} className="shrink-0" />
          {error}
        </div>
      )}

      {adding && (
        <div className="mb-4">
          <EventForm data={form} onChange={setField} onSave={handleAdd} onCancel={cancelForm}
            saving={saving} error={error} saveLabel="Add Event" />
        </div>
      )}

      {sorted.length === 0 && !adding ? (
        <p className="text-[0.875rem] text-[#5c5e62]">
          No shipment events yet. Add the first milestone to start tracking.
        </p>
      ) : (
        <ol className="divide-y divide-black/[0.05]">
          {sorted.map((ev, i) => {
            const isLatest  = i === sorted.length - 1;
            const isEditing = editingId === ev.id;
            return (
              <li key={ev.id} className="py-3">
                {isEditing ? (
                  <EventForm data={form} onChange={setField} onSave={handleEdit} onCancel={cancelForm}
                    saving={saving} error={error} saveLabel="Save Changes" />
                ) : (
                  <div className="flex items-start gap-3">
                    <span className={`mt-[7px] h-2.5 w-2.5 shrink-0 rounded-full ${isLatest ? "bg-[#E85C1A]" : "bg-black/20"}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <span className={`text-[0.875rem] font-semibold ${isLatest ? "text-[#E85C1A]" : "text-[#1a1a1a]"}`}>
                          {ev.status_label}
                        </span>
                        <span className="text-[0.75rem] text-[#5c5e62]">{shortDateOnly(ev.event_date ?? undefined)}</span>
                      </div>
                      {ev.location && (
                        <p className="mt-0.5 flex items-center gap-1 text-[0.78rem] text-[#5c5e62]">
                          <MapPin size={11} strokeWidth={1.8} className="shrink-0" />
                          {ev.location}
                        </p>
                      )}
                      {ev.description && (
                        <p className="mt-0.5 text-[0.78rem] italic text-[#5c5e62]">{ev.description}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button type="button" onClick={() => startEdit(ev)}
                        disabled={!!editingId || adding || deletingId !== null}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-black/[0.08] bg-white text-[#5c5e62] transition hover:border-[#E85C1A]/30 hover:text-[#E85C1A] disabled:opacity-40"
                        title="Edit event">
                        <Pencil size={12} strokeWidth={2} />
                      </button>
                      <button type="button" onClick={() => handleDelete(ev.id)}
                        disabled={deletingId !== null || !!editingId || adding}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-black/[0.08] bg-white text-[#5c5e62] transition hover:border-red-200 hover:text-red-500 disabled:opacity-40"
                        title="Delete event">
                        {deletingId === ev.id
                          ? <Loader2 size={12} className="animate-spin" />
                          : <Trash2 size={12} strokeWidth={2} />
                        }
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

// ── Activity Log ─────────────────────────────────────────────────────────────

function formatAction(action: string): string {
  return action
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function LogEntry({ log }: { log: AdminOrderLog }) {
  const hasChange = log.old_value != null || log.new_value != null;
  return (
    <li className="relative pl-6">
      <span className="absolute left-0 top-[5px] flex h-3 w-3 items-center justify-center rounded-full border-2 border-[#E85C1A] bg-white" />

      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="text-[0.83rem] font-semibold text-[#1a1a1a]">
          {formatAction(log.action)}
        </span>
        {log.admin_user_email && (
          <span className="text-[0.75rem] text-[#5c5e62]">by {log.admin_user_email}</span>
        )}
        {log.ip_address && (
          <span className="font-mono text-[0.72rem] text-[#9ca3af]">({log.ip_address})</span>
        )}
      </div>

      {hasChange && (
        <p className="mt-0.5 text-[0.78rem] text-[#5c5e62]">
          {log.old_value != null && (
            <>
              <span className="rounded bg-red-50 px-1 py-0.5 font-medium text-red-600 line-through">
                {log.old_value}
              </span>
              <span className="mx-1.5 text-[#9ca3af]">→</span>
            </>
          )}
          {log.new_value != null && (
            <span className="rounded bg-emerald-50 px-1 py-0.5 font-medium text-emerald-700">
              {log.new_value}
            </span>
          )}
        </p>
      )}

      {log.notes && (
        <p className="mt-0.5 text-[0.78rem] italic text-[#5c5e62]">{log.notes}</p>
      )}

      <p className="mt-0.5 text-[0.72rem] text-[#9ca3af]">{shortDate(log.created_at)}</p>
    </li>
  );
}

function ActivityLog({ logs }: { logs?: AdminOrderLog[] }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <p className="mb-4 text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#E85C1A]">
        Activity Log
      </p>

      {!logs?.length ? (
        <p className="text-[0.875rem] text-[#5c5e62]">
          No activity has been recorded for this order yet.
        </p>
      ) : (
        <ol className="relative border-l border-black/[0.07] pl-3 space-y-5">
          {logs.map((log) => (
            <LogEntry key={log.id} log={log} />
          ))}
        </ol>
      )}
    </div>
  );
}

// ── Next-action logic ─────────────────────────────────────────────────────────

type NextAction = {
  label: string;
  sublabel: string;
  priority: "red" | "amber" | "blue" | "green";
  tab: TabId;
};

function getNextAction(p: {
  status: string;
  paymentStatus: string;
  paymentMethod?: string;
  revisionRequired: boolean;
  customerRejected: boolean;
  customerAcceptancePending: boolean;
  paymentStage?: string | null;
  declarationRequired?: boolean | null;
  declarationStatus?: string | null;
  hasTradeDocs: boolean;
}): NextAction {
  if (p.status === "cancelled") {
    return { label: "Order cancelled", sublabel: "No further action required.", priority: "red", tab: "overview" };
  }
  if (p.customerRejected) {
    return { label: "Customer rejected the order confirmation", sublabel: "Contact the customer to resolve before proceeding.", priority: "red", tab: "payments" };
  }
  if (p.revisionRequired) {
    return { label: "Financial revision pending approval", sublabel: "Approve or reject the revision request in the Payments tab.", priority: "red", tab: "payments" };
  }
  if (p.customerAcceptancePending) {
    return { label: "Awaiting customer acceptance", sublabel: "Customer must accept the order confirmation before the proforma can be issued.", priority: "amber", tab: "payments" };
  }
  if (p.paymentStage === "deposit_requested") {
    return { label: "Awaiting deposit payment", sublabel: "Deposit invoice sent — mark as paid once confirmed in account.", priority: "amber", tab: "payments" };
  }
  if (p.paymentStage === "deposit_paid") {
    return { label: "Generate commercial invoice & packing list", sublabel: "Deposit confirmed — commercial documents can now be issued.", priority: "blue", tab: "documents" };
  }
  if (p.paymentStage === "balance_due") {
    return { label: "Awaiting balance payment", sublabel: "Balance invoice sent — mark as paid once confirmed in account.", priority: "amber", tab: "payments" };
  }
  if (p.paymentStage === "balance_paid") {
    return { label: "Release shipment", sublabel: "Full payment received — confirm shipment release to proceed with logistics.", priority: "blue", tab: "payments" };
  }
  if (p.paymentStage === "shipment_released" && p.status !== "delivered") {
    return { label: "Upload shipment documents & track delivery", sublabel: "Shipment released — upload BOL/CMR and update tracking status.", priority: "blue", tab: "logistics" };
  }
  if (p.declarationRequired && p.declarationStatus !== "acknowledged") {
    return { label: "Complete EU entry certificate", sublabel: "Gelangensbestätigung required and not yet acknowledged.", priority: "amber", tab: "compliance" };
  }
  if (p.paymentStatus === "pending" && p.paymentMethod === "bank_transfer" && !p.paymentStage) {
    return { label: "Awaiting bank transfer", sublabel: "Mark as paid once payment appears in the Okelcor account.", priority: "amber", tab: "payments" };
  }
  if (p.status === "pending" && !p.paymentStage) {
    return { label: "Confirm order", sublabel: "Review and update the order status to confirmed.", priority: "amber", tab: "overview" };
  }
  if (!p.hasTradeDocs && p.status !== "pending" && p.status !== "cancelled") {
    return { label: "Generate order confirmation", sublabel: "Issue the order confirmation document as the first step.", priority: "blue", tab: "documents" };
  }
  return { label: "Order is progressing normally", sublabel: "No immediate action required.", priority: "green", tab: "overview" };
}

const PRIORITY_STYLE: Record<NextAction["priority"], { border: string; bg: string; text: string; sub: string; icon: string; dot: string }> = {
  red:   { border: "border-l-red-400",     bg: "bg-red-50",      text: "text-red-700",      sub: "text-red-600",      icon: "text-red-500",      dot: "bg-red-500"      },
  amber: { border: "border-l-amber-400",   bg: "bg-amber-50",    text: "text-amber-800",    sub: "text-amber-700",    icon: "text-amber-500",    dot: "bg-amber-500"    },
  blue:  { border: "border-l-blue-400",    bg: "bg-blue-50",     text: "text-blue-800",     sub: "text-blue-700",     icon: "text-blue-500",     dot: "bg-blue-500"     },
  green: { border: "border-l-emerald-400", bg: "bg-emerald-50",  text: "text-emerald-800",  sub: "text-emerald-700",  icon: "text-emerald-500",  dot: "bg-emerald-500"  },
};

// ── Tab config ────────────────────────────────────────────────────────────────

const TAB_LABELS: { id: TabId; label: string }[] = [
  { id: "overview",    label: "Overview"    },
  { id: "payments",    label: "Payments"    },
  { id: "documents",   label: "Documents"   },
  { id: "logistics",   label: "Logistics"   },
  { id: "compliance",  label: "Compliance"  },
  { id: "activity",    label: "Activity"    },
];

// ── Main component ────────────────────────────────────────────────────────────

export default function OrderDetail({
  order,
  adminRole,
}: {
  order: AdminOrderFull;
  adminRole: string;
}) {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const [status, setStatus] = useState<OrderStatus>(
    ORDER_STATUSES.includes(order.status as OrderStatus)
      ? (order.status as OrderStatus)
      : "pending",
  );
  const [carrier,           setCarrier]           = useState(order.carrier ?? "");
  const [carrierType,       setCarrierType]       = useState(order.carrier_type ?? "");
  const [trackingNumber,    setTrackingNumber]    = useState(order.tracking_number ?? "");
  const [estimatedDelivery, setEstimatedDelivery] = useState(toDateInputValue(order.estimated_delivery ?? order.eta));
  const [currency,          setCurrency]          = useState(order.currency ?? "EUR");

  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved,     setSaved]     = useState(false);
  const [isPending, startTransition] = useTransition();

  const [cancelError,   setCancelError]   = useState<string | null>(null);
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const [isCancelPending, startCancelTransition] = useTransition();

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteRef,       setDeleteRef]       = useState("");
  const [deleteError,     setDeleteError]     = useState<string | null>(null);
  const [isDeletePending, startDeleteTransition] = useTransition();

  // ── Order item editing (unlocked, non-eBay orders) ────────────────────────
  const [itemModalMode,  setItemModalMode]  = useState<"add" | "edit" | null>(null);
  const [itemModalId,    setItemModalId]    = useState<number | null>(null);
  const [itemName,       setItemName]       = useState("");
  const [itemSku,        setItemSku]        = useState("");
  const [itemBrand,      setItemBrand]      = useState("");
  const [itemSize,       setItemSize]       = useState("");
  const [itemUnitPrice,  setItemUnitPrice]  = useState("");
  const [itemQuantity,   setItemQuantity]   = useState("");
  const [itemReason,     setItemReason]     = useState("");
  const [itemModalLoading, setItemModalLoading] = useState(false);
  const [itemModalError,   setItemModalError]   = useState<string | null>(null);

  const [deleteItemTarget,  setDeleteItemTarget]  = useState<AdminOrderItem | null>(null);
  const [deleteItemReason,  setDeleteItemReason]  = useState("");
  const [deleteItemLoading, setDeleteItemLoading] = useState(false);
  const [deleteItemError,   setDeleteItemError]   = useState<string | null>(null);

  const [paymentStatus,     setPaymentStatus]     = useState(order.payment_status ?? "");
  const [markPaidOpen,      setMarkPaidOpen]      = useState(false);
  const [markPaidConfirmed, setMarkPaidConfirmed] = useState(false);
  const [paymentRef,        setPaymentRef]        = useState("");
  const [adminNote,         setAdminNote]         = useState("");
  const [markPaidError,     setMarkPaidError]     = useState<string | null>(null);
  const [markPaidSuccess,   setMarkPaidSuccess]   = useState(false);
  const [isMarkPaidPending, setIsMarkPaidPending] = useState(false);

  const [revisionModalOpen,    setRevisionModalOpen]    = useState(false);
  const [revisionReason,       setRevisionReason]       = useState("");
  const [revisionDeliveryFee,  setRevisionDeliveryFee]  = useState("");
  const [revisionLoading,      setRevisionLoading]      = useState(false);
  const [revisionError,        setRevisionError]        = useState<string | null>(null);
  const [revisionSubmitted,    setRevisionSubmitted]    = useState(false);

  const [revisionItems,    setRevisionItems]    = useState<RevisionItemDraft[]>([]);
  const [revisionNewItems, setRevisionNewItems] = useState<RevisionNewItemDraft[]>([]);

  const [approveModalOpen,   setApproveModalOpen]   = useState(false);
  const [approveConfirmed,   setApproveConfirmed]   = useState(false);
  const [approveLoading,     setApproveLoading]     = useState(false);
  const [approveError,       setApproveError]       = useState<string | null>(null);

  const [rejectLoading,   setRejectLoading]   = useState(false);
  const [rejectError,     setRejectError]     = useState<string | null>(null);
  const [rejectSuccess,   setRejectSuccess]   = useState(false);

  const [sendAcceptLoading,  setSendAcceptLoading]  = useState(false);
  const [sendAcceptSuccess,  setSendAcceptSuccess]  = useState(false);
  const [sendAcceptError,    setSendAcceptError]    = useState<string | null>(null);
  const [copiedAcceptLink,   setCopiedAcceptLink]   = useState(false);

  const [revisionRequired, setRevisionRequired] = useState(order.financials_revision_required ?? false);

  // Derived
  const customerAcceptancePending = order.customer_acceptance_status === "pending";
  const customerRejected          = order.customer_acceptance_status === "rejected";
  const isLocked                  = order.financials_locked === true;
  const hasTradeDocs              = (order.trade_documents?.length ?? 0) > 0;
  const isEbayOrder               = order.source === "ebay";

  const canCancel          = canDo(adminRole, "orders.update");
  const canEditItems       = canCancel && !isEbayOrder && !isLocked;
  const canDelete          = canDo(adminRole, "orders.delete");
  const canApproveRevision = canDo(adminRole, "orders.approve_financial_revision");
  const cancelDisabled     = ["cancelled", "delivered"].includes(status);

  // ── Tab badge logic ───────────────────────────────────────────────────────────
  const paymentsHasBadge = revisionRequired || customerAcceptancePending || customerRejected
    || ["deposit_requested", "balance_due", "balance_paid"].includes(order.payment_stage ?? "");
  const documentsHasBadge = order.payment_stage === "deposit_paid";
  const logisticsHasBadge = order.payment_stage === "shipment_released" && status !== "delivered";
  const complianceHasBadge = !!(order.declaration_required && order.declaration_status !== "acknowledged");

  const TAB_BADGES: Partial<Record<TabId, boolean>> = {
    payments:   paymentsHasBadge,
    documents:  documentsHasBadge,
    logistics:  logisticsHasBadge,
    compliance: complianceHasBadge,
  };

  // ── Next action ───────────────────────────────────────────────────────────────
  const nextAction = getNextAction({
    status,
    paymentStatus,
    paymentMethod: order.payment_method,
    revisionRequired,
    customerRejected,
    customerAcceptancePending,
    paymentStage: order.payment_stage,
    declarationRequired: order.declaration_required,
    declarationStatus: order.declaration_status,
    hasTradeDocs,
  });
  const ps = PRIORITY_STYLE[nextAction.priority];

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const closeItemModal = () => {
    setItemModalMode(null);
    setItemModalId(null);
    setItemName(""); setItemSku(""); setItemBrand(""); setItemSize("");
    setItemUnitPrice(""); setItemQuantity(""); setItemReason("");
    setItemModalError(null);
  };

  const openAddItem = () => {
    closeItemModal();
    setItemModalMode("add");
  };

  const openEditItem = (item: AdminOrderItem) => {
    closeItemModal();
    setItemModalMode("edit");
    setItemModalId(item.id);
    setItemName(item.product_name ?? "");
    setItemSku(item.sku ?? "");
    setItemBrand(item.brand ?? "");
    setItemSize(item.size ?? "");
    setItemUnitPrice(String(item.unit_price ?? ""));
    setItemQuantity(String(item.quantity ?? ""));
  };

  const submitItemModal = async () => {
    if (!itemReason.trim()) { setItemModalError("Please describe why this item is being changed."); return; }
    if (itemModalMode === "add" && (!itemName.trim() || !itemUnitPrice.trim() || !itemQuantity.trim())) {
      setItemModalError("Name, unit price, and quantity are required.");
      return;
    }
    setItemModalLoading(true);
    setItemModalError(null);
    try {
      const isAdd = itemModalMode === "add";
      const currentItem = !isAdd ? order.items.find((i) => i.id === itemModalId) : undefined;
      const body: Record<string, unknown> = { reason: itemReason.trim() };

      if (isAdd) {
        body.name = itemName.trim();
        if (itemSku.trim()) body.sku = itemSku.trim();
        if (itemBrand.trim()) body.brand = itemBrand.trim();
        if (itemSize.trim()) body.size = itemSize.trim();
        body.unit_price = parseFloat(itemUnitPrice);
        body.quantity = parseInt(itemQuantity, 10);
      } else if (currentItem) {
        if (itemName.trim() !== (currentItem.product_name ?? "")) body.name = itemName.trim();
        if (itemSku.trim() !== (currentItem.sku ?? "")) body.sku = itemSku.trim();
        if (itemBrand.trim() !== (currentItem.brand ?? "")) body.brand = itemBrand.trim();
        if (itemSize.trim() !== (currentItem.size ?? "")) body.size = itemSize.trim();
        if (parseFloat(itemUnitPrice) !== Number(currentItem.unit_price)) body.unit_price = parseFloat(itemUnitPrice);
        if (parseInt(itemQuantity, 10) !== currentItem.quantity) body.quantity = parseInt(itemQuantity, 10);
      }

      const url = isAdd
        ? `/api/admin/orders/${order.id}/items`
        : `/api/admin/orders/${order.id}/items/${itemModalId}`;
      const res = await fetch(url, {
        method: isAdd ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({})) as Record<string, unknown>;
      if (!res.ok) {
        const code = json.code as string | undefined;
        if (code === "ebay_order_not_editable") setItemModalError("This order is synced from eBay and can't be edited here.");
        else if (res.status === 423 || code === "financials_locked") setItemModalError("Financials are locked — use Request Financial Revision instead.");
        else setItemModalError((json.message as string) ?? "Failed to save item.");
        return;
      }
      closeItemModal();
      router.refresh();
    } catch {
      setItemModalError("Network error. Please try again.");
    } finally {
      setItemModalLoading(false);
    }
  };

  const handleDeleteItem = async () => {
    if (!deleteItemTarget) return;
    if (!deleteItemReason.trim()) { setDeleteItemError("Please describe why this item is being removed."); return; }
    setDeleteItemLoading(true);
    setDeleteItemError(null);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/items/${deleteItemTarget.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: deleteItemReason.trim() }),
      });
      const json = await res.json().catch(() => ({})) as Record<string, unknown>;
      if (!res.ok) {
        const code = json.code as string | undefined;
        if (code === "cannot_delete_last_item") setDeleteItemError("You can't delete the only remaining item — edit it instead, or cancel the order.");
        else if (code === "ebay_order_not_editable") setDeleteItemError("This order is synced from eBay and can't be edited here.");
        else if (res.status === 423 || code === "financials_locked") setDeleteItemError("Financials are locked — use Request Financial Revision instead.");
        else setDeleteItemError((json.message as string) ?? "Failed to remove item.");
        return;
      }
      setDeleteItemTarget(null);
      setDeleteItemReason("");
      router.refresh();
    } catch {
      setDeleteItemError("Network error. Please try again.");
    } finally {
      setDeleteItemLoading(false);
    }
  };

  const openRevisionModal = () => {
    setRevisionItems(order.items.map((i) => ({
      id: i.id,
      name: i.product_name ?? "",
      unit_price: String(i.unit_price ?? ""),
      quantity: String(i.quantity ?? ""),
      remove: false,
    })));
    setRevisionNewItems([]);
    setRevisionModalOpen(true);
  };

  const closeRevisionModal = () => {
    setRevisionModalOpen(false);
    setRevisionReason("");
    setRevisionDeliveryFee("");
    setRevisionItems([]);
    setRevisionNewItems([]);
    setRevisionError(null);
  };

  const updateRevisionItem = (id: number, field: "name" | "unit_price" | "quantity", value: string) => {
    setRevisionItems((prev) => prev.map((it) => (it.id === id ? { ...it, [field]: value } : it)));
  };
  const toggleRevisionRemove = (id: number) => {
    setRevisionItems((prev) => prev.map((it) => (it.id === id ? { ...it, remove: !it.remove } : it)));
  };
  const addRevisionNewItem = () => setRevisionNewItems((prev) => [...prev, { name: "", unit_price: "", quantity: "1" }]);
  const updateRevisionNewItem = (idx: number, field: keyof RevisionNewItemDraft, value: string) => {
    setRevisionNewItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it)));
  };
  const removeRevisionNewItem = (idx: number) => setRevisionNewItems((prev) => prev.filter((_, i) => i !== idx));

  const handleRevisionRequest = async () => {
    if (!revisionReason.trim()) { setRevisionError("Please describe the correction needed."); return; }

    const original = new Map(order.items.map((i) => [i.id, i]));
    const changedItems = revisionItems
      .filter((it) => !it.remove)
      .map((it) => {
        const orig = original.get(it.id);
        if (!orig) return null;
        const patch: Record<string, unknown> = { id: it.id };
        let changed = false;
        if (it.name.trim() !== (orig.product_name ?? "")) { patch.name = it.name.trim(); changed = true; }
        if (parseFloat(it.unit_price) !== Number(orig.unit_price)) { patch.unit_price = parseFloat(it.unit_price); changed = true; }
        if (parseInt(it.quantity, 10) !== orig.quantity) { patch.quantity = parseInt(it.quantity, 10); changed = true; }
        return changed ? patch : null;
      })
      .filter((p): p is Record<string, unknown> => p !== null);
    const removeIds = revisionItems.filter((it) => it.remove).map((it) => it.id);
    const newItems = revisionNewItems
      .filter((it) => it.name.trim() && it.unit_price.trim() && it.quantity.trim())
      .map((it) => ({ name: it.name.trim(), unit_price: parseFloat(it.unit_price), quantity: parseInt(it.quantity, 10) }));

    // Client-side guard mirroring the backend's revision_would_empty_order check.
    const remainingCount = order.items.length - removeIds.length + newItems.length;
    if (remainingCount <= 0) {
      setRevisionError("This revision would remove every item on the order — add a replacement item or leave at least one in place.");
      return;
    }

    setRevisionLoading(true);
    setRevisionError(null);
    try {
      const body: Record<string, unknown> = { reason: revisionReason.trim() };
      const changes: Record<string, unknown> = {};
      const fee = parseFloat(revisionDeliveryFee);
      if (revisionDeliveryFee.trim() && !isNaN(fee)) changes.delivery_fee = fee;
      if (changedItems.length) changes.items = changedItems;
      if (newItems.length) changes.new_items = newItems;
      if (removeIds.length) changes.remove_item_ids = removeIds;
      if (Object.keys(changes).length) body.changes = changes;

      const res  = await fetch(`/api/admin/orders/${order.id}/financials/revision-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({})) as Record<string, unknown>;
      if (!res.ok) {
        const code = json.code as string | undefined;
        if (code === "revision_would_empty_order") setRevisionError("This revision would remove every item on the order — add a replacement item or leave at least one in place.");
        else setRevisionError((json.message as string) ?? "Failed to submit revision request.");
        return;
      }
      closeRevisionModal();
      setRevisionRequired(true);
      setRevisionSubmitted(true);
      setTimeout(() => setRevisionSubmitted(false), 5000);
      router.refresh();
    } catch {
      setRevisionError("Network error. Please try again.");
    } finally {
      setRevisionLoading(false);
    }
  };

  const handleApproveRevision = async () => {
    setApproveLoading(true);
    setApproveError(null);
    try {
      const res  = await fetch(`/api/admin/orders/${order.id}/financials/approve-revision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json().catch(() => ({})) as Record<string, unknown>;
      if (!res.ok) {
        setApproveError((json.message as string) ?? "Failed to approve revision.");
        return;
      }
      setApproveModalOpen(false);
      setApproveConfirmed(false);
      setRevisionRequired(false);
      router.refresh();
    } catch {
      setApproveError("Network error. Please try again.");
    } finally {
      setApproveLoading(false);
    }
  };

  const handleRejectRevision = async () => {
    setRejectLoading(true);
    setRejectError(null);
    try {
      const res  = await fetch(`/api/admin/orders/${order.id}/financials/reject-revision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json().catch(() => ({})) as Record<string, unknown>;
      if (!res.ok) {
        setRejectError((json.message as string) ?? "Failed to reject revision.");
        return;
      }
      setRevisionRequired(false);
      setRejectSuccess(true);
      setTimeout(() => setRejectSuccess(false), 4000);
      router.refresh();
    } catch {
      setRejectError("Network error. Please try again.");
    } finally {
      setRejectLoading(false);
    }
  };

  const handleSendAcceptance = async () => {
    setSendAcceptLoading(true);
    setSendAcceptError(null);
    setSendAcceptSuccess(false);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/acceptance/send`, { method: "POST" });
      const json = await res.json().catch(() => ({})) as Record<string, unknown>;
      if (!res.ok) {
        setSendAcceptError((json.message as string) ?? "Failed to send. Please try again.");
        return;
      }
      setSendAcceptSuccess(true);
      setTimeout(() => setSendAcceptSuccess(false), 5000);
    } catch {
      setSendAcceptError("Network error. Please try again.");
    } finally {
      setSendAcceptLoading(false);
    }
  };

  const handleCopyAcceptLink = () => {
    if (!order.acceptance_token) return;
    const link = `${SITE_URL}/documents/accept/${order.acceptance_token}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedAcceptLink(true);
      setTimeout(() => setCopiedAcceptLink(false), 2500);
    });
  };

  const isDirty =
    status            !== order.status                                            ||
    carrier           !== (order.carrier ?? "")                                   ||
    carrierType       !== (order.carrier_type ?? "")                              ||
    trackingNumber    !== (order.tracking_number ?? "")                           ||
    estimatedDelivery !== toDateInputValue(order.estimated_delivery ?? order.eta) ||
    currency          !== (order.currency ?? "EUR");

  const handleSave = () => {
    setSaveError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateOrderStatus(order.id, status, {
        carrier:            carrier           || undefined,
        carrier_type:       carrierType       || undefined,
        tracking_number:    trackingNumber    || undefined,
        estimated_delivery: estimatedDelivery || undefined,
        currency:           currency          || undefined,
      });
      if (result.error) {
        setSaveError(result.error);
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        router.push("/admin/orders");
      }
    });
  };

  const handleCancel = () => {
    setCancelError(null);
    setCancelSuccess(false);
    startCancelTransition(async () => {
      const result = await cancelOrder(order.id);
      if (result.error) {
        setCancelError(result.error);
      } else {
        setCancelSuccess(true);
        setStatus("cancelled");
        setTimeout(() => setCancelSuccess(false), 4000);
      }
    });
  };

  const handleDelete = () => {
    setDeleteError(null);
    startDeleteTransition(async () => {
      const result = await deleteOrder(order.id, deleteRef);
      if (result.error) {
        setDeleteError(result.error);
      } else if (result.deleted) {
        router.push("/admin/orders");
      }
    });
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setDeleteRef("");
    setDeleteError(null);
  };

  const closeMarkPaidModal = () => {
    setMarkPaidOpen(false);
    setMarkPaidConfirmed(false);
    setPaymentRef("");
    setAdminNote("");
    setMarkPaidError(null);
  };

  const handleMarkPaid = async () => {
    setMarkPaidError(null);
    setIsMarkPaidPending(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/mark-paid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmation:      true,
          payment_reference: paymentRef  || undefined,
          admin_note:        adminNote   || undefined,
        }),
      });
      const json = await res.json().catch(() => ({})) as Record<string, unknown>;
      if (!res.ok) {
        const msg = (json?.message ?? json?.error) as string | undefined;
        setMarkPaidError(msg ?? "Something went wrong. Please try again.");
        return;
      }
      setPaymentStatus("paid");
      closeMarkPaidModal();
      setMarkPaidSuccess(true);
      setTimeout(() => setMarkPaidSuccess(false), 5000);
      router.refresh();
    } catch {
      setMarkPaidError("Could not connect to the server. Please try again.");
    } finally {
      setIsMarkPaidPending(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-5">

      {/* ══════════════════════════════════════════════════════════════════════
          WORKFLOW COMMAND CENTER
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">

        {/* Header row */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.06] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <Activity size={14} strokeWidth={2} className="text-[#E85C1A]" />
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[#E85C1A]">
              Command Center
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[0.83rem] font-bold text-[#1a1a1a]">{order.order_ref}</span>
            <StatusBadge status={order.status} />
            {paymentStatus === "paid" && (
              <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-[0.72rem] font-bold text-emerald-700">
                Paid
              </span>
            )}
            {paymentStatus === "pending" && (
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-[0.72rem] font-bold text-amber-700">
                Payment Pending
              </span>
            )}
          </div>
        </div>

        {/* Status pills row */}
        <div className="flex flex-wrap items-center gap-2 px-5 py-3 border-b border-black/[0.06]">
          {/* Financial state */}
          {isLocked && !revisionRequired && (
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-[0.7rem] font-semibold text-indigo-700">
              <Lock size={10} strokeWidth={2.5} />
              Financials Locked
            </span>
          )}
          {revisionRequired && (
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-0.5 text-[0.7rem] font-semibold text-orange-700">
              <AlertTriangle size={10} strokeWidth={2.5} />
              Revision Pending
            </span>
          )}
          {/* Customer acceptance */}
          {order.customer_acceptance_status === "pending" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[0.7rem] font-semibold text-amber-700">
              <UserCheck size={10} strokeWidth={2.5} />
              Acceptance Pending
            </span>
          )}
          {order.customer_acceptance_status === "accepted" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[0.7rem] font-semibold text-emerald-700">
              <UserCheck size={10} strokeWidth={2.5} />
              Accepted
            </span>
          )}
          {order.customer_acceptance_status === "rejected" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-[0.7rem] font-semibold text-red-600">
              <UserCheck size={10} strokeWidth={2.5} />
              Rejected by Customer
            </span>
          )}
          {/* Payment stage */}
          {order.payment_stage && order.payment_stage !== "pending_proforma" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-[0.7rem] font-semibold text-blue-700">
              {order.payment_stage.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </span>
          )}
          {/* EU declaration */}
          {order.declaration_required && order.declaration_status !== "acknowledged" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-[0.7rem] font-semibold text-purple-700">
              EU Declaration Pending
            </span>
          )}
        </div>

        {/* Next action block */}
        <div className={`border-l-4 ${ps.border} ${ps.bg} px-5 py-4`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className={`mt-0.5 shrink-0 ${ps.icon}`}>
                {nextAction.priority === "red"   && <AlertOctagon size={15} strokeWidth={2} />}
                {nextAction.priority === "amber" && <AlertTriangle size={15} strokeWidth={2} />}
                {nextAction.priority === "blue"  && <ArrowRight size={15} strokeWidth={2} />}
                {nextAction.priority === "green" && <CheckCircle2 size={15} strokeWidth={2} />}
              </div>
              <div>
                <p className={`text-[0.83rem] font-bold ${ps.text}`}>{nextAction.label}</p>
                <p className={`mt-0.5 text-[0.75rem] ${ps.sub}`}>{nextAction.sublabel}</p>
              </div>
            </div>
            {nextAction.tab !== activeTab && (
              <button
                type="button"
                onClick={() => setActiveTab(nextAction.tab)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.73rem] font-semibold transition ${
                  nextAction.priority === "red"
                    ? "border-red-300 bg-white text-red-700 hover:bg-red-50"
                    : nextAction.priority === "green"
                    ? "border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-50"
                    : nextAction.priority === "blue"
                    ? "border-blue-300 bg-white text-blue-700 hover:bg-blue-50"
                    : "border-amber-300 bg-white text-amber-700 hover:bg-amber-50"
                }`}
              >
                Go to {nextAction.tab.charAt(0).toUpperCase() + nextAction.tab.slice(1)}
                <ChevronRight size={12} strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB NAVIGATION
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="flex gap-1 overflow-x-auto rounded-2xl bg-white p-1.5 shadow-sm [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {TAB_LABELS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2 text-[0.8rem] font-semibold transition ${
              activeTab === tab.id
                ? "bg-[#1a1a1a] text-white"
                : "text-[#5c5e62] hover:bg-[#f5f5f5] hover:text-[#1a1a1a]"
            }`}
          >
            {tab.label}
            {TAB_BADGES[tab.id] && (
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            )}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: OVERVIEW
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "overview" && (
        <>
          {/* Status + Shipment update card */}
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="mb-4 text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#E85C1A]">
              Order Status &amp; Shipment
            </p>

            {saveError && (
              <div className="mb-4 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[0.83rem] text-red-700">
                <AlertCircle size={15} className="shrink-0" />
                {saveError}
              </div>
            )}
            {saved && (
              <div className="mb-4 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[0.83rem] text-emerald-700">
                <CheckCircle2 size={15} className="shrink-0" />
                Order updated successfully.
              </div>
            )}

            <div className="flex flex-wrap items-end gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">Current</span>
                <StatusBadge status={order.status} />
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">New status</span>
                <div className="relative">
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as OrderStatus)}
                    className="h-10 appearance-none rounded-xl border border-black/[0.09] bg-white pl-3.5 pr-9 text-[0.875rem] font-semibold text-[#1a1a1a] outline-none transition focus:border-[#E85C1A] focus:ring-2 focus:ring-[#E85C1A]/10"
                  >
                    {ORDER_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABEL[s] ?? s.charAt(0).toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#5c5e62]" />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">Currency</span>
                <div className="relative">
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="h-10 appearance-none rounded-xl border border-black/[0.09] bg-white pl-3.5 pr-9 text-[0.875rem] font-semibold text-[#1a1a1a] outline-none transition focus:border-[#E85C1A] focus:ring-2 focus:ring-[#E85C1A]/10"
                  >
                    {ORDER_CURRENCIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#5c5e62]" />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">Carrier</span>
                <input
                  type="text"
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  placeholder="e.g. DHL Freight"
                  className="h-10 w-40 rounded-xl border border-black/[0.09] bg-white px-3.5 text-[0.875rem] text-[#1a1a1a] outline-none placeholder:text-[#aaa] transition focus:border-[#E85C1A] focus:ring-2 focus:ring-[#E85C1A]/10"
                />
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">Carrier type</span>
                <div className="relative">
                  <select
                    value={carrierType}
                    onChange={(e) => setCarrierType(e.target.value)}
                    className="h-10 appearance-none rounded-xl border border-black/[0.09] bg-white pl-3.5 pr-9 text-[0.875rem] text-[#1a1a1a] outline-none transition focus:border-[#E85C1A] focus:ring-2 focus:ring-[#E85C1A]/10"
                  >
                    <option value="">— select —</option>
                    <option value="truck">Truck Freight</option>
                    <option value="road">Road Freight</option>
                    <option value="dhl">DHL</option>
                    <option value="sea">Sea Freight</option>
                    <option value="air">Air Freight</option>
                  </select>
                  <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#5c5e62]" />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">Tracking / Waybill</span>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Ref or waybill number"
                  className="h-10 w-44 rounded-xl border border-black/[0.09] bg-white px-3.5 font-mono text-[0.875rem] text-[#1a1a1a] outline-none placeholder:font-sans placeholder:text-[#aaa] transition focus:border-[#E85C1A] focus:ring-2 focus:ring-[#E85C1A]/10"
                />
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">Est. Delivery</span>
                <input
                  type="date"
                  value={estimatedDelivery}
                  onChange={(e) => setEstimatedDelivery(e.target.value)}
                  className="h-10 rounded-xl border border-black/[0.09] bg-white px-3.5 text-[0.875rem] text-[#1a1a1a] outline-none transition focus:border-[#E85C1A] focus:ring-2 focus:ring-[#E85C1A]/10"
                />
              </div>

              <button
                type="button"
                onClick={handleSave}
                disabled={isPending || !isDirty}
                className="h-10 self-end rounded-full bg-[#E85C1A] px-6 text-[0.875rem] font-semibold text-white transition hover:bg-[#d14f14] disabled:opacity-50"
              >
                {isPending ? "Saving…" : "Save"}
              </button>
            </div>
          </div>

          {/* Two-column: customer info + order summary */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <p className="mb-5 text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#E85C1A]">
                Customer Details
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InfoRow label="Name"    value={order.customer_name} />
                <InfoRow label="Email"   value={order.customer_email} />
                <InfoRow label="Phone"   value={order.phone} />
                <InfoRow label="Company" value={order.company_name} />
                <InfoRow label="Country" value={order.country} />
                <InfoRow label="Address" value={order.address} />
              </div>
              {order.notes && (
                <div className="mt-4 rounded-xl bg-[#f5f5f5] px-4 py-3">
                  <p className="text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">Notes</p>
                  <p className="mt-1 text-[0.875rem] text-[#1a1a1a]">{order.notes}</p>
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between gap-3">
                <p className="text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#E85C1A]">
                  Order Summary
                </p>
                {canDo(adminRole, "tracking.view") && (
                  <TrackShipmentControl orderId={order.id} carrier={order.carrier} trackingNumber={order.tracking_number} />
                )}
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InfoRow label="Order Ref"        value={order.order_ref} />
                <InfoRow label="Payment Method"   value={order.payment_method} />
                <InfoRow label="Placed On"        value={shortDate(order.created_at)} />
                <InfoRow label="Last Updated"     value={shortDate(order.updated_at)} />
                <InfoRow label="Carrier"          value={order.carrier} />
                <InfoRow label="Carrier Type"     value={order.carrier_type} />
                <InfoRow label="Tracking No."     value={order.tracking_number} />
                <InfoRow label="Est. Delivery"    value={shortDateOnly(order.estimated_delivery ?? order.eta)} />
              </div>
              <div className="mt-5 flex items-center justify-between rounded-xl bg-[#f5f5f5] px-4 py-3">
                <span className="text-[0.83rem] font-semibold text-[#5c5e62]">Order Total</span>
                <span className="text-[1.15rem] font-extrabold text-[#1a1a1a]">
                  {formatMoney(order.total, order.currency)}
                </span>
              </div>
            </div>
          </div>

          {/* eBay source panel — only for eBay-sourced orders */}
          {order.source === "ebay" && (
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-black/[0.06] border-l-4 border-l-green-500 px-6 py-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-green-100">
                  <ShoppingBag size={15} strokeWidth={2} className="text-green-700" />
                </div>
                <p className="text-[0.7rem] font-bold uppercase tracking-[0.15em] text-green-700">
                  eBay Order
                </p>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 px-6 py-5 sm:grid-cols-3">
                {order.ebay_order_id && (
                  <div>
                    <p className="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">eBay Order ID</p>
                    <p className="mt-0.5 font-mono text-[0.83rem] text-[#1a1a1a]">{order.ebay_order_id}</p>
                  </div>
                )}
                {order.ebay_buyer_username && (
                  <div>
                    <p className="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">Buyer</p>
                    <p className="mt-0.5 text-[0.83rem] text-[#1a1a1a]">{order.ebay_buyer_username}</p>
                  </div>
                )}
                {order.ebay_payment_status && (
                  <div>
                    <p className="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">eBay Payment</p>
                    <span className={`mt-0.5 inline-flex items-center rounded-full px-2 py-0.5 text-[0.68rem] font-bold ${order.ebay_payment_status === "PAID" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                      {order.ebay_payment_status}
                    </span>
                  </div>
                )}
                {order.ebay_fulfillment_status && (
                  <div>
                    <p className="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">Fulfillment</p>
                    <span className={`mt-0.5 inline-flex items-center rounded-full px-2 py-0.5 text-[0.68rem] font-bold ${order.ebay_fulfillment_status === "FULFILLED" ? "bg-emerald-100 text-emerald-700" : order.ebay_fulfillment_status === "CANCELLED" ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-700"}`}>
                      {order.ebay_fulfillment_status.replace(/_/g, " ")}
                    </span>
                  </div>
                )}
                {order.ebay_last_synced_at && (
                  <div>
                    <p className="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">Last Synced</p>
                    <p className="mt-0.5 text-[0.83rem] text-[#5c5e62]">{shortDate(order.ebay_last_synced_at)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Order items */}
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-black/[0.06] px-6 py-4">
              <p className="text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#E85C1A]">
                Order Items
              </p>
              {canEditItems && (
                <button type="button" onClick={openAddItem}
                  className="flex items-center gap-1.5 rounded-full border border-black/[0.09] bg-white px-3.5 py-1.5 text-[0.78rem] font-semibold text-[#5c5e62] transition hover:bg-[#f5f5f5]">
                  <Plus size={13} /> Add Item
                </button>
              )}
            </div>
            {isEbayOrder && (
              <div className="flex items-center gap-2.5 border-b border-black/[0.06] bg-[#fafafa] px-6 py-3">
                <Lock size={13} className="shrink-0 text-[#9ca3af]" />
                <p className="text-[0.78rem] text-[#5c5e62]">Synced from eBay — line items aren&apos;t editable here.</p>
              </div>
            )}
            {!isEbayOrder && isLocked && (
              <div className="flex items-center gap-2.5 border-b border-black/[0.06] bg-indigo-50 px-6 py-3">
                <Lock size={13} className="shrink-0 text-indigo-500" />
                <p className="text-[0.78rem] text-indigo-700">Financials are locked — use &ldquo;Request Financial Revision&rdquo; below to correct an item.</p>
              </div>
            )}
            {!order.items?.length ? (
              <p className="px-6 py-8 text-center text-[0.875rem] text-[#5c5e62]">
                No item details available.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left">
                  <thead>
                    <tr className="border-b border-black/[0.05] bg-[#fafafa]">
                      {["Product", "SKU", "Size", "Qty", "Unit Price", "Subtotal", ""].map((h, i) => (
                        <th key={i} className="px-4 py-3 text-[0.7rem] font-bold uppercase tracking-[0.12em] text-[#5c5e62]">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.04]">
                    {order.items.map((item) => (
                      <tr key={item.id} className="hover:bg-[#fafafa]">
                        <td className="px-4 py-3">
                          <p className="text-[0.875rem] font-semibold text-[#1a1a1a]">{item.product_name}</p>
                          {item.brand && <p className="text-[0.73rem] text-[#5c5e62]">{item.brand}</p>}
                        </td>
                        <td className="px-4 py-3 font-mono text-[0.78rem] text-[#5c5e62]">
                          {item.sku ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-[0.83rem] text-[#5c5e62]">
                          {item.size ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-[0.875rem] font-semibold text-[#1a1a1a]">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-3 text-[0.875rem] text-[#1a1a1a]">
                          {formatMoney(item.unit_price, order.currency)}
                        </td>
                        <td className="px-4 py-3 text-[0.875rem] font-semibold text-[#1a1a1a]">
                          {formatMoney(item.subtotal, order.currency)}
                        </td>
                        <td className="px-4 py-3">
                          {canEditItems && (
                            <div className="flex items-center justify-end gap-1.5">
                              <button type="button" title="Edit item" onClick={() => openEditItem(item)}
                                className="flex h-7 w-7 items-center justify-center rounded-lg border border-black/[0.08] text-[#5c5e62] transition hover:bg-[#f0f2f5] hover:text-[#1a1a1a]">
                                <Pencil size={12} />
                              </button>
                              <button type="button" title={order.items.length === 1 ? "Can't delete the only item" : "Remove item"}
                                disabled={order.items.length === 1}
                                onClick={() => setDeleteItemTarget(item)}
                                className="flex h-7 w-7 items-center justify-center rounded-lg border border-black/[0.08] text-red-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30">
                                <Trash2 size={12} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-black/[0.06] bg-[#fafafa]">
                      <td colSpan={5} className="px-4 py-3 text-right text-[0.83rem] font-bold uppercase tracking-wide text-[#5c5e62]">
                        Total
                      </td>
                      <td className="px-4 py-3 text-[0.95rem] font-extrabold text-[#1a1a1a]">
                        {formatMoney(order.total, order.currency)}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Order Actions */}
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="mb-4 text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#5c5e62]">
              Order Actions
            </p>

            <div className="flex flex-wrap gap-3">
              {isLocked && !revisionRequired && canCancel && !isEbayOrder && (
                <button
                  type="button"
                  onClick={openRevisionModal}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full border border-indigo-300 bg-indigo-50 px-5 text-[0.83rem] font-semibold text-indigo-700 transition hover:bg-indigo-100"
                >
                  <RotateCcw size={13} strokeWidth={2} />
                  Request Financial Revision
                </button>
              )}

              {canCancel && (
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isCancelPending || cancelDisabled}
                  className="h-9 rounded-full border border-amber-300 bg-amber-50 px-5 text-[0.83rem] font-semibold text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                  title={cancelDisabled ? `Order is already ${status}` : undefined}
                >
                  {isCancelPending ? "Cancelling…" : "Cancel Order"}
                </button>
              )}

              {order.payment_method === "bank_transfer" && paymentStatus === "pending" && (
                <button
                  type="button"
                  onClick={() => setMarkPaidOpen(true)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-5 text-[0.83rem] font-semibold text-emerald-700 transition hover:bg-emerald-100"
                >
                  <Landmark size={13} strokeWidth={2} />
                  Mark as Paid
                </button>
              )}

              <button
                type="button"
                onClick={() => setDeleteModalOpen(true)}
                disabled={!canDelete}
                className="h-9 rounded-full border border-red-200 bg-red-50 px-5 text-[0.83rem] font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                title={!canDelete ? "Only super admins can delete orders" : undefined}
              >
                Delete Order
              </button>
            </div>

            {cancelError && (
              <div className="mt-3 flex items-center gap-2 text-[0.83rem] text-red-600">
                <AlertCircle size={14} className="shrink-0" />
                {cancelError}
              </div>
            )}
            {cancelSuccess && (
              <div className="mt-3 flex items-center gap-2 text-[0.83rem] text-emerald-600">
                <CheckCircle2 size={14} className="shrink-0" />
                Order cancelled successfully.
              </div>
            )}
            {markPaidSuccess && (
              <div className="mt-3 flex items-center gap-2 text-[0.83rem] text-emerald-600">
                <CheckCircle2 size={14} className="shrink-0" />
                Payment marked as received.
              </div>
            )}
            {revisionSubmitted && (
              <div className="mt-3 flex items-center gap-2 text-[0.83rem] text-indigo-700">
                <CheckCircle2 size={14} className="shrink-0" />
                Revision request submitted. Awaiting admin approval.
              </div>
            )}
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: PAYMENTS
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "payments" && (
        <>
          {/* Financial Lock Banner */}
          {isLocked && !revisionRequired && (
            <div className="flex items-start gap-3.5 rounded-2xl border border-indigo-200 bg-indigo-50 px-5 py-4">
              <Lock size={16} className="mt-0.5 shrink-0 text-indigo-500" strokeWidth={2} />
              <div className="min-w-0 flex-1">
                <p className="text-[0.83rem] font-bold text-indigo-800">Financials Locked</p>
                <p className="mt-0.5 text-[0.78rem] text-indigo-700">
                  {order.financials_lock_reason ?? "A commercial document has been issued for this order."}
                  {order.financials_locked_at && (
                    <span className="ml-1.5 text-indigo-500">· {shortDate(order.financials_locked_at)}</span>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Pending Financial Revision Card */}
          {revisionRequired && (
            <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5">
              <div className="flex items-start gap-3.5">
                <FileWarning size={16} className="mt-0.5 shrink-0 text-orange-500" strokeWidth={2} />
                <div className="min-w-0 flex-1">
                  <p className="text-[0.83rem] font-bold text-orange-800">Financial Revision Pending</p>
                  {order.financials_revision_reason && (
                    <p className="mt-0.5 text-[0.78rem] text-orange-700">
                      Reason: {order.financials_revision_reason}
                    </p>
                  )}
                  <p className="mt-1 text-[0.75rem] text-orange-600">
                    Existing commercial documents will be superseded upon approval and corrected versions regenerated.
                  </p>
                </div>
              </div>

              {canApproveRevision && (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setApproveModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-1.5 text-[0.78rem] font-semibold text-white transition hover:bg-emerald-700"
                  >
                    <CheckCircle2 size={12} strokeWidth={2.5} />
                    Approve Revision
                  </button>
                  <button
                    type="button"
                    onClick={handleRejectRevision}
                    disabled={rejectLoading}
                    className="inline-flex items-center gap-1.5 rounded-full border border-red-300 bg-white px-4 py-1.5 text-[0.78rem] font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                  >
                    {rejectLoading && <Loader2 size={12} className="animate-spin" />}
                    {rejectLoading ? "Rejecting…" : "Reject"}
                  </button>
                  {rejectError && (
                    <p className="text-[0.78rem] text-red-600">{rejectError}</p>
                  )}
                  {rejectSuccess && (
                    <p className="text-[0.78rem] text-emerald-700">Revision rejected.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Customer Acceptance Status Card */}
          {order.customer_acceptance_status != null && (
            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <UserCheck size={14} className="shrink-0 text-[#E85C1A]" strokeWidth={2} />
                <p className="text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#E85C1A]">
                  Customer Acceptance
                </p>
              </div>

              {order.customer_acceptance_status === "pending" && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-[0.72rem] font-bold text-amber-700">
                      Pending
                    </span>
                    <p className="text-[0.83rem] text-[#5c5e62]">
                      Awaiting customer review and acceptance of the order confirmation.
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleSendAcceptance}
                      disabled={sendAcceptLoading}
                      className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3.5 py-1.5 text-[0.75rem] font-semibold text-amber-800 transition hover:bg-amber-100 disabled:opacity-60"
                    >
                      {sendAcceptLoading
                        ? <><Loader2 size={12} className="animate-spin" /> Sending…</>
                        : <><Mail size={12} strokeWidth={2} /> Send Acceptance Email</>
                      }
                    </button>

                    {order.acceptance_token && (
                      <button
                        type="button"
                        onClick={handleCopyAcceptLink}
                        className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.1] bg-[#fafafa] px-3.5 py-1.5 text-[0.75rem] font-semibold text-[#5c5e62] transition hover:bg-[#f0f0f0]"
                      >
                        <Copy size={12} strokeWidth={2} />
                        {copiedAcceptLink ? "Copied!" : "Copy Acceptance Link"}
                      </button>
                    )}
                  </div>

                  {sendAcceptSuccess && (
                    <p className="text-[0.75rem] text-emerald-700">
                      Acceptance email sent to customer.
                    </p>
                  )}
                  {sendAcceptError && (
                    <p className="text-[0.75rem] text-red-600">{sendAcceptError}</p>
                  )}
                </div>
              )}

              {order.customer_acceptance_status === "accepted" && (
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-[0.72rem] font-bold text-emerald-700">
                    Accepted
                  </span>
                  <p className="text-[0.83rem] text-[#5c5e62]">
                    Customer accepted on{" "}
                    {order.customer_accepted_at ? shortDate(order.customer_accepted_at) : "—"}.
                  </p>
                </div>
              )}

              {order.customer_acceptance_status === "rejected" && (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-[0.72rem] font-bold text-red-600">
                      Rejected
                    </span>
                    <p className="text-[0.83rem] text-[#5c5e62]">Customer declined this document.</p>
                  </div>
                  {order.customer_rejection_reason && (
                    <p className="mt-1 rounded-xl bg-[#fafafa] px-3.5 py-2.5 text-[0.83rem] italic text-[#5c5e62]">
                      &ldquo;{order.customer_rejection_reason}&rdquo;
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Payment Milestones Card */}
          {order.payment_stage != null && (
            <PaymentMilestonesCard
              orderId={order.id}
              adminRole={adminRole}
              currency={order.currency ?? "EUR"}
              initialStage={order.payment_stage}
              depositPercent={order.deposit_percent ?? null}
              depositAmount={order.deposit_amount ?? null}
              balanceAmount={order.balance_amount ?? null}
              depositPaidAt={order.deposit_paid_at ?? null}
              balancePaidAt={order.balance_paid_at ?? null}
              shipmentReleasedAt={order.shipment_released_at ?? null}
              shipmentReleaseNote={order.shipment_release_note ?? null}
              depositRequestedEmailAt={order.deposit_requested_email_sent_at ?? null}
              depositPaidEmailAt={order.deposit_paid_email_sent_at ?? null}
              balanceDueEmailAt={order.balance_due_email_sent_at ?? null}
              balancePaidEmailAt={order.balance_paid_email_sent_at ?? null}
              shipmentReleasedEmailAt={order.shipment_released_email_sent_at ?? null}
            />
          )}

          {/* Mark bank transfer paid (shortcut from payments tab) */}
          {order.payment_method === "bank_transfer" && paymentStatus === "pending" && (
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="mb-3 text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#5c5e62]">
                Payment Receipt
              </p>
              <button
                type="button"
                onClick={() => setMarkPaidOpen(true)}
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-5 text-[0.83rem] font-semibold text-emerald-700 transition hover:bg-emerald-100"
              >
                <Landmark size={13} strokeWidth={2} />
                Mark Bank Transfer as Paid
              </button>
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: DOCUMENTS
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "documents" && (
        <TradeDocumentsCard
          orderId={order.id}
          initialDocuments={order.trade_documents ?? []}
          adminRole={adminRole}
          customerEmail={order.customer_email}
          financialsRevisionPending={revisionRequired}
          customerAcceptancePending={customerAcceptancePending}
          paymentStage={order.payment_stage ?? null}
          orderStatus={order.status}
        />
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: LOGISTICS
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "logistics" && (
        <div className="flex flex-col gap-5">
          <ShipmentEventManager orderId={order.id} initialEvents={order.shipment_events ?? []} />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: COMPLIANCE
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "compliance" && (
        <>
          {order.declaration_required != null ? (
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <p className="mb-4 text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#E85C1A]">
                EU Entry Certificate
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="flex flex-col gap-0.5">
                  <p className="text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">Required</p>
                  <p className="text-[0.875rem] text-[#1a1a1a]">
                    {order.declaration_required ? "Yes" : "No"}
                  </p>
                </div>
                {order.declaration_required && (
                  <>
                    <div className="flex flex-col gap-0.5">
                      <p className="text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">Status</p>
                      <span className={`inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-[0.72rem] font-bold capitalize ${
                        order.declaration_status === "acknowledged"
                          ? "bg-emerald-100 text-emerald-700"
                          : order.declaration_status === "signed"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-amber-100 text-amber-700"
                      }`}>
                        {order.declaration_status ?? "pending"}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <p className="text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">Declaration ID</p>
                      {order.declaration_id != null ? (
                        <a
                          href={`/admin/eu-declarations/${order.declaration_id}`}
                          className="font-mono text-[0.875rem] font-semibold text-[#E85C1A] hover:underline"
                        >
                          #{order.declaration_id}
                        </a>
                      ) : (
                        <p className="text-[0.875rem] text-[#5c5e62]">—</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <p className="text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">Signed At</p>
                      <p className="text-[0.875rem] text-[#1a1a1a]">
                        {order.declaration_signed_at ? shortDate(order.declaration_signed_at) : "—"}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <p className="text-[0.875rem] text-[#5c5e62]">
                No EU entry certificate requirement has been set for this order.
              </p>
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: ACTIVITY
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "activity" && (
        <ActivityLog logs={order.logs} />
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODALS (always mounted — shown/hidden by their own state)
      ══════════════════════════════════════════════════════════════════════ */}

      {/* Mark bank transfer as paid modal */}
      {markPaidOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <p className="mb-1 text-[0.75rem] font-bold uppercase tracking-[0.15em] text-emerald-700">
              Mark Bank Transfer as Paid
            </p>

            <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[0.83rem] text-amber-800">
              <AlertCircle size={14} className="mt-0.5 shrink-0 text-amber-600" />
              Confirm only after payment appears in the Okelcor bank / Wise account.
            </div>

            <label className="mb-4 flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={markPaidConfirmed}
                onChange={(e) => setMarkPaidConfirmed(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-emerald-600"
              />
              <span className="text-[0.875rem] text-[#1a1a1a]">
                I confirm payment has been received.
              </span>
            </label>

            <div className="mb-3">
              <p className="mb-1.5 text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">
                Payment Reference (optional)
              </p>
              <input
                type="text"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                placeholder="e.g. Wise transaction ID"
                className="h-10 w-full rounded-xl border border-black/[0.09] bg-white px-3.5 text-[0.875rem] text-[#1a1a1a] outline-none placeholder:text-[#aaa] transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div className="mb-4">
              <p className="mb-1.5 text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">
                Admin Note (optional)
              </p>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Internal note about this payment…"
                rows={3}
                className="w-full resize-none rounded-xl border border-black/[0.09] bg-white px-3.5 py-2.5 text-[0.875rem] text-[#1a1a1a] outline-none placeholder:text-[#aaa] transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            {markPaidError && (
              <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-[0.83rem] text-red-700">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                {markPaidError}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeMarkPaidModal}
                disabled={isMarkPaidPending}
                className="h-9 rounded-full border border-black/[0.09] bg-white px-5 text-[0.83rem] font-semibold text-[#5c5e62] transition hover:border-black/20 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleMarkPaid}
                disabled={isMarkPaidPending || !markPaidConfirmed}
                className="h-9 rounded-full bg-emerald-600 px-5 text-[0.83rem] font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                {isMarkPaidPending ? "Saving…" : "Confirm Payment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <p className="mb-1 text-[0.75rem] font-bold uppercase tracking-[0.15em] text-red-600">
              Delete Order
            </p>
            <p className="mb-5 text-[0.875rem] text-[#1a1a1a]">
              This is permanent and cannot be undone. Type the order reference to confirm.
            </p>

            <p className="mb-1.5 text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">
              Order Reference
            </p>
            <input
              type="text"
              value={deleteRef}
              onChange={(e) => setDeleteRef(e.target.value)}
              placeholder={order.order_ref}
              autoFocus
              className="mb-4 h-10 w-full rounded-xl border border-black/[0.09] bg-white px-3.5 font-mono text-[0.875rem] text-[#1a1a1a] outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100"
            />

            {deleteError && (
              <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-[0.83rem] text-red-700">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                {deleteError}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={isDeletePending}
                className="h-9 rounded-full border border-black/[0.09] bg-white px-5 text-[0.83rem] font-semibold text-[#5c5e62] transition hover:border-black/20 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeletePending || deleteRef !== order.order_ref}
                className="h-9 rounded-full bg-red-600 px-5 text-[0.83rem] font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {isDeletePending ? "Deleting…" : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Item Modal */}
      {itemModalMode && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => { if (e.target === e.currentTarget && !itemModalLoading) closeItemModal(); }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <p className="mb-5 text-[0.75rem] font-bold uppercase tracking-[0.15em] text-[#E85C1A]">
              {itemModalMode === "add" ? "Add Item" : "Edit Item"}
            </p>

            <div className="flex flex-col gap-4">
              <div>
                <p className="mb-1.5 text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">Product Name *</p>
                <input type="text" value={itemName} onChange={(e) => setItemName(e.target.value)}
                  placeholder="205/55 R16"
                  className="h-10 w-full rounded-xl border border-black/[0.09] bg-white px-3.5 text-[0.875rem] text-[#1a1a1a] outline-none transition focus:border-[#E85C1A] focus:ring-2 focus:ring-[#E85C1A]/10" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="mb-1.5 text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">Brand</p>
                  <input type="text" value={itemBrand} onChange={(e) => setItemBrand(e.target.value)}
                    className="h-10 w-full rounded-xl border border-black/[0.09] bg-white px-3.5 text-[0.875rem] text-[#1a1a1a] outline-none transition focus:border-[#E85C1A] focus:ring-2 focus:ring-[#E85C1A]/10" />
                </div>
                <div>
                  <p className="mb-1.5 text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">SKU</p>
                  <input type="text" value={itemSku} onChange={(e) => setItemSku(e.target.value)}
                    className="h-10 w-full rounded-xl border border-black/[0.09] bg-white px-3.5 font-mono text-[0.875rem] text-[#1a1a1a] outline-none transition focus:border-[#E85C1A] focus:ring-2 focus:ring-[#E85C1A]/10" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="mb-1.5 text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">Size</p>
                  <input type="text" value={itemSize} onChange={(e) => setItemSize(e.target.value)}
                    className="h-10 w-full rounded-xl border border-black/[0.09] bg-white px-3.5 text-[0.875rem] text-[#1a1a1a] outline-none transition focus:border-[#E85C1A] focus:ring-2 focus:ring-[#E85C1A]/10" />
                </div>
                <div>
                  <p className="mb-1.5 text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">Unit Price *</p>
                  <input type="number" min="0" step="0.01" value={itemUnitPrice} onChange={(e) => setItemUnitPrice(e.target.value)}
                    className="h-10 w-full rounded-xl border border-black/[0.09] bg-white px-3.5 text-[0.875rem] text-[#1a1a1a] outline-none transition focus:border-[#E85C1A] focus:ring-2 focus:ring-[#E85C1A]/10" />
                </div>
                <div>
                  <p className="mb-1.5 text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">Qty *</p>
                  <input type="number" min="1" value={itemQuantity} onChange={(e) => setItemQuantity(e.target.value)}
                    className="h-10 w-full rounded-xl border border-black/[0.09] bg-white px-3.5 text-[0.875rem] text-[#1a1a1a] outline-none transition focus:border-[#E85C1A] focus:ring-2 focus:ring-[#E85C1A]/10" />
                </div>
              </div>
              <div>
                <p className="mb-1.5 text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">
                  Reason <span className="text-red-500">*</span>
                </p>
                <textarea value={itemReason} onChange={(e) => setItemReason(e.target.value)}
                  placeholder="e.g. Wrong price was quoted at entry — corrected to the agreed €75/unit."
                  rows={2}
                  className="w-full resize-none rounded-xl border border-black/[0.09] bg-white px-3.5 py-2.5 text-[0.875rem] text-[#1a1a1a] outline-none placeholder:text-[#aaa] transition focus:border-[#E85C1A] focus:ring-2 focus:ring-[#E85C1A]/10" />
                <p className="mt-1 text-[0.7rem] text-[#9ca3af]">Written to the order&apos;s audit log.</p>
              </div>

              {itemModalError && (
                <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-[0.83rem] text-red-700">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  {itemModalError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={closeItemModal} disabled={itemModalLoading}
                  className="h-9 rounded-full border border-black/[0.09] bg-white px-5 text-[0.83rem] font-semibold text-[#5c5e62] transition hover:border-black/20 disabled:opacity-50">
                  Cancel
                </button>
                <button type="button" onClick={submitItemModal} disabled={itemModalLoading || !itemReason.trim()}
                  className="h-9 rounded-full bg-[#E85C1A] px-5 text-[0.83rem] font-semibold text-white transition hover:bg-[#d14f14] disabled:opacity-50">
                  {itemModalLoading ? "Saving…" : itemModalMode === "add" ? "Add Item" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Item Modal */}
      {deleteItemTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => { if (e.target === e.currentTarget && !deleteItemLoading) { setDeleteItemTarget(null); setDeleteItemReason(""); setDeleteItemError(null); } }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <p className="mb-1 text-[0.75rem] font-bold uppercase tracking-[0.15em] text-red-600">
              Remove Item
            </p>
            <p className="mb-5 text-[0.875rem] text-[#1a1a1a]">
              Remove <span className="font-semibold">{deleteItemTarget.product_name}</span> from this order?
            </p>

            <p className="mb-1.5 text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">
              Reason <span className="text-red-500">*</span>
            </p>
            <textarea value={deleteItemReason} onChange={(e) => setDeleteItemReason(e.target.value)}
              placeholder="e.g. Duplicate line entered by mistake."
              rows={2} autoFocus
              className="mb-4 w-full resize-none rounded-xl border border-black/[0.09] bg-white px-3.5 py-2.5 text-[0.875rem] text-[#1a1a1a] outline-none placeholder:text-[#aaa] transition focus:border-red-400 focus:ring-2 focus:ring-red-100" />

            {deleteItemError && (
              <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-[0.83rem] text-red-700">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                {deleteItemError}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => { setDeleteItemTarget(null); setDeleteItemReason(""); setDeleteItemError(null); }}
                disabled={deleteItemLoading}
                className="h-9 rounded-full border border-black/[0.09] bg-white px-5 text-[0.83rem] font-semibold text-[#5c5e62] transition hover:border-black/20 disabled:opacity-50">
                Cancel
              </button>
              <button type="button" onClick={handleDeleteItem} disabled={deleteItemLoading || !deleteItemReason.trim()}
                className="h-9 rounded-full bg-red-600 px-5 text-[0.83rem] font-semibold text-white transition hover:bg-red-700 disabled:opacity-50">
                {deleteItemLoading ? "Removing…" : "Remove Item"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Financial Revision Modal */}
      {revisionModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => { if (e.target === e.currentTarget && !revisionLoading) closeRevisionModal(); }}
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <p className="mb-1 text-[0.75rem] font-bold uppercase tracking-[0.15em] text-indigo-600">
              Request Financial Revision
            </p>
            <p className="mb-5 text-[0.875rem] text-[#1a1a1a]">
              Financials are locked because a commercial document has been issued. Describe the correction — a super admin or admin will review and approve it.
            </p>

            <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto pr-1">
              <div>
                <p className="mb-1.5 text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">
                  Reason <span className="text-red-500">*</span>
                </p>
                <textarea
                  value={revisionReason}
                  onChange={(e) => setRevisionReason(e.target.value)}
                  placeholder="e.g. Client disputes the quoted unit price — confirmed correct figure with them by phone."
                  rows={3}
                  className="w-full resize-none rounded-xl border border-black/[0.09] bg-white px-3.5 py-2.5 text-[0.875rem] text-[#1a1a1a] outline-none placeholder:text-[#aaa] transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <p className="mb-1.5 text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">
                  Proposed Delivery Fee (EUR) <span className="text-[#9ca3af]">(optional)</span>
                </p>
                <input
                  type="number"
                  value={revisionDeliveryFee}
                  onChange={(e) => setRevisionDeliveryFee(e.target.value)}
                  placeholder="e.g. 2500.00"
                  step="0.01"
                  min="0"
                  className="h-10 w-full rounded-xl border border-black/[0.09] bg-white px-3.5 text-[0.875rem] text-[#1a1a1a] outline-none placeholder:text-[#aaa] transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              {/* Proposed item corrections */}
              {revisionItems.length > 0 && (
                <div>
                  <p className="mb-1.5 text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">
                    Item Corrections <span className="text-[#9ca3af]">(optional)</span>
                  </p>
                  <div className="space-y-2">
                    {revisionItems.map((it) => (
                      <div key={it.id} className={`rounded-xl border p-3 ${it.remove ? "border-red-200 bg-red-50/40" : "border-black/[0.08] bg-[#fafafa]"}`}>
                        <div className="grid grid-cols-12 gap-2">
                          <input value={it.name} disabled={it.remove} onChange={(e) => updateRevisionItem(it.id, "name", e.target.value)}
                            className="col-span-6 rounded-lg border border-black/[0.09] bg-white px-2.5 py-1.5 text-[0.8rem] text-[#1a1a1a] outline-none focus:border-indigo-400 disabled:opacity-50" />
                          <input type="number" step="0.01" min="0" value={it.unit_price} disabled={it.remove} onChange={(e) => updateRevisionItem(it.id, "unit_price", e.target.value)}
                            className="col-span-3 rounded-lg border border-black/[0.09] bg-white px-2.5 py-1.5 text-[0.8rem] text-[#1a1a1a] outline-none focus:border-indigo-400 disabled:opacity-50" placeholder="Unit €" />
                          <input type="number" min="1" value={it.quantity} disabled={it.remove} onChange={(e) => updateRevisionItem(it.id, "quantity", e.target.value)}
                            className="col-span-3 rounded-lg border border-black/[0.09] bg-white px-2.5 py-1.5 text-[0.8rem] text-[#1a1a1a] outline-none focus:border-indigo-400 disabled:opacity-50" placeholder="Qty" />
                        </div>
                        <label className="mt-2 flex cursor-pointer items-center gap-2">
                          <input type="checkbox" checked={it.remove} onChange={() => toggleRevisionRemove(it.id)} className="h-3.5 w-3.5 accent-red-600" />
                          <span className="text-[0.72rem] text-red-600">Remove this item</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New items to add */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <p className="text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">
                    New Items <span className="text-[#9ca3af]">(optional)</span>
                  </p>
                  <button type="button" onClick={addRevisionNewItem} className="flex items-center gap-1 text-[0.72rem] font-semibold text-indigo-600 hover:underline">
                    <Plus size={11} /> Add item
                  </button>
                </div>
                {revisionNewItems.length > 0 && (
                  <div className="space-y-2">
                    {revisionNewItems.map((it, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2">
                        <input value={it.name} onChange={(e) => updateRevisionNewItem(idx, "name", e.target.value)}
                          placeholder="Name" className="col-span-5 rounded-lg border border-black/[0.09] bg-white px-2.5 py-1.5 text-[0.8rem] text-[#1a1a1a] outline-none focus:border-indigo-400" />
                        <input type="number" step="0.01" min="0" value={it.unit_price} onChange={(e) => updateRevisionNewItem(idx, "unit_price", e.target.value)}
                          placeholder="Unit €" className="col-span-3 rounded-lg border border-black/[0.09] bg-white px-2.5 py-1.5 text-[0.8rem] text-[#1a1a1a] outline-none focus:border-indigo-400" />
                        <input type="number" min="1" value={it.quantity} onChange={(e) => updateRevisionNewItem(idx, "quantity", e.target.value)}
                          placeholder="Qty" className="col-span-3 rounded-lg border border-black/[0.09] bg-white px-2.5 py-1.5 text-[0.8rem] text-[#1a1a1a] outline-none focus:border-indigo-400" />
                        <button type="button" onClick={() => removeRevisionNewItem(idx)}
                          className="col-span-1 flex items-center justify-center rounded-lg border border-black/[0.08] text-red-400 hover:bg-red-50 hover:text-red-600">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {revisionError && (
                <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-[0.83rem] text-red-700">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  {revisionError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={closeRevisionModal}
                  disabled={revisionLoading}
                  className="h-9 rounded-full border border-black/[0.09] bg-white px-5 text-[0.83rem] font-semibold text-[#5c5e62] transition hover:border-black/20 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRevisionRequest}
                  disabled={revisionLoading || !revisionReason.trim()}
                  className="h-9 rounded-full bg-indigo-600 px-5 text-[0.83rem] font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                >
                  {revisionLoading ? "Submitting…" : "Submit Request"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approve Revision Modal */}
      {approveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <p className="mb-1 text-[0.75rem] font-bold uppercase tracking-[0.15em] text-emerald-700">
              Approve Financial Revision
            </p>

            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[0.83rem] text-amber-800">
              <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-600" />
              This will supersede the existing Order Confirmation, Proforma Invoice, and any Commercial Invoice, then regenerate corrected versions.
            </div>

            {order.financials_revision_reason && (
              <div className="mb-4 rounded-xl bg-[#f5f5f5] px-4 py-3">
                <p className="text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">
                  Revision Reason
                </p>
                <p className="mt-1 text-[0.875rem] text-[#1a1a1a]">
                  {order.financials_revision_reason}
                </p>
              </div>
            )}

            <label className="mb-4 flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={approveConfirmed}
                onChange={(e) => setApproveConfirmed(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-emerald-600"
              />
              <span className="text-[0.875rem] text-[#1a1a1a]">
                I confirm that existing documents will be superseded and corrected versions regenerated.
              </span>
            </label>

            {approveError && (
              <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-[0.83rem] text-red-700">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                {approveError}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => { setApproveModalOpen(false); setApproveConfirmed(false); setApproveError(null); }}
                disabled={approveLoading}
                className="h-9 rounded-full border border-black/[0.09] bg-white px-5 text-[0.83rem] font-semibold text-[#5c5e62] transition hover:border-black/20 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApproveRevision}
                disabled={approveLoading || !approveConfirmed}
                className="h-9 rounded-full bg-emerald-600 px-5 text-[0.83rem] font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                {approveLoading ? "Approving…" : "Confirm Approval"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
