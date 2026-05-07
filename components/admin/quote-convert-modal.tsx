"use client";

import { useState, useTransition } from "react";
import { X, Plus, Trash2, AlertCircle, Loader2, ChevronDown } from "lucide-react";
import {
  convertQuoteToOrder,
  type ConvertToOrderResult,
} from "@/app/admin/quotes/actions";
import type { AdminQuoteFull } from "@/lib/admin-api";

// ── Local types ───────────────────────────────────────────────────────────────

type ItemRow = {
  name: string;
  brand: string;
  size: string;
  sku: string;
  unit_price: string;
  quantity: string;
};

type DeliveryForm = {
  address: string;
  city: string;
  postal_code: string;
  country: string;
  phone: string;
};

type Props = {
  quote: AdminQuoteFull;
  onClose: () => void;
  onSuccess: (result: ConvertToOrderResult) => void;
};

const PAYMENT_METHODS = [
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "stripe",        label: "Card (Stripe)" },
  { value: "cash",          label: "Cash" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtEur(n: number): string {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(n);
}

function buildInitialItems(quote: AdminQuoteFull): ItemRow[] {
  const brand = quote.brand_preference ?? "";

  // Preferred path: one row per tyre_items entry
  if (Array.isArray(quote.tyre_items) && quote.tyre_items.length > 0) {
    return quote.tyre_items.map((item) => {
      const size       = item.size?.trim() ?? "";
      const parsedQty  = parseInt(item.quantity ?? "", 10);
      return {
        name:       `${brand || "Quoted tyre"} ${size}`.trim(),
        brand,
        size,
        sku:        "",
        unit_price: "",
        quantity:   !isNaN(parsedQty) && parsedQty > 0 ? String(parsedQty) : "",
      };
    });
  }

  // Legacy fallback: single row from tyre_size + quantity
  const nameParts    = [brand, quote.tyre_size].filter(Boolean).join(" ").trim();
  const parsedLegacy = parseInt(quote.quantity ?? "", 10);
  return [{
    name:       nameParts || "Quoted product",
    brand,
    size:       quote.tyre_size ?? "",
    sku:        "",
    unit_price: "",
    quantity:   !isNaN(parsedLegacy) && parsedLegacy > 0 ? String(parsedLegacy) : "",
  }];
}

// ── Sub-components ────────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1.5 text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-[#5c5e62]">
      {children}
    </p>
  );
}

type InputProps = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  min?: string;
  step?: string;
  className?: string;
};

function Input({ value, onChange, placeholder, type = "text", min, step, className = "" }: InputProps) {
  return (
    <input
      type={type}
      value={value}
      min={min}
      step={step}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full rounded-xl border border-black/[0.09] bg-white px-3.5 py-2.5 text-[0.875rem] text-[#1a1a1a] placeholder:text-[#9ca3af] outline-none transition focus:border-[#E85C1A] focus:ring-2 focus:ring-[#E85C1A]/10 ${className}`}
    />
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function QuoteConvertModal({ quote, onClose, onSuccess }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [delivery, setDelivery] = useState<DeliveryForm>({
    address:     quote.delivery_address     ?? "",
    city:        quote.delivery_city        ?? "",
    postal_code: quote.delivery_postal_code ?? "",
    country:     quote.country              ?? "",
    phone:       quote.phone                ?? "",
  });

  const [items, setItems] = useState<ItemRow[]>(() => buildInitialItems(quote));
  const [deliveryCost, setDeliveryCost] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [adminNotes, setAdminNotes] = useState("");

  // ── Computed summary ──────────────────────────────────────────────────────

  const subtotal = items.reduce((acc, item) => {
    return acc + (parseFloat(item.unit_price) || 0) * (parseInt(item.quantity) || 0);
  }, 0);
  const deliveryCostNum = parseFloat(deliveryCost) || 0;
  const total = subtotal + deliveryCostNum;

  // ── Handlers ──────────────────────────────────────────────────────────────

  function updateDelivery(field: keyof DeliveryForm, value: string) {
    setDelivery((prev) => ({ ...prev, [field]: value }));
  }

  function updateItem(index: number, field: keyof ItemRow, value: string) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  function addItem() {
    setItems((prev) => [
      ...prev,
      { name: "", brand: "", size: "", sku: "", unit_price: "", quantity: "" },
    ]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function validate(): string | null {
    if (!delivery.address.trim())     return "Delivery address is required.";
    if (!delivery.city.trim())        return "City is required.";
    if (!delivery.postal_code.trim()) return "Postal code is required.";
    if (!delivery.country.trim())     return "Country is required.";
    if (items.length === 0)           return "At least one item is required.";

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.name.trim()) return `Item ${i + 1}: product name is required.`;
      if (!item.size.trim()) return `Item ${i + 1}: tyre size is required.`;
      const price = parseFloat(item.unit_price);
      if (isNaN(price) || price <= 0) return `Item ${i + 1}: unit price must be greater than 0.`;
      const qty = parseInt(item.quantity, 10);
      if (!Number.isInteger(qty) || qty < 1) return `Item ${i + 1}: quantity must be a positive whole number.`;
    }
    return null;
  }

  function handleSubmit() {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);

    startTransition(async () => {
      const result = await convertQuoteToOrder(quote.id, {
        delivery: {
          address:     delivery.address.trim(),
          city:        delivery.city.trim(),
          postal_code: delivery.postal_code.trim(),
          country:     delivery.country.trim(),
          phone:       delivery.phone.trim(),
        },
        items: items.map((item) => ({
          name:       item.name.trim(),
          brand:      item.brand.trim(),
          size:       item.size.trim(),
          sku:        item.sku.trim() || null,
          unit_price: parseFloat(item.unit_price),
          quantity:   parseInt(item.quantity),
        })),
        delivery_cost:  deliveryCostNum,
        payment_method: paymentMethod,
        admin_notes:    adminNotes.trim(),
      });

      if (result.error) {
        setError(result.error);
      } else if (result.data) {
        onSuccess(result.data);
      }
    });
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-10 pb-10"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) onClose();
      }}
    >
      <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/[0.07] px-6 py-5">
          <div>
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#E85C1A]">
              Convert to Order
            </p>
            <p className="mt-0.5 text-[0.95rem] font-bold text-[#1a1a1a]">
              {quote.ref_number}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-lg p-1.5 text-[#5c5e62] transition hover:bg-[#f5f5f5] hover:text-[#1a1a1a] disabled:opacity-40"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-8 px-6 py-6">

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[0.83rem] text-red-700">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          {/* ── Delivery ── */}
          <section>
            <p className="mb-4 text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#E85C1A]">
              Delivery
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <FieldLabel>Address *</FieldLabel>
                <Input
                  value={delivery.address}
                  onChange={(v) => updateDelivery("address", v)}
                  placeholder="Street address"
                />
              </div>
              <div>
                <FieldLabel>City *</FieldLabel>
                <Input
                  value={delivery.city}
                  onChange={(v) => updateDelivery("city", v)}
                  placeholder="City"
                />
              </div>
              <div>
                <FieldLabel>Postal Code *</FieldLabel>
                <Input
                  value={delivery.postal_code}
                  onChange={(v) => updateDelivery("postal_code", v)}
                  placeholder="Postal code"
                />
              </div>
              <div>
                <FieldLabel>Country *</FieldLabel>
                <Input
                  value={delivery.country}
                  onChange={(v) => updateDelivery("country", v)}
                  placeholder="Country"
                />
              </div>
              <div>
                <FieldLabel>Phone</FieldLabel>
                <Input
                  value={delivery.phone}
                  onChange={(v) => updateDelivery("phone", v)}
                  placeholder="Phone number"
                />
              </div>
            </div>
          </section>

          {/* ── Items ── */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#E85C1A]">
                Items
              </p>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1.5 rounded-full border border-[#E85C1A] px-3.5 py-1.5 text-[0.78rem] font-semibold text-[#E85C1A] transition hover:bg-[#E85C1A] hover:text-white"
              >
                <Plus size={13} />
                Add Item
              </button>
            </div>

            <p className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-[0.8rem] leading-relaxed text-blue-800">
              Rows are prefilled from the customer&apos;s RFQ. Please confirm product names,
              quantities and prices before creating the order.
            </p>

            <div className="flex flex-col gap-4">
              {items.map((item, i) => {
                const rowTotal = (parseFloat(item.unit_price) || 0) * (parseInt(item.quantity) || 0);
                return (
                  <div
                    key={i}
                    className="rounded-xl border border-black/[0.08] bg-[#fafafa] p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-[0.75rem] font-semibold text-[#5c5e62]">
                        Item {i + 1}
                        {rowTotal > 0 && (
                          <span className="ml-2 font-bold text-[#1a1a1a]">
                            — {fmtEur(rowTotal)}
                          </span>
                        )}
                      </p>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(i)}
                          className="rounded-lg p-1 text-red-400 transition hover:bg-red-50 hover:text-red-600"
                          title="Remove item"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <div className="sm:col-span-2 lg:col-span-3">
                        <FieldLabel>Product Name *</FieldLabel>
                        <Input
                          value={item.name}
                          onChange={(v) => updateItem(i, "name", v)}
                          placeholder="Product name"
                        />
                      </div>
                      <div>
                        <FieldLabel>Brand</FieldLabel>
                        <Input
                          value={item.brand}
                          onChange={(v) => updateItem(i, "brand", v)}
                          placeholder="Brand"
                        />
                      </div>
                      <div>
                        <FieldLabel>Size</FieldLabel>
                        <Input
                          value={item.size}
                          onChange={(v) => updateItem(i, "size", v)}
                          placeholder="e.g. 205/55 R16"
                        />
                      </div>
                      <div>
                        <FieldLabel>SKU</FieldLabel>
                        <Input
                          value={item.sku}
                          onChange={(v) => updateItem(i, "sku", v)}
                          placeholder="Optional"
                        />
                      </div>
                      <div>
                        <FieldLabel>Unit Price (€) *</FieldLabel>
                        <Input
                          type="number"
                          value={item.unit_price}
                          onChange={(v) => updateItem(i, "unit_price", v)}
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <FieldLabel>Quantity *</FieldLabel>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(v) => updateItem(i, "quantity", v)}
                          placeholder="0"
                          min="1"
                          step="1"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── Summary ── */}
          <section>
            <p className="mb-4 text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#E85C1A]">
              Order Summary
            </p>
            <div className="rounded-xl border border-black/[0.08] bg-[#fafafa] p-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[0.83rem] text-[#5c5e62]">Subtotal</span>
                  <span className="text-[0.83rem] font-semibold text-[#1a1a1a]">
                    {fmtEur(subtotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="shrink-0 text-[0.83rem] text-[#5c5e62]">
                    Delivery Cost (€)
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={deliveryCost}
                    onChange={(e) => setDeliveryCost(e.target.value)}
                    className="w-28 rounded-lg border border-black/[0.09] bg-white px-3 py-1.5 text-right text-[0.83rem] text-[#1a1a1a] outline-none transition focus:border-[#E85C1A] focus:ring-2 focus:ring-[#E85C1A]/10"
                  />
                </div>
                <div className="border-t border-black/[0.07] pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[0.875rem] font-bold text-[#1a1a1a]">Total</span>
                    <span className="text-[1rem] font-extrabold text-[#E85C1A]">
                      {fmtEur(total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── Payment Method ── */}
          <section>
            <p className="mb-3 text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#E85C1A]">
              Payment Method
            </p>
            <div className="relative inline-block">
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="h-10 appearance-none rounded-xl border border-black/[0.09] bg-white pl-3.5 pr-9 text-[0.875rem] font-semibold text-[#1a1a1a] outline-none transition focus:border-[#E85C1A] focus:ring-2 focus:ring-[#E85C1A]/10"
              >
                {PAYMENT_METHODS.map((pm) => (
                  <option key={pm.value} value={pm.value}>
                    {pm.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#5c5e62]"
              />
            </div>
          </section>

          {/* ── Admin Notes ── */}
          <section>
            <p className="mb-3 text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#E85C1A]">
              Admin Notes
            </p>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={3}
              placeholder="Optional internal notes for this order…"
              className="w-full resize-none rounded-xl border border-black/[0.09] bg-white px-4 py-3 text-[0.875rem] text-[#1a1a1a] placeholder:text-[#9ca3af] outline-none transition focus:border-[#E85C1A] focus:ring-2 focus:ring-[#E85C1A]/10"
            />
          </section>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-black/[0.07] px-6 py-5">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="h-10 rounded-full border border-black/[0.12] px-6 text-[0.875rem] font-semibold text-[#5c5e62] transition hover:border-[#1a1a1a] hover:text-[#1a1a1a] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="flex h-10 items-center gap-2 rounded-full bg-[#E85C1A] px-7 text-[0.875rem] font-semibold text-white transition hover:bg-[#d14f14] disabled:opacity-60"
          >
            {isPending && <Loader2 size={14} className="animate-spin" />}
            {isPending ? "Converting…" : "Convert to Order"}
          </button>
        </div>
      </div>
    </div>
  );
}
