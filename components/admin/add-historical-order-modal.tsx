"use client";

import { useState } from "react";
import { X, Loader2, AlertCircle, Plus, Trash2, PackagePlus } from "lucide-react";
import { COUNTRIES } from "@/lib/countries";

type Props = {
  customerId: number;
  customerPhone?: string;
  customerAddress?: string;
  customerCity?: string;
  customerCountry?: string;
  onClose: () => void;
  /** Called with the new order's id + ref once the backend confirms creation. */
  onCreated: (orderId: number, orderRef: string) => void;
};

type FieldErrors = Record<string, string>;

type ItemRow = { sku: string; name: string; brand: string; unit_price: string; quantity: string };

const BLANK_ITEM: ItemRow = { sku: "", name: "", brand: "", unit_price: "", quantity: "1" };

const ORDER_STATUSES = ["pending", "confirmed", "awaiting_proforma", "shipped", "delivered", "cancelled"] as const;
const STATUS_LABEL: Record<string, string> = {
  pending: "Pending", confirmed: "Confirmed", awaiting_proforma: "Awaiting Proforma",
  shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled",
};

const PAYMENT_STATUSES = ["paid", "unpaid", "refunded"] as const;

const PAYMENT_STAGES = [
  "pending_proforma", "deposit_requested", "deposit_paid",
  "balance_due", "balance_paid", "shipment_released",
] as const;
const PAYMENT_STAGE_LABEL: Record<string, string> = {
  pending_proforma: "Pending Proforma", deposit_requested: "Deposit Requested", deposit_paid: "Deposit Paid",
  balance_due: "Balance Due", balance_paid: "Balance Paid (fully settled)", shipment_released: "Shipment Released",
};

const CARRIER_TYPES = [
  ["truck", "Truck Freight"], ["road", "Road Freight"], ["dhl", "DHL"],
  ["sea", "Sea Freight"], ["air", "Air Freight"],
] as const;

const labelCls = "mb-1.5 block text-[0.78rem] font-semibold text-[#1a1a1a]";
const inputBase =
  "w-full rounded-xl border bg-[#fafafa] px-3.5 py-2.5 text-[0.85rem] text-[#1a1a1a] outline-none transition placeholder:text-[#aaa] focus:bg-white focus:ring-2 focus:ring-[#E85C1A]/10";
const okBorder = "border-black/[0.1] focus:border-[#E85C1A]";
const errBorder = "border-red-400 focus:border-red-500";

export default function AddHistoricalOrderModal({
  customerId, customerPhone, customerAddress, customerCity, customerCountry, onClose, onCreated,
}: Props) {
  const [ref, setRef]               = useState("");
  const [orderDate, setOrderDate]   = useState("");
  const [phone, setPhone]           = useState(customerPhone ?? "");
  const [address, setAddress]       = useState(customerAddress ?? "");
  const [city, setCity]             = useState(customerCity ?? "");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry]       = useState(customerCountry ?? "");

  const [status, setStatus]               = useState<(typeof ORDER_STATUSES)[number]>("delivered");
  const [paymentStatus, setPaymentStatus]  = useState<(typeof PAYMENT_STATUSES)[number]>("paid");
  const [paymentStage, setPaymentStage]    = useState<(typeof PAYMENT_STAGES)[number] | "">("");

  const [carrier, setCarrier]             = useState("");
  const [carrierType, setCarrierType]     = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");

  const [adminNotes, setAdminNotes] = useState("");

  const [mode, setMode] = useState<"items" | "total">("items");
  const [items, setItems] = useState<ItemRow[]>([{ ...BLANK_ITEM }]);
  const [total, setTotal] = useState("");

  const [errors, setErrors]       = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function updateItem(idx: number, field: keyof ItemRow, value: string) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it)));
  }
  function addItemRow() { setItems((prev) => [...prev, { ...BLANK_ITEM }]); }
  function removeItemRow(idx: number) { setItems((prev) => prev.filter((_, i) => i !== idx)); }

  function validate(): FieldErrors {
    const e: FieldErrors = {};
    if (!orderDate) e.order_date = "Order date is required.";
    if (mode === "total") {
      if (!total.trim() || Number(total) <= 0) e.total = "Enter a total greater than 0.";
    } else {
      const filled = items.filter((it) => it.name.trim() && it.quantity.trim());
      if (filled.length === 0) e.items = "Add at least one line item, or switch to flat total.";
    }
    return e;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const v = validate();
    if (Object.keys(v).length) { setErrors(v); return; }
    setErrors({});
    setFormError(null);
    setSubmitting(true);

    const body: Record<string, unknown> = {
      customer_id: customerId,
      order_date: orderDate,
      status,
      payment_status: paymentStatus,
    };
    if (paymentStage) body.payment_stage = paymentStage;
    if (ref.trim()) body.ref = ref.trim();
    if (phone.trim()) body.customer_phone = phone.trim();
    if (address.trim()) body.address = address.trim();
    if (city.trim()) body.city = city.trim();
    if (postalCode.trim()) body.postal_code = postalCode.trim();
    if (country) body.country = country;
    if (carrier.trim()) body.carrier = carrier.trim();
    if (carrierType) body.carrier_type = carrierType;
    if (trackingNumber.trim()) body.tracking_number = trackingNumber.trim();
    if (adminNotes.trim()) body.admin_notes = adminNotes.trim();

    if (mode === "total") {
      body.total = Number(total);
    } else {
      body.items = items
        .filter((it) => it.name.trim() && it.quantity.trim())
        .map((it) => ({
          sku: it.sku.trim() || undefined,
          name: it.name.trim(),
          brand: it.brand.trim() || undefined,
          unit_price: it.unit_price ? Number(it.unit_price) : 0,
          quantity: Number(it.quantity) || 1,
        }));
    }

    try {
      const res = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.status === 404 || res.status === 405) {
        setFormError("Historical order creation isn't available yet — the backend endpoint is pending deployment.");
        return;
      }

      const json = await res.json().catch(() => ({}));

      if (res.status === 422 && json?.errors && typeof json.errors === "object") {
        const mapped: FieldErrors = {};
        for (const [k, val] of Object.entries(json.errors as Record<string, unknown>)) {
          mapped[k] = Array.isArray(val) ? String(val[0]) : String(val);
        }
        setErrors(mapped);
        if (!Object.keys(mapped).length) setFormError(json.message ?? "Please check the form and try again.");
        return;
      }

      if (!res.ok) {
        setFormError(json?.message ?? json?.error ?? `Could not create order (error ${res.status}).`);
        return;
      }

      const data = (json?.data ?? json) as Record<string, unknown>;
      const orderId = Number(data.id);
      const orderRef = String(data.order_ref ?? data.ref ?? "");
      onCreated(orderId, orderRef);
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const ic = (field: string) => `${inputBase} ${errors[field] ? errBorder : okBorder}`;

  return (
    <Shell onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="flex items-start gap-3 border-b border-black/[0.06] px-7 py-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E85C1A]">
            <PackagePlus size={18} className="text-white" />
          </div>
          <div>
            <p className="text-[1rem] font-extrabold text-[#1a1a1a]">Add Historical Order</p>
            <p className="mt-0.5 text-[0.8rem] text-[#5c5e62]">
              Backfill an order this customer already has with Okelcor. Once created, add its documents and shipment tracking on the order page.
            </p>
          </div>
        </div>

        <div className="max-h-[65vh] space-y-4 overflow-y-auto px-7 py-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="ho-ref" className={labelCls}>Order Reference <span className="font-normal text-[#9ca3af]">(optional)</span></label>
              <input id="ho-ref" value={ref} onChange={(e) => setRef(e.target.value)} className={ic("ref")} placeholder="OKL-LEGACY-0042" />
              {errors.ref && <p className="mt-1 text-[0.72rem] text-red-500">{errors.ref}</p>}
            </div>
            <div>
              <label htmlFor="ho-date" className={labelCls}>Order Date *</label>
              <input id="ho-date" type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} className={ic("order_date")} />
              {errors.order_date && <p className="mt-1 text-[0.72rem] text-red-500">{errors.order_date}</p>}
            </div>
          </div>

          {/* Shipping details */}
          <div className="rounded-xl border border-black/[0.07] p-4">
            <p className="mb-3 text-[0.72rem] font-bold uppercase tracking-wide text-[#9ca3af]">Shipping Details</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="ho-phone" className={labelCls}>Phone</label>
                <input id="ho-phone" value={phone} onChange={(e) => setPhone(e.target.value)} className={ic("customer_phone")} />
              </div>
              <div>
                <label htmlFor="ho-country" className={labelCls}>Country</label>
                <select id="ho-country" value={country} onChange={(e) => setCountry(e.target.value)} className={ic("country")}>
                  <option value="">Select country…</option>
                  {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="ho-address" className={labelCls}>Address</label>
                <input id="ho-address" value={address} onChange={(e) => setAddress(e.target.value)} className={ic("address")} placeholder="1 Industrial Ave" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="ho-city" className={labelCls}>City</label>
                  <input id="ho-city" value={city} onChange={(e) => setCity(e.target.value)} className={ic("city")} />
                </div>
                <div>
                  <label htmlFor="ho-postal" className={labelCls}>Postal Code</label>
                  <input id="ho-postal" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} className={ic("postal_code")} />
                </div>
              </div>
            </div>
          </div>

          {/* Status + payment */}
          <div className="rounded-xl border border-black/[0.07] p-4">
            <p className="mb-3 text-[0.72rem] font-bold uppercase tracking-wide text-[#9ca3af]">Status &amp; Payment</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="ho-status" className={labelCls}>Order Status</label>
                <select id="ho-status" value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className={ic("status")}>
                  {ORDER_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="ho-pay-status" className={labelCls}>Payment Status</label>
                <select id="ho-pay-status" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value as typeof paymentStatus)} className={ic("payment_status")}>
                  {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="ho-pay-stage" className={labelCls}>Payment Stage</label>
                <select id="ho-pay-stage" value={paymentStage} onChange={(e) => setPaymentStage(e.target.value as typeof paymentStage)} className={ic("payment_stage")}>
                  <option value="">Default — {paymentStatus === "paid" ? "Balance Paid (fully settled)" : "leave unset"}</option>
                  {PAYMENT_STAGES.map((s) => <option key={s} value={s}>{PAYMENT_STAGE_LABEL[s]}</option>)}
                </select>
                <p className="mt-1 text-[0.72rem] text-[#9ca3af]">
                  Documents can only be uploaded once the stage is Deposit Paid or later. If this order is still mid-flight, pick the real stage explicitly rather than leaving the default.
                </p>
              </div>
            </div>
          </div>

          {/* Carrier / tracking */}
          <div className="rounded-xl border border-black/[0.07] p-4">
            <p className="mb-3 text-[0.72rem] font-bold uppercase tracking-wide text-[#9ca3af]">Carrier &amp; Tracking <span className="font-normal normal-case text-[#9ca3af]">(optional — for shipments still in transit)</span></p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="ho-carrier" className={labelCls}>Carrier</label>
                <input id="ho-carrier" value={carrier} onChange={(e) => setCarrier(e.target.value)} className={ic("carrier")} placeholder="e.g. GLS" />
              </div>
              <div>
                <label htmlFor="ho-carrier-type" className={labelCls}>Carrier Type</label>
                <select id="ho-carrier-type" value={carrierType} onChange={(e) => setCarrierType(e.target.value)} className={ic("carrier_type")}>
                  <option value="">— select —</option>
                  {CARRIER_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="ho-tracking" className={labelCls}>Tracking Number</label>
                <input id="ho-tracking" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} className={ic("tracking_number")} />
              </div>
            </div>
          </div>

          {/* Items or total */}
          <div className="rounded-xl border border-black/[0.07] p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[0.72rem] font-bold uppercase tracking-wide text-[#9ca3af]">Order Value</p>
              <div className="flex gap-1 rounded-lg bg-[#f0f2f5] p-1">
                {(["items", "total"] as const).map((m) => (
                  <button key={m} type="button" onClick={() => setMode(m)}
                    className={`rounded-md px-2.5 py-1 text-[0.72rem] font-semibold transition ${mode === m ? "bg-white text-[#1a1a1a] shadow-sm" : "text-[#5c5e62]"}`}>
                    {m === "items" ? "Line Items" : "Flat Total"}
                  </button>
                ))}
              </div>
            </div>

            {mode === "total" ? (
              <div>
                <label htmlFor="ho-total" className={labelCls}>Total (€)</label>
                <input id="ho-total" type="number" min="0" step="0.01" value={total} onChange={(e) => setTotal(e.target.value)} className={ic("total")} placeholder="8000" />
                {errors.total && <p className="mt-1 text-[0.72rem] text-red-500">{errors.total}</p>}
              </div>
            ) : (
              <div className="space-y-2.5">
                {items.map((it, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2">
                    <input value={it.name} onChange={(e) => updateItem(idx, "name", e.target.value)}
                      className={`${inputBase} ${okBorder} col-span-4`} placeholder="Name (e.g. 205/55 R16)" />
                    <input value={it.brand} onChange={(e) => updateItem(idx, "brand", e.target.value)}
                      className={`${inputBase} ${okBorder} col-span-2`} placeholder="Brand" />
                    <input value={it.sku} onChange={(e) => updateItem(idx, "sku", e.target.value)}
                      className={`${inputBase} ${okBorder} col-span-2`} placeholder="SKU" />
                    <input type="number" min="0" step="0.01" value={it.unit_price} onChange={(e) => updateItem(idx, "unit_price", e.target.value)}
                      className={`${inputBase} ${okBorder} col-span-2`} placeholder="Unit €" />
                    <input type="number" min="1" value={it.quantity} onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                      className={`${inputBase} ${okBorder} col-span-1`} placeholder="Qty" />
                    <button type="button" onClick={() => removeItemRow(idx)} disabled={items.length === 1}
                      className="col-span-1 flex items-center justify-center rounded-xl border border-black/[0.08] text-red-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-30">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={addItemRow}
                  className="flex items-center gap-1.5 text-[0.78rem] font-semibold text-[#E85C1A] hover:underline">
                  <Plus size={13} /> Add line item
                </button>
                {errors.items && <p className="mt-1 text-[0.72rem] text-red-500">{errors.items}</p>}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="ho-notes" className={labelCls}>Internal Admin Notes</label>
            <textarea id="ho-notes" value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={2}
              className={`${ic("admin_notes")} resize-none`} placeholder="e.g. Backfilled from prior WhatsApp/email order history." />
          </div>

          {formError && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5">
              <AlertCircle size={14} className="shrink-0 text-red-500" />
              <p className="text-[0.8rem] text-red-700">{formError}</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-black/[0.06] px-7 py-4">
          <button type="button" onClick={onClose}
            className="h-10 rounded-xl border border-black/[0.1] px-5 text-[0.82rem] font-semibold text-[#5c5e62] transition hover:bg-[#f0f2f5]">
            Cancel
          </button>
          <button type="submit" disabled={submitting}
            className="flex h-10 items-center gap-2 rounded-xl bg-[#E85C1A] px-6 text-[0.82rem] font-semibold text-white transition hover:bg-[#d44d10] disabled:opacity-50">
            {submitting ? <><Loader2 size={15} className="animate-spin" /> Creating…</> : <><PackagePlus size={15} /> Create Order</>}
          </button>
        </div>
      </form>
    </Shell>
  );
}

function Shell({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <button type="button" onClick={onClose} aria-label="Close"
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full text-[#9ca3af] transition hover:bg-[#f0f2f5] hover:text-[#1a1a1a]">
          <X size={16} />
        </button>
        {children}
      </div>
    </div>
  );
}
