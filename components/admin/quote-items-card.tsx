"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus, Pencil, Trash2, Check, X, Loader2,
  AlertCircle, Package, Download, CheckCircle2,
} from "lucide-react";
import type { QuoteItem } from "@/lib/admin-api";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtPrice(price?: number | null, currency?: string | null): string {
  if (price == null) return "—";
  try {
    return new Intl.NumberFormat("en-DE", {
      style: "currency",
      currency: currency ?? "EUR",
      minimumFractionDigits: 2,
    }).format(price);
  } catch { return `${price}`; }
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  quoteId: number;
  onItemCountChange?: (count: number) => void;
}

type ItemDraft = {
  brand: string;
  size: string;
  quantity: string;
  unit_price: string;
  currency: string;
  notes: string;
};

const BLANK: ItemDraft = {
  brand: "", size: "", quantity: "1",
  unit_price: "", currency: "EUR", notes: "",
};

function draftFromItem(item: QuoteItem): ItemDraft {
  return {
    brand:      item.brand      ?? "",
    size:       item.size       ?? "",
    quantity:   String(item.quantity ?? 1),
    unit_price: item.unit_price != null ? String(item.unit_price) : "",
    currency:   item.currency   ?? "EUR",
    notes:      item.notes      ?? "",
  };
}

function draftToBody(d: ItemDraft) {
  return {
    brand:      d.brand      || undefined,
    size:       d.size       || undefined,
    quantity:   Number(d.quantity) || 1,
    unit_price: d.unit_price ? Number(d.unit_price) : undefined,
    currency:   d.currency   || "EUR",
    notes:      d.notes      || undefined,
  };
}

// ── Inline item form ──────────────────────────────────────────────────────────

function ItemFormRow({
  value,
  onChange,
  onSubmit,
  onCancel,
  loading,
  error,
  submitLabel,
}: {
  value: ItemDraft;
  onChange: (v: ItemDraft) => void;
  onSubmit: () => void;
  onCancel: () => void;
  loading: boolean;
  error?: string | null;
  submitLabel: string;
}) {
  const field =
    (key: keyof ItemDraft) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      onChange({ ...value, [key]: e.target.value });

  const inputCls =
    "h-9 w-full rounded-lg border border-black/[0.09] bg-white px-2.5 text-[0.83rem] text-[#1a1a1a] outline-none placeholder:text-[#bbb] transition focus:border-[#E85C1A] focus:ring-1 focus:ring-[#E85C1A]/20";

  return (
    <tr className="border-t border-[#E85C1A]/20 bg-orange-50/30">
      <td className="px-3 py-2.5">
        <input
          value={value.brand}
          onChange={field("brand")}
          placeholder="Brand"
          className={inputCls}
        />
      </td>
      <td className="px-3 py-2.5">
        <input
          value={value.size}
          onChange={field("size")}
          placeholder="e.g. 205/55R16"
          className={inputCls}
        />
      </td>
      <td className="px-3 py-2.5">
        <input
          type="number"
          min="1"
          value={value.quantity}
          onChange={field("quantity")}
          placeholder="Qty"
          className={inputCls}
        />
      </td>
      <td className="px-3 py-2.5">
        <div className="flex gap-1">
          <input
            type="number"
            min="0"
            step="0.01"
            value={value.unit_price}
            onChange={field("unit_price")}
            placeholder="0.00"
            className={`${inputCls} flex-1`}
          />
          <select
            value={value.currency}
            onChange={field("currency")}
            className="h-9 rounded-lg border border-black/[0.09] bg-white px-1.5 text-[0.78rem] text-[#5c5e62] outline-none transition focus:border-[#E85C1A]"
          >
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
            <option value="GBP">GBP</option>
          </select>
        </div>
      </td>
      <td className="px-3 py-2.5">
        <input
          value={value.notes}
          onChange={field("notes")}
          placeholder="Optional note"
          className={inputCls}
        />
      </td>
      <td className="px-3 py-2.5">
        <div className="flex flex-col gap-1.5">
          {error && (
            <p className="text-[0.72rem] text-red-600">{error}</p>
          )}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onSubmit}
              disabled={loading || !value.quantity}
              className="flex h-8 items-center gap-1.5 rounded-lg bg-[#E85C1A] px-3 text-[0.78rem] font-semibold text-white transition hover:bg-[#d14f14] disabled:opacity-50"
            >
              {loading ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
              {submitLabel}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/[0.09] text-[#5c5e62] transition hover:bg-[#f5f5f5] disabled:opacity-50"
            >
              <X size={13} />
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function QuoteItemsCard({ quoteId, onItemCountChange }: Props) {
  const [items,   setItems]   = useState<QuoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  // Add form
  const [showAdd,   setShowAdd]   = useState(false);
  const [addDraft,  setAddDraft]  = useState<ItemDraft>(BLANK);
  const [addBusy,   setAddBusy]   = useState(false);
  const [addError,  setAddError]  = useState<string | null>(null);

  // Edit form
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<ItemDraft>(BLANK);
  const [editBusy,  setEditBusy]  = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Import
  const [importing,    setImporting]    = useState(false);
  const [importMsg,    setImportMsg]    = useState<string | null>(null);
  const [importError,  setImportError]  = useState<string | null>(null);
  const [backendReady, setBackendReady] = useState(true);

  // ── Fetch ────────────────────────────────────────────────────────────────────

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/quotes/${quoteId}/items`, { cache: "no-store" });
      // 404/405 = backend not yet deployed
      if (res.status === 404 || res.status === 405) {
        setBackendReady(false);
        setItems([]);
        onItemCountChange?.(0);
        return;
      }
      const json = await res.json().catch(() => ({})) as Record<string, unknown>;
      if (!res.ok) {
        setError((json.message as string | undefined) ?? "Failed to load items.");
        return;
      }
      const raw = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
      setItems(raw as QuoteItem[]);
      onItemCountChange?.(raw.length);
    } catch {
      setError("Network error — could not load quote items.");
    } finally {
      setLoading(false);
    }
  }, [quoteId, onItemCountChange]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  // ── Add ──────────────────────────────────────────────────────────────────────

  async function handleAdd() {
    if (!addDraft.quantity) return;
    setAddBusy(true);
    setAddError(null);
    try {
      const res = await fetch(`/api/admin/quotes/${quoteId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draftToBody(addDraft)),
      });
      const json = await res.json().catch(() => ({})) as Record<string, unknown>;
      if (!res.ok) {
        setAddError((json.message as string | undefined) ?? "Failed to add item.");
        return;
      }
      const created = (json.data ?? json) as QuoteItem;
      const next = [...items, created];
      setItems(next);
      onItemCountChange?.(next.length);
      setAddDraft(BLANK);
      setShowAdd(false);
    } catch {
      setAddError("Network error.");
    } finally {
      setAddBusy(false);
    }
  }

  // ── Edit ─────────────────────────────────────────────────────────────────────

  function startEdit(item: QuoteItem) {
    setEditingId(item.id);
    setEditDraft(draftFromItem(item));
    setEditError(null);
  }

  async function handleEdit() {
    if (editingId == null) return;
    setEditBusy(true);
    setEditError(null);
    try {
      const res = await fetch(`/api/admin/quotes/${quoteId}/items/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draftToBody(editDraft)),
      });
      const json = await res.json().catch(() => ({})) as Record<string, unknown>;
      if (!res.ok) {
        setEditError((json.message as string | undefined) ?? "Failed to update item.");
        return;
      }
      const updated = (json.data ?? json) as QuoteItem;
      setItems((prev) => prev.map((it) => (it.id === editingId ? updated : it)));
      setEditingId(null);
    } catch {
      setEditError("Network error.");
    } finally {
      setEditBusy(false);
    }
  }

  // ── Delete ───────────────────────────────────────────────────────────────────

  async function handleDelete(itemId: number) {
    setDeletingId(itemId);
    try {
      await fetch(`/api/admin/quotes/${quoteId}/items/${itemId}`, { method: "DELETE" });
      const next = items.filter((it) => it.id !== itemId);
      setItems(next);
      onItemCountChange?.(next.length);
    } catch { /* silently ignore */ }
    finally { setDeletingId(null); }
  }

  // ── Import from inquiry ───────────────────────────────────────────────────────

  async function handleImport() {
    setImporting(true);
    setImportMsg(null);
    setImportError(null);
    try {
      const res = await fetch(`/api/admin/quotes/${quoteId}/items/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (res.status === 404 || res.status === 405) {
        setImportError("Import endpoint not yet deployed on backend.");
        return;
      }
      const json = await res.json().catch(() => ({})) as Record<string, unknown>;
      if (!res.ok) {
        setImportError((json.message as string | undefined) ?? "Import failed.");
        return;
      }
      await fetchItems();
      setImportMsg((json.message as string | undefined) ?? "Items imported from inquiry.");
    } catch {
      setImportError("Network error.");
    } finally {
      setImporting(false);
    }
  }

  // ── Totals ────────────────────────────────────────────────────────────────────

  const pricedItems = items.filter((it) => it.unit_price != null);
  const proposalTotal = pricedItems.length > 0
    ? pricedItems.reduce((sum, it) => sum + it.quantity * (it.unit_price ?? 0), 0)
    : null;
  const currency = items[0]?.currency ?? "EUR";

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div id="quote-items" className="rounded-2xl bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#E85C1A]">
            Quote Items
          </p>
          {!loading && (
            <span className="rounded-full bg-[#f5f5f5] px-2 py-0.5 text-[0.7rem] font-bold text-[#5c5e62]">
              {items.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Import from inquiry */}
          <button
            type="button"
            disabled={importing}
            onClick={handleImport}
            title="Auto-import tyre items from the original inquiry"
            className="flex items-center gap-1.5 rounded-lg border border-black/[0.09] bg-white px-3 py-2 text-[0.78rem] font-semibold text-[#5c5e62] transition hover:border-[#1a1a1a] hover:text-[#1a1a1a] disabled:opacity-50"
          >
            {importing ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
            Import from Inquiry
          </button>
          {/* Add item */}
          <button
            type="button"
            disabled={showAdd}
            onClick={() => { setShowAdd(true); setAddDraft(BLANK); setAddError(null); }}
            className="flex items-center gap-1.5 rounded-lg bg-[#1a1a1a] px-3 py-2 text-[0.78rem] font-semibold text-white transition hover:bg-[#333] disabled:opacity-50"
          >
            <Plus size={12} />
            Add Item
          </button>
        </div>
      </div>

      {/* Import feedback */}
      {importMsg && (
        <div className="mb-3 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-[0.83rem] text-emerald-800">
          <CheckCircle2 size={14} className="shrink-0" />
          <span className="flex-1">{importMsg}</span>
          <button type="button" onClick={() => setImportMsg(null)}><X size={12} /></button>
        </div>
      )}
      {importError && (
        <div className="mb-3 flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-[0.83rem] text-red-700">
          <AlertCircle size={14} className="shrink-0" />
          <span className="flex-1">{importError}</span>
          <button type="button" onClick={() => setImportError(null)}><X size={12} /></button>
        </div>
      )}

      {/* Backend not ready */}
      {!backendReady && (
        <div className="mb-3 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[0.83rem] text-amber-800">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span>
            Quote items endpoint is not yet deployed. Add items here once the backend is ready — they will be used when creating the proposal draft.
          </span>
        </div>
      )}

      {/* Fetch error */}
      {error && (
        <div className="mb-3 flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-[0.83rem] text-red-700">
          <AlertCircle size={14} className="shrink-0" />
          <span className="flex-1">{error}</span>
          <button type="button" onClick={fetchItems} className="ml-2 underline">Retry</button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-black/[0.06]">
        <table className="w-full min-w-[640px] text-left">
          <thead>
            <tr className="border-b border-black/[0.06] bg-[#fafafa]">
              {["Brand", "Size", "Qty", "Unit Price", "Notes", ""].map((h) => (
                <th key={h} className="px-3 py-2.5 text-[0.68rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[0.04]">

            {/* Loading skeleton */}
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center">
                  <Loader2 size={18} className="mx-auto animate-spin text-[#E85C1A]" />
                </td>
              </tr>
            )}

            {/* Empty state */}
            {!loading && items.length === 0 && !showAdd && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Package size={22} className="text-[#d1d5db]" />
                    <p className="text-[0.83rem] text-[#9ca3af]">No items added yet.</p>
                    <button
                      type="button"
                      onClick={() => { setShowAdd(true); setAddDraft(BLANK); }}
                      className="mt-1 flex items-center gap-1.5 rounded-full border border-[#E85C1A] px-4 py-1.5 text-[0.78rem] font-semibold text-[#E85C1A] transition hover:bg-[#E85C1A] hover:text-white"
                    >
                      <Plus size={12} />
                      Add first item
                    </button>
                  </div>
                </td>
              </tr>
            )}

            {/* Item rows */}
            {!loading && items.map((item) =>
              editingId === item.id ? (
                <ItemFormRow
                  key={item.id}
                  value={editDraft}
                  onChange={setEditDraft}
                  onSubmit={handleEdit}
                  onCancel={() => { setEditingId(null); setEditError(null); }}
                  loading={editBusy}
                  error={editError}
                  submitLabel="Save"
                />
              ) : (
                <tr key={item.id} className="group transition hover:bg-[#fafafa]">
                  <td className="px-3 py-2.5 text-[0.83rem] font-medium text-[#1a1a1a]">
                    {item.brand ?? <span className="italic text-[#ccc]">—</span>}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="font-mono text-[0.83rem] text-[#1a1a1a]">
                      {item.size ?? <span className="not-italic font-sans italic text-[#ccc]">—</span>}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-[0.83rem] text-[#1a1a1a]">
                    {item.quantity}
                  </td>
                  <td className="px-3 py-2.5 text-[0.83rem] text-[#1a1a1a]">
                    {item.unit_price != null ? (
                      <span>
                        {fmtPrice(item.unit_price, item.currency)}
                        {item.unit_price > 0 && (
                          <span className="ml-1.5 text-[0.72rem] text-[#9ca3af]">
                            = {fmtPrice(item.quantity * item.unit_price, item.currency)}
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="italic text-[#ccc]">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-[0.78rem] text-[#5c5e62]">
                    {item.notes ?? ""}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        title="Edit item"
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-black/[0.09] text-[#5c5e62] transition hover:border-[#1a1a1a] hover:text-[#1a1a1a]"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        title="Delete item"
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-200 text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        {deletingId === item.id
                          ? <Loader2 size={12} className="animate-spin" />
                          : <Trash2 size={12} />
                        }
                      </button>
                    </div>
                  </td>
                </tr>
              )
            )}

            {/* Add form row */}
            {showAdd && (
              <ItemFormRow
                value={addDraft}
                onChange={setAddDraft}
                onSubmit={handleAdd}
                onCancel={() => { setShowAdd(false); setAddError(null); }}
                loading={addBusy}
                error={addError}
                submitLabel="Add"
              />
            )}

          </tbody>
        </table>
      </div>

      {/* Total row */}
      {proposalTotal !== null && proposalTotal > 0 && (
        <div className="mt-3 flex justify-end">
          <div className="flex items-center gap-3 rounded-xl border border-black/[0.06] bg-[#fafafa] px-4 py-2.5 text-[0.83rem]">
            <span className="text-[#5c5e62]">Proposal Total</span>
            <span className="font-extrabold text-[#1a1a1a]">
              {fmtPrice(proposalTotal, currency)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
