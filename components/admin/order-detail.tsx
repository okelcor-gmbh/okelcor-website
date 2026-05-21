"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle, AlertTriangle, CheckCircle2, ChevronDown, FileWarning,
  Landmark, Lock, Loader2, MapPin, Plus, Pencil, RotateCcw, Trash2, UserCheck,
} from "lucide-react";
import { updateOrderStatus, cancelOrder, deleteOrder, addShipmentEvent, updateShipmentEvent, deleteShipmentEvent } from "@/app/admin/orders/actions";
import type { AdminOrderFull, AdminOrderLog, ShipmentEvent } from "@/lib/admin-api";
import { canDo } from "@/lib/admin-permissions";
import TradeDocumentsCard from "@/components/admin/trade-documents-card";
import PaymentMilestonesCard from "@/components/admin/payment-milestones-card";

// ── Types ─────────────────────────────────────────────────────────────────────

const ORDER_STATUSES = ["pending", "confirmed", "awaiting_proforma", "shipped", "delivered", "cancelled"] as const;
type OrderStatus = (typeof ORDER_STATUSES)[number];

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

// Convert an ISO or date-only string to YYYY-MM-DD for <input type="date">
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
      {/* timeline dot */}
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

// ── Main component ────────────────────────────────────────────────────────────

export default function OrderDetail({
  order,
  adminRole,
}: {
  order: AdminOrderFull;
  adminRole: string;
}) {
  const router = useRouter();

  const [status, setStatus] = useState<OrderStatus>(
    ORDER_STATUSES.includes(order.status as OrderStatus)
      ? (order.status as OrderStatus)
      : "pending",
  );
  const [carrier,           setCarrier]           = useState(order.carrier ?? "");
  const [carrierType,       setCarrierType]       = useState(order.carrier_type ?? "");
  const [trackingNumber,    setTrackingNumber]    = useState(order.tracking_number ?? "");
  const [estimatedDelivery, setEstimatedDelivery] = useState(toDateInputValue(order.estimated_delivery ?? order.eta));

  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved,     setSaved]     = useState(false);
  const [isPending, startTransition] = useTransition();

  // Cancel state
  const [cancelError,   setCancelError]   = useState<string | null>(null);
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const [isCancelPending, startCancelTransition] = useTransition();

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteRef,       setDeleteRef]       = useState("");
  const [deleteError,     setDeleteError]     = useState<string | null>(null);
  const [isDeletePending, startDeleteTransition] = useTransition();

  // Mark-paid state
  const [paymentStatus,     setPaymentStatus]     = useState(order.payment_status ?? "");
  const [markPaidOpen,      setMarkPaidOpen]      = useState(false);
  const [markPaidConfirmed, setMarkPaidConfirmed] = useState(false);
  const [paymentRef,        setPaymentRef]        = useState("");
  const [adminNote,         setAdminNote]         = useState("");
  const [markPaidError,     setMarkPaidError]     = useState<string | null>(null);
  const [markPaidSuccess,   setMarkPaidSuccess]   = useState(false);
  const [isMarkPaidPending, setIsMarkPaidPending] = useState(false);

  // Financial revision request modal
  const [revisionModalOpen,    setRevisionModalOpen]    = useState(false);
  const [revisionReason,       setRevisionReason]       = useState("");
  const [revisionDeliveryFee,  setRevisionDeliveryFee]  = useState("");
  const [revisionLoading,      setRevisionLoading]      = useState(false);
  const [revisionError,        setRevisionError]        = useState<string | null>(null);
  const [revisionSubmitted,    setRevisionSubmitted]    = useState(false);

  // Approve revision modal
  const [approveModalOpen,   setApproveModalOpen]   = useState(false);
  const [approveConfirmed,   setApproveConfirmed]   = useState(false);
  const [approveLoading,     setApproveLoading]     = useState(false);
  const [approveError,       setApproveError]       = useState<string | null>(null);

  // Reject revision
  const [rejectLoading,   setRejectLoading]   = useState(false);
  const [rejectError,     setRejectError]     = useState<string | null>(null);
  const [rejectSuccess,   setRejectSuccess]   = useState(false);

  // Local revision state (mirrors order prop, updated optimistically after actions)
  const [revisionRequired, setRevisionRequired] = useState(order.financials_revision_required ?? false);

  // DOC-6: customer acceptance pending (drives proforma gate in TradeDocumentsCard)
  const customerAcceptancePending = order.customer_acceptance_status === "pending";

  // Permission-based access
  const canCancel              = canDo(adminRole, "orders.update");
  const canDelete              = canDo(adminRole, "orders.delete");
  const canApproveRevision     = canDo(adminRole, "orders.approve_financial_revision");
  const isLocked               = order.financials_locked === true;
  const cancelDisabled = ["cancelled", "delivered"].includes(status);

  const closeRevisionModal = () => {
    setRevisionModalOpen(false);
    setRevisionReason("");
    setRevisionDeliveryFee("");
    setRevisionError(null);
  };

  const handleRevisionRequest = async () => {
    if (!revisionReason.trim()) { setRevisionError("Please describe the correction needed."); return; }
    setRevisionLoading(true);
    setRevisionError(null);
    try {
      const body: Record<string, unknown> = { reason: revisionReason.trim() };
      const fee = parseFloat(revisionDeliveryFee);
      if (revisionDeliveryFee.trim() && !isNaN(fee)) {
        body.changes = { delivery_fee: fee };
      }
      const res  = await fetch(`/api/admin/orders/${order.id}/financials/revision-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({})) as Record<string, unknown>;
      if (!res.ok) {
        setRevisionError((json.message as string) ?? "Failed to submit revision request.");
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

  const isDirty =
    status            !== order.status                                            ||
    carrier           !== (order.carrier ?? "")                                   ||
    carrierType       !== (order.carrier_type ?? "")                              ||
    trackingNumber    !== (order.tracking_number ?? "")                           ||
    estimatedDelivery !== toDateInputValue(order.estimated_delivery ?? order.eta);

  const handleSave = () => {
    setSaveError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateOrderStatus(order.id, status, {
        carrier:            carrier           || undefined,
        carrier_type:       carrierType       || undefined,
        tracking_number:    trackingNumber    || undefined,
        estimated_delivery: estimatedDelivery || undefined,
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


  return (
    <div className="flex flex-col gap-6">

      {/* ── Status + Shipment update card ── */}
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
          {/* Current status badge */}
          <div className="flex flex-col gap-1">
            <span className="text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">Current</span>
            <StatusBadge status={order.status} />
          </div>

          {/* Status dropdown */}
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

          {/* Carrier */}
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

          {/* Carrier type */}
          <div className="flex flex-col gap-1">
            <span className="text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">Carrier type</span>
            <div className="relative">
              <select
                value={carrierType}
                onChange={(e) => setCarrierType(e.target.value)}
                className="h-10 appearance-none rounded-xl border border-black/[0.09] bg-white pl-3.5 pr-9 text-[0.875rem] text-[#1a1a1a] outline-none transition focus:border-[#E85C1A] focus:ring-2 focus:ring-[#E85C1A]/10"
              >
                <option value="">— select —</option>
                <option value="bus">Bus Freight</option>
                <option value="road">Road Freight</option>
                <option value="dhl">DHL</option>
                <option value="sea">Sea Freight</option>
                <option value="air">Air Freight</option>
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#5c5e62]" />
            </div>
          </div>

          {/* Tracking / waybill */}
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

          {/* Estimated delivery */}
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

      {/* ── Financial Lock Banner ── */}
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

      {/* ── Pending Financial Revision Card ── */}
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

      {/* ── Customer Acceptance Status Card (DOC-6) ── */}
      {order.customer_acceptance_status != null && (
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <UserCheck size={14} className="shrink-0 text-[#E85C1A]" strokeWidth={2} />
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#E85C1A]">
              Customer Acceptance
            </p>
          </div>
          {order.customer_acceptance_status === "pending" && (
            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-[0.72rem] font-bold text-amber-700">
                Pending
              </span>
              <p className="text-[0.83rem] text-[#5c5e62]">
                Awaiting customer review and acceptance of the document.
              </p>
            </div>
          )}
          {order.customer_acceptance_status === "accepted" && (
            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-[0.72rem] font-bold text-emerald-700">
                Accepted
              </span>
              <p className="text-[0.83rem] text-[#5c5e62]">
                Customer accepted on{" "}
                {order.customer_accepted_at
                  ? shortDate(order.customer_accepted_at)
                  : "—"
                }.
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

      {/* ── Payment Milestones Card (DOC-7) ── */}
      {order.payment_stage != null && (
        <PaymentMilestonesCard
          orderId={order.id}
          adminRole={adminRole}
          initialStage={order.payment_stage}
          depositPercent={order.deposit_percent ?? null}
          depositAmount={order.deposit_amount ?? null}
          balanceAmount={order.balance_amount ?? null}
          depositPaidAt={order.deposit_paid_at ?? null}
          balancePaidAt={order.balance_paid_at ?? null}
          shipmentReleasedAt={order.shipment_released_at ?? null}
          shipmentReleaseNote={order.shipment_release_note ?? null}
        />
      )}

      {/* ── Two-column: customer info + order summary ── */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Customer info */}
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

        {/* Order summary */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="mb-5 text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#E85C1A]">
            Order Summary
          </p>
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
              €{Number(order.total).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* ── Trade Documents ── */}
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

      {/* ── EU Entry Certificate (Gelangensbestätigung) ── */}
      {order.declaration_required != null && (
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
      )}

      {/* ── Order items ── */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="border-b border-black/[0.06] px-6 py-4">
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#E85C1A]">
            Order Items
          </p>
        </div>
        {!order.items?.length ? (
          <p className="px-6 py-8 text-center text-[0.875rem] text-[#5c5e62]">
            No item details available.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left">
              <thead>
                <tr className="border-b border-black/[0.05] bg-[#fafafa]">
                  {["Product", "SKU", "Size", "Qty", "Unit Price", "Subtotal"].map((h) => (
                    <th key={h} className="px-4 py-3 text-[0.7rem] font-bold uppercase tracking-[0.12em] text-[#5c5e62]">
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
                      €{Number(item.unit_price).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-[0.875rem] font-semibold text-[#1a1a1a]">
                      €{Number(item.subtotal).toFixed(2)}
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
                    €{Number(order.total).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* ── Shipment event manager ── */}
      <ShipmentEventManager orderId={order.id} initialEvents={order.shipment_events ?? []} />

      {/* ── Order Actions ── */}
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <p className="mb-4 text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#5c5e62]">
          Order Actions
        </p>

        <div className="flex flex-wrap gap-3">
          {isLocked && !revisionRequired && canCancel && (
            <button
              type="button"
              onClick={() => setRevisionModalOpen(true)}
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

      {/* ── Activity log ── */}
      <ActivityLog logs={order.logs} />

      {/* ── Mark bank transfer as paid modal ── */}
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

      {/* ── Delete confirmation modal ── */}
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

      {/* ── Request Financial Revision Modal ── */}
      {revisionModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => { if (e.target === e.currentTarget && !revisionLoading) closeRevisionModal(); }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <p className="mb-1 text-[0.75rem] font-bold uppercase tracking-[0.15em] text-indigo-600">
              Request Financial Revision
            </p>
            <p className="mb-5 text-[0.875rem] text-[#1a1a1a]">
              Financials are locked because a commercial document has been issued. Describe the correction — a super admin or admin will review and approve it.
            </p>

            <div className="flex flex-col gap-4">
              <div>
                <p className="mb-1.5 text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">
                  Reason <span className="text-red-500">*</span>
                </p>
                <textarea
                  value={revisionReason}
                  onChange={(e) => setRevisionReason(e.target.value)}
                  placeholder="e.g. Delivery fee entered as €2.50 — should be €2500.00"
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

      {/* ── Approve Revision Modal ── */}
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
