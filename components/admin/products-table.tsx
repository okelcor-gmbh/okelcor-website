"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Pencil, Trash2, ToggleLeft, ToggleRight, ChevronLeft, ChevronRight, X, ShoppingBag, PackageX, PackageCheck, AlertTriangle, ExternalLink, AlertCircle } from "lucide-react";
import { toggleProductActive, deleteProduct, listOnEbay, removeFromEbay, toggleProductStock, markAllOutOfStock, markAllInStock } from "@/app/admin/products/actions";
import type { AdminProduct } from "@/lib/admin-api";
import { getProductImageUrl } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

type Meta = {
  total?: number;
  current_page?: number;
  last_page?: number;
  per_page?: number;
};

type Props = {
  products: AdminProduct[];
  meta: Meta;
  currentQ: string;
  currentType: string;
  currentPage: number;
  currentView?: "all" | "b2b" | "b2c";
};

// ── Constants ─────────────────────────────────────────────────────────────────

const TYPE_OPTIONS = ["all", "PCR", "TBR", "Used", "OTR"] as const;

// ── Sub-components ────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    PCR:  "bg-blue-100 text-blue-700",
    TBR:  "bg-purple-100 text-purple-700",
    Used: "bg-amber-100 text-amber-700",
    OTR:  "bg-green-100 text-green-700",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.68rem] font-bold uppercase tracking-wide ${colors[type] ?? "bg-gray-100 text-gray-600"}`}>
      {type}
    </span>
  );
}

function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.68rem] font-bold ${active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function StockBadge({ inStock }: { inStock: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[0.68rem] font-bold ${inStock ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-600"}`}>
      {inStock ? <PackageCheck size={10} strokeWidth={2.5} /> : <PackageX size={10} strokeWidth={2.5} />}
      {inStock ? "In Stock" : "Out of Stock"}
    </span>
  );
}

function EbayProductBadge({ product }: { product: AdminProduct }) {
  if (!product.ebay_listed && !product.ebay_status) {
    return <span className="text-[0.72rem] text-[#aaa]">—</span>;
  }

  const STATUS_STYLES: Record<string, string> = {
    active:    "bg-green-100 text-green-700",
    draft:     "bg-amber-100 text-amber-700",
    error:     "bg-red-100 text-red-600",
    ended:     "bg-gray-100 text-gray-500",
    withdrawn: "bg-gray-100 text-gray-500",
    unknown:   "bg-gray-100 text-gray-500",
  };

  const status = product.ebay_status ?? (product.ebay_listed ? "active" : null);
  const label  = status ? status.charAt(0).toUpperCase() + status.slice(1) : "Live";
  const style  = status ? (STATUS_STYLES[status] ?? "bg-gray-100 text-gray-500") : "bg-green-100 text-green-700";

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.68rem] font-bold ${style}`}>
          <ShoppingBag size={9} strokeWidth={2.5} />
          {label}
        </span>
        {product.ebay_item_id && (
          <a
            href={`https://www.ebay.de/itm/${product.ebay_item_id}`}
            target="_blank"
            rel="noopener noreferrer"
            title={`eBay item ${product.ebay_item_id}`}
            className="flex h-4 w-4 items-center justify-center rounded text-[#5c5e62] hover:text-green-600"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink size={10} strokeWidth={2} />
          </a>
        )}
        {product.ebay_sync_error && (
          <span
            title={product.ebay_sync_error}
            className="flex h-4 w-4 items-center justify-center text-red-500"
          >
            <AlertCircle size={10} strokeWidth={2} />
          </span>
        )}
      </div>
    </div>
  );
}

// ── Delete confirmation modal ─────────────────────────────────────────────────

function ConfirmDeleteModal({
  product,
  onCancel,
  onConfirm,
  deleting,
}: {
  product: AdminProduct;
  onCancel: () => void;
  onConfirm: () => void;
  deleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-[420px] rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-5 flex items-start justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-100">
            <Trash2 size={18} className="text-red-600" />
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#5c5e62] hover:bg-[#f0f2f5]"
          >
            <X size={16} />
          </button>
        </div>
        <h3 className="text-[1rem] font-extrabold text-[#1a1a1a]">Delete Product?</h3>
        <p className="mt-2 text-[0.875rem] leading-6 text-[#5c5e62]">
          <span className="font-semibold text-[#1a1a1a]">{product.brand} {product.name}</span> ({product.sku}) will be permanently removed from the catalogue. This cannot be undone.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="flex h-10 flex-1 items-center justify-center rounded-full border border-black/10 bg-white text-[0.875rem] font-semibold text-[#1a1a1a] transition hover:bg-[#f0f2f5] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="flex h-10 flex-1 items-center justify-center rounded-full bg-red-600 text-[0.875rem] font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main table ────────────────────────────────────────────────────────────────

export default function ProductsTable({
  products,
  meta,
  currentQ,
  currentType,
  currentPage,
  currentView = "all",
}: Props) {
  const router = useRouter();
  const [q, setQ] = useState(currentQ);
  const [type, setType] = useState(currentType);
  const [confirmDelete, setConfirmDelete] = useState<AdminProduct | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [stockTogglingId, setStockTogglingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [ebayActionId, setEbayActionId] = useState<number | null>(null);
  const [bulkStockPending, setBulkStockPending] = useState(false);
  const [confirmBulkOutOfStock, setConfirmBulkOutOfStock] = useState(false);
  const [confirmBulkInStock, setConfirmBulkInStock] = useState(false);
  const [, startTransition] = useTransition();

  // ── URL navigation ──────────────────────────────────────────────────────────

  const buildUrl = (overrides: { q?: string; type?: string; page?: number }) => {
    const params = new URLSearchParams();
    const qVal = overrides.q ?? q;
    const typeVal = overrides.type ?? type;
    const pageVal = overrides.page ?? 1;
    if (qVal.trim()) params.set("q", qVal.trim());
    if (typeVal && typeVal !== "all") params.set("type", typeVal);
    if (pageVal > 1) params.set("page", String(pageVal));
    if (currentView !== "all") params.set("view", currentView);
    const qs = params.toString();
    return `/admin/products${qs ? `?${qs}` : ""}`;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(buildUrl({ page: 1 }));
  };

  const handleTypeChange = (val: string) => {
    setType(val);
    router.push(buildUrl({ type: val, page: 1 }));
  };

  // ── Actions ─────────────────────────────────────────────────────────────────

  const handleToggle = (product: AdminProduct) => {
    setActionError(null);
    setTogglingId(product.id);
    startTransition(async () => {
      const result = await toggleProductActive(product.id, !(product.is_active ?? true));
      if (result.error) setActionError(result.error);
      else router.refresh();
      setTogglingId(null);
    });
  };

  const handleEbayToggle = (product: AdminProduct) => {
    setActionError(null);
    setEbayActionId(product.id);
    startTransition(async () => {
      const result = product.ebay_listed
        ? await removeFromEbay(product.id)
        : await listOnEbay(product.id);
      if (result.error) setActionError(result.error);
      else router.refresh();
      setEbayActionId(null);
    });
  };

  const handleStockToggle = (product: AdminProduct) => {
    setActionError(null);
    setStockTogglingId(product.id);
    startTransition(async () => {
      const result = await toggleProductStock(product.id, !(product.in_stock ?? true));
      if (result.error) setActionError(result.error);
      else router.refresh();
      setStockTogglingId(null);
    });
  };

  const handleMarkAllOutOfStock = () => {
    setActionError(null);
    setBulkStockPending(true);
    setConfirmBulkOutOfStock(false);
    startTransition(async () => {
      const result = await markAllOutOfStock();
      if (result.error) setActionError(result.error);
      else router.refresh();
      setBulkStockPending(false);
    });
  };

  const handleMarkAllInStock = () => {
    setActionError(null);
    setBulkStockPending(true);
    setConfirmBulkInStock(false);
    startTransition(async () => {
      const result = await markAllInStock();
      if (result.error) setActionError(result.error);
      else router.refresh();
      setBulkStockPending(false);
    });
  };

  const handleDelete = () => {
    if (!confirmDelete) return;
    setActionError(null);
    setDeletingId(confirmDelete.id);
    startTransition(async () => {
      const result = await deleteProduct(confirmDelete.id);
      if (result.error) {
        setActionError(result.error);
        setDeletingId(null);
        setConfirmDelete(null);
      } else {
        setConfirmDelete(null);
        setDeletingId(null);
        router.push("/admin/products");
      }
    });
  };

  // ── B2B / B2C client-side filter ────────────────────────────────────────────
  // When a segment tab is active, only show products with the matching price tier.
  // The API also receives segment= param so the backend can filter server-side
  // once that feature is implemented — client filter acts as an immediate fallback.
  const displayProducts = useMemo(() => {
    if (currentView === "b2b") return products.filter((p) => p.price_b2b != null && Number(p.price_b2b) > 0);
    if (currentView === "b2c") return products.filter((p) => p.price_b2c != null && Number(p.price_b2c) > 0);
    return products;
  }, [products, currentView]);

  // ── Pagination ──────────────────────────────────────────────────────────────

  const lastPage = meta.last_page ?? 1;
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < lastPage;

  return (
    <>
      {/* Bulk out-of-stock confirm modal */}
      {confirmBulkOutOfStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-[420px] rounded-2xl bg-white p-8 shadow-2xl">
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-amber-100">
              <AlertTriangle size={18} className="text-amber-600" />
            </div>
            <h3 className="text-[1rem] font-extrabold text-[#1a1a1a]">Mark All Out of Stock?</h3>
            <p className="mt-2 text-[0.875rem] leading-6 text-[#5c5e62]">
              This will set <span className="font-semibold text-[#1a1a1a]">all products</span> to Out of Stock across the entire catalogue. You can re-enable individual products afterwards.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmBulkOutOfStock(false)}
                className="flex h-10 flex-1 items-center justify-center rounded-full border border-black/10 bg-white text-[0.875rem] font-semibold text-[#1a1a1a] transition hover:bg-[#f0f2f5]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleMarkAllOutOfStock}
                className="flex h-10 flex-1 items-center justify-center rounded-full bg-amber-500 text-[0.875rem] font-semibold text-white transition hover:bg-amber-600"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk in-stock confirm modal */}
      {confirmBulkInStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-[420px] rounded-2xl bg-white p-8 shadow-2xl">
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-blue-100">
              <PackageCheck size={18} className="text-blue-600" />
            </div>
            <h3 className="text-[1rem] font-extrabold text-[#1a1a1a]">Mark All In Stock?</h3>
            <p className="mt-2 text-[0.875rem] leading-6 text-[#5c5e62]">
              This will set <span className="font-semibold text-[#1a1a1a]">all products</span> to In Stock across the entire catalogue.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmBulkInStock(false)}
                className="flex h-10 flex-1 items-center justify-center rounded-full border border-black/10 bg-white text-[0.875rem] font-semibold text-[#1a1a1a] transition hover:bg-[#f0f2f5]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleMarkAllInStock}
                className="flex h-10 flex-1 items-center justify-center rounded-full bg-blue-600 text-[0.875rem] font-semibold text-white transition hover:bg-blue-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {confirmDelete && (
        <ConfirmDeleteModal
          product={confirmDelete}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={handleDelete}
          deleting={deletingId === confirmDelete.id}
        />
      )}

      {/* Error banner */}
      {actionError && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[0.83rem] text-red-700">
          <span>{actionError}</span>
          <button type="button" onClick={() => setActionError(null)} className="ml-3">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Bulk stock toolbar */}
      <div className="mb-3 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => setConfirmBulkInStock(true)}
          disabled={bulkStockPending}
          className="flex items-center gap-2 rounded-xl border border-blue-300 bg-blue-50 px-4 py-2 text-[0.8rem] font-semibold text-blue-700 transition hover:bg-blue-100 disabled:opacity-50"
        >
          <PackageCheck size={14} strokeWidth={2} />
          {bulkStockPending ? "Updating…" : "Mark All In Stock"}
        </button>
        <button
          type="button"
          onClick={() => setConfirmBulkOutOfStock(true)}
          disabled={bulkStockPending}
          className="flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-[0.8rem] font-semibold text-amber-700 transition hover:bg-amber-100 disabled:opacity-50"
        >
          <PackageX size={14} strokeWidth={2} />
          {bulkStockPending ? "Updating…" : "Mark All Out of Stock"}
        </button>
      </div>

      {/* Search + filter bar */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <form onSubmit={handleSearch} className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5c5e62]"
            />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by SKU, brand, name…"
              className="h-10 w-full rounded-xl border border-black/[0.09] bg-white pl-9 pr-4 text-[0.875rem] text-[#1a1a1a] outline-none placeholder:text-[#aaa] transition focus:border-[#E85C1A] focus:ring-2 focus:ring-[#E85C1A]/10"
            />
          </div>
          <button
            type="submit"
            className="h-10 rounded-xl bg-[#1a1a1a] px-4 text-[0.875rem] font-semibold text-white transition hover:bg-[#333]"
          >
            Search
          </button>
        </form>

        {/* Type filter */}
        <div className="flex gap-1.5 overflow-x-auto">
          {TYPE_OPTIONS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => handleTypeChange(t)}
              className={[
                "h-10 whitespace-nowrap rounded-xl px-3.5 text-[0.8rem] font-semibold transition",
                type === t
                  ? "bg-[#E85C1A] text-white"
                  : "bg-white text-[#5c5e62] border border-black/[0.09] hover:border-[#E85C1A] hover:text-[#E85C1A]",
              ].join(" ")}
            >
              {t === "all" ? "All Types" : t}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-left">
            <thead>
              <tr className="border-b border-black/[0.06] bg-[#fafafa]">
                {[
                  "Image", "SKU / Name", "Brand", "Type", "Size",
                  currentView === "b2b" ? "Wholesale" : currentView === "b2c" ? "Retail" : "Price",
                  "Status", "Stock", "eBay", "Actions",
                ].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-[0.7rem] font-bold uppercase tracking-[0.12em] text-[#5c5e62]"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {displayProducts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-[0.875rem] text-[#5c5e62]">
                    {currentView === "b2b"
                      ? "No B2B products found. Import a CSV with price_b2b values or add pricing in the product edit page."
                      : currentView === "b2c"
                      ? "No B2C products found. Import a CSV with price_b2c values or add pricing in the product edit page."
                      : <>No products found. Try adjusting your search or{" "}
                          <Link href="/admin/products/new" className="font-semibold text-[#E85C1A] underline">add one</Link>.</>
                    }
                  </td>
                </tr>
              ) : (
                displayProducts.map((product) => {
                  const active = product.is_active ?? true;
                  const inStock = product.in_stock ?? true;
                  const isToggling = togglingId === product.id;
                  const isStockToggling = stockTogglingId === product.id;
                  const isEbayActing = ebayActionId === product.id;
                  return (
                    <tr key={product.id} className="group transition hover:bg-[#fafafa]">
                      {/* Thumbnail */}
                      <td className="px-4 py-3">
                        <div className="h-11 w-11 overflow-hidden rounded-lg bg-[#f0f2f5]">
                          {(product.image_url || product.primary_image) ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={getProductImageUrl(product.image_url ?? product.primary_image)}
                              alt={product.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[0.6rem] font-bold text-[#aaa]">
                              IMG
                            </div>
                          )}
                        </div>
                      </td>

                      {/* SKU + Name */}
                      <td className="px-4 py-3">
                        <p className="text-[0.82rem] font-extrabold text-[#1a1a1a]">
                          {product.name}
                        </p>
                        <p className="text-[0.73rem] font-mono text-[#5c5e62]">{product.sku}</p>
                      </td>

                      {/* Brand */}
                      <td className="px-4 py-3 text-[0.875rem] text-[#1a1a1a]">
                        {product.brand}
                      </td>

                      {/* Type */}
                      <td className="px-4 py-3">
                        <TypeBadge type={product.type} />
                      </td>

                      {/* Size */}
                      <td className="px-4 py-3 text-[0.875rem] text-[#5c5e62]">
                        {product.size}
                      </td>

                      {/* Price */}
                      <td className="px-4 py-3">
                        {currentView === "b2b" ? (
                          <span className="text-[0.875rem] font-semibold text-green-700">
                            €{Number(product.price_b2b).toFixed(2)}
                          </span>
                        ) : currentView === "b2c" ? (
                          <span className="text-[0.875rem] font-semibold text-[#1a1a1a]">
                            €{Number(product.price_b2c).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-[0.875rem] font-semibold text-[#1a1a1a]">
                            €{Number(product.price).toFixed(2)}
                          </span>
                        )}
                      </td>

                      {/* Active status */}
                      <td className="px-4 py-3">
                        <ActiveBadge active={active} />
                      </td>

                      {/* Stock status */}
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => handleStockToggle(product)}
                          disabled={isStockToggling}
                          title={inStock ? "Mark Out of Stock" : "Mark In Stock"}
                          className="disabled:opacity-50"
                        >
                          <StockBadge inStock={inStock} />
                        </button>
                      </td>

                      {/* eBay status */}
                      <td className="px-4 py-3">
                        <EbayProductBadge product={product} />
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {/* Edit */}
                          <Link
                            href={`/admin/products/${product.id}`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#5c5e62] transition hover:bg-[#E85C1A]/10 hover:text-[#E85C1A]"
                            title="Edit"
                          >
                            <Pencil size={14} strokeWidth={2} />
                          </Link>

                          {/* Toggle active */}
                          <button
                            type="button"
                            onClick={() => handleToggle(product)}
                            disabled={isToggling}
                            title={active ? "Deactivate" : "Activate"}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#5c5e62] transition hover:bg-[#f0f2f5] hover:text-[#1a1a1a] disabled:opacity-40"
                          >
                            {active ? (
                              <ToggleRight size={16} className="text-emerald-600" />
                            ) : (
                              <ToggleLeft size={16} />
                            )}
                          </button>

                          {/* eBay toggle */}
                          <button
                            type="button"
                            onClick={() => handleEbayToggle(product)}
                            disabled={isEbayActing}
                            title={product.ebay_listed ? "Remove from eBay" : "List on eBay"}
                            className={[
                              "flex h-8 w-8 items-center justify-center rounded-lg transition disabled:opacity-40",
                              product.ebay_listed
                                ? "text-green-600 hover:bg-green-50 hover:text-green-700"
                                : "text-[#5c5e62] hover:bg-green-50 hover:text-green-600",
                            ].join(" ")}
                          >
                            <ShoppingBag size={14} strokeWidth={2} />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(product)}
                            title="Delete"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#5c5e62] transition hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={14} strokeWidth={2} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination — hidden for segment views since filtering is client-side */}
        {lastPage > 1 && currentView === "all" && (
          <div className="flex items-center justify-between border-t border-black/[0.06] px-5 py-3">
            <p className="text-[0.78rem] text-[#5c5e62]">
              Page {currentPage} of {lastPage}
              {typeof meta.total === "number" && ` · ${meta.total} products`}
            </p>
            <div className="flex gap-2">
              <Link
                href={hasPrev ? buildUrl({ page: currentPage - 1 }) : "#"}
                aria-disabled={!hasPrev}
                className={[
                  "flex h-8 w-8 items-center justify-center rounded-lg border border-black/[0.09] transition",
                  hasPrev
                    ? "bg-white text-[#1a1a1a] hover:border-[#E85C1A] hover:text-[#E85C1A]"
                    : "pointer-events-none bg-[#f5f5f5] text-[#ccc]",
                ].join(" ")}
              >
                <ChevronLeft size={14} />
              </Link>
              <Link
                href={hasNext ? buildUrl({ page: currentPage + 1 }) : "#"}
                aria-disabled={!hasNext}
                className={[
                  "flex h-8 w-8 items-center justify-center rounded-lg border border-black/[0.09] transition",
                  hasNext
                    ? "bg-white text-[#1a1a1a] hover:border-[#E85C1A] hover:text-[#E85C1A]"
                    : "pointer-events-none bg-[#f5f5f5] text-[#ccc]",
                ].join(" ")}
              >
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
