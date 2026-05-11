"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2, AlertCircle, ChevronDown, Paperclip,
  Download, ShoppingCart, ExternalLink,
} from "lucide-react";
import { updateQuoteStatus } from "@/app/admin/quotes/actions";
import type { ConvertToOrderResult } from "@/app/admin/quotes/actions";
import type { AdminQuoteFull } from "@/lib/admin-api";
import { formatIncoterm } from "@/lib/utils";
import QuoteConvertModal from "@/components/admin/quote-convert-modal";

const QUOTE_STATUSES = ["new", "reviewed", "quoted", "closed"] as const;
type QuoteStatus = (typeof QUOTE_STATUSES)[number];

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  new:      "bg-orange-100 text-orange-700",
  reviewed: "bg-blue-100 text-blue-700",
  quoted:   "bg-emerald-100 text-emerald-700",
  closed:   "bg-gray-100 text-gray-500",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-[0.75rem] font-bold capitalize ${STATUS_STYLES[status] ?? "bg-gray-100 text-gray-500"}`}>
      {status}
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

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const ENUM_LABELS: Record<string, string> = {
  grade_a:        "Grade A",
  grade_b:        "Grade B",
  mixed:          "Mixed",
  new:            "New",
  used:           "Used",
  delivery_terms: "Delivery Terms",
  shipping_terms: "Shipping Terms",
};

function formatEnum(value?: string | null): string | null {
  if (!value) return null;
  return ENUM_LABELS[value] ?? value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function InfoRow({ label, value, fallback }: { label: string; value?: string | null; fallback?: string }) {
  if (!value && !fallback) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">{label}</p>
      <p className={`text-[0.875rem] ${!value ? "italic text-[#9ca3af]" : "text-[#1a1a1a]"}`}>
        {value || fallback}
      </p>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <p className="mb-5 text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#E85C1A]">{title}</p>
      {children}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function QuoteDetail({ quote }: { quote: AdminQuoteFull }) {
  const router = useRouter();
  const [status, setStatus] = useState<QuoteStatus>(
    QUOTE_STATUSES.includes(quote.status as QuoteStatus)
      ? (quote.status as QuoteStatus)
      : "new"
  );
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [showConvertModal, setShowConvertModal] = useState(false);
  const [convertedOrder, setConvertedOrder] = useState<ConvertToOrderResult | null>(null);

  const isDirty = status !== quote.status;

  const effectiveOrderRef = convertedOrder?.order_ref ?? quote.order_ref ?? null;
  const effectiveOrderId  = convertedOrder?.order_id  ?? quote.order_id  ?? null;
  const isConverted       = !!(effectiveOrderRef || convertedOrder);

  const handleSave = () => {
    setSaveError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateQuoteStatus(quote.id, status);
      if (result.error) {
        setSaveError(result.error);
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        router.push("/admin/quotes");
      }
    });
  };

  function handleConvertSuccess(result: ConvertToOrderResult) {
    setConvertedOrder(result);
    setShowConvertModal(false);
  }

  // Attachment
  const attachmentUrl  = quote.attachment_url ?? quote.attachment_path ?? null;
  const attachmentName = quote.attachment_original_name ?? quote.attachment_name ?? null;
  const hasAttachment  = !!(attachmentUrl || attachmentName);

  // Tyre items
  const hasTyreItems = Array.isArray(quote.tyre_items) && quote.tyre_items.length > 0;
  const isUsed       = quote.tyre_condition === "used";

  // Incoterm label
  const incotermLabel =
    quote.incoterm_type === "delivery_terms" ? "Delivery Terms" :
    quote.incoterm_type === "shipping_terms" ? "Shipping Terms" :
    "Incoterm";

  return (
    <>
      <div className="flex flex-col gap-6">

        {/* ── Quote Status card ── */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="mb-4 text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#E85C1A]">
            Quote Status
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
              Status updated successfully.
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="text-[0.83rem] text-[#5c5e62]">Current:</span>
              <StatusBadge status={quote.status} />
            </div>

            <div className="relative">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as QuoteStatus)}
                className="h-10 appearance-none rounded-xl border border-black/[0.09] bg-white pl-3.5 pr-9 text-[0.875rem] font-semibold text-[#1a1a1a] outline-none transition focus:border-[#E85C1A] focus:ring-2 focus:ring-[#E85C1A]/10"
              >
                {QUOTE_STATUSES.map((s) => (
                  <option key={s} value={s} className="capitalize">
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#5c5e62]" />
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={isPending || !isDirty}
              className="h-10 rounded-full bg-[#E85C1A] px-6 text-[0.875rem] font-semibold text-white transition hover:bg-[#d14f14] disabled:opacity-50"
            >
              {isPending ? "Saving…" : "Save Status"}
            </button>
          </div>
        </div>

        {/* ── Order Conversion card ── */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="mb-4 text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#E85C1A]">
            Order Conversion
          </p>

          {isConverted ? (
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5">
                <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                <p className="text-[0.875rem] font-semibold text-emerald-800">
                  Converted to order:&nbsp;
                  <span className="font-extrabold">{effectiveOrderRef}</span>
                </p>
              </div>

              {effectiveOrderId != null ? (
                <Link
                  href={`/admin/orders/${effectiveOrderId}`}
                  className="flex items-center gap-1.5 rounded-full border border-[#E85C1A] px-5 py-2.5 text-[0.83rem] font-semibold text-[#E85C1A] transition hover:bg-[#E85C1A] hover:text-white"
                >
                  <ExternalLink size={13} />
                  View Order
                </Link>
              ) : (
                <Link
                  href={`/admin/orders?q=${encodeURIComponent(effectiveOrderRef ?? "")}`}
                  className="flex items-center gap-1.5 rounded-full border border-[#E85C1A] px-5 py-2.5 text-[0.83rem] font-semibold text-[#E85C1A] transition hover:bg-[#E85C1A] hover:text-white"
                >
                  <ExternalLink size={13} />
                  View Order
                </Link>
              )}
            </div>
          ) : quote.status === "quoted" ? (
            <div className="flex flex-wrap items-center gap-4">
              <p className="text-[0.83rem] text-[#5c5e62]">
                This quote is ready to be converted into a confirmed order.
              </p>
              <button
                type="button"
                onClick={() => setShowConvertModal(true)}
                className="flex items-center gap-2 rounded-full bg-[#E85C1A] px-6 py-2.5 text-[0.875rem] font-semibold text-white transition hover:bg-[#d14f14]"
              >
                <ShoppingCart size={15} />
                Convert to Order
              </button>
            </div>
          ) : (
            <p className="text-[0.83rem] text-[#5c5e62]">
              Order conversion is available once this quote&apos;s status is set to{" "}
              <span className="font-semibold text-emerald-700">Quoted</span>.
            </p>
          )}
        </div>

        {/* ── 1. Customer & Company ── */}
        <SectionCard title="Customer & Company">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <InfoRow label="Full Name"      value={quote.full_name} />
            <InfoRow label="Contact Person" value={quote.contact_person} />
            <InfoRow label="Email"          value={quote.email} />
            <InfoRow label="Phone"          value={quote.phone} />
            <InfoRow label="Company Name"   value={quote.company_name} />
            <InfoRow label="Business Type"  value={quote.business_type} />
            <InfoRow label="Country"        value={quote.country} />
            <InfoRow label="Submitted"      value={shortDate(quote.created_at)} />
            <InfoRow label="Last Updated"   value={shortDate(quote.updated_at)} />
            {(quote.company_address || quote.company_city || quote.company_postal_code) && (
              <div className="col-span-full flex flex-col gap-0.5">
                <p className="text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">Company Address</p>
                <p className="text-[0.875rem] text-[#1a1a1a]">
                  {[quote.company_address, quote.company_city, quote.company_postal_code]
                    .filter(Boolean).join(", ")}
                </p>
              </div>
            )}
          </div>
        </SectionCard>

        {/* ── 2. VAT & Compliance ── */}
        <SectionCard title="VAT & Compliance">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <InfoRow label="VAT Number" value={quote.vat_number} fallback="Not provided" />
            <div className="flex flex-col gap-0.5">
              <p className="text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">VAT Validated</p>
              {quote.vat_valid === true ? (
                <span className="inline-flex items-center gap-1.5 text-[0.875rem] font-semibold text-emerald-700">
                  <CheckCircle2 size={14} strokeWidth={2} /> Verified
                </span>
              ) : (
                <span className="text-[0.875rem] italic text-[#9ca3af]">Not verified</span>
              )}
            </div>
          </div>
        </SectionCard>

        {/* ── 3. Tyre Requirements ── */}
        <SectionCard title="Tyre Requirements">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <InfoRow label="Tyre Category"    value={quote.tyre_category} />
            <InfoRow label="Tyre Condition"   value={formatEnum(quote.tyre_condition)} />
            <InfoRow label="Brand Preference" value={quote.brand_preference} />
          </div>

          {/* Tyre items table — preferred path */}
          {hasTyreItems ? (
            <div className="mt-5">
              <p className="mb-3 text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">
                Tyre Sizes &amp; Quantities
              </p>
              <div className="overflow-x-auto rounded-xl border border-black/[0.06]">
                <table className="w-full text-[0.875rem]">
                  <thead>
                    <tr className="border-b border-black/[0.06] bg-[#f8f8f8]">
                      <th className="px-4 py-2.5 text-left text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">#</th>
                      <th className="px-4 py-2.5 text-left text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">Tyre Size</th>
                      <th className="px-4 py-2.5 text-left text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quote.tyre_items?.map((item, i) => (
                      <tr key={i} className="border-b border-black/[0.04] last:border-0">
                        <td className="px-4 py-2.5 text-[#5c5e62]">{i + 1}</td>
                        <td className="px-4 py-2.5 font-medium text-[#1a1a1a]">{item.size || "—"}</td>
                        <td className="px-4 py-2.5 text-[#1a1a1a]">{item.quantity || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (quote.tyre_size || quote.quantity) ? (
            /* Legacy single-row fallback */
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InfoRow label="Tyre Size" value={quote.tyre_size} fallback="Not provided" />
              <InfoRow label="Quantity"  value={quote.quantity}  fallback="Not provided" />
            </div>
          ) : null}

          {/* Used tyre sub-section — shown only when condition is "used" */}
          {isUsed && (
            <div className="mt-5 border-t border-black/[0.05] pt-5">
              <p className="mb-3 text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">
                Used Tyre Specification
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InfoRow label="Grade" value={formatEnum(quote.used_tyre_grade)} fallback="Not specified" />
              </div>
              {quote.used_tyre_notes && (
                <div className="mt-3 flex flex-col gap-0.5">
                  <p className="text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">Condition Notes</p>
                  <p className="whitespace-pre-wrap text-[0.875rem] leading-relaxed text-[#1a1a1a]">
                    {quote.used_tyre_notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </SectionCard>

        {/* ── 4. Logistics & Terms ── */}
        <SectionCard title="Logistics & Terms">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <InfoRow label={incotermLabel}            value={quote.incoterm ? formatIncoterm(quote.incoterm) : undefined} fallback="Not specified" />
            <InfoRow label="Delivery Timeline"        value={quote.delivery_timeline} />
            <InfoRow label="Budget Range"             value={quote.budget_range} />
            <InfoRow label="Delivery Location / Port" value={quote.delivery_location} fallback="Not provided" />
          </div>
          {(quote.delivery_address || quote.delivery_city || quote.delivery_postal_code) && (
            <div className="mt-4 flex flex-col gap-0.5">
              <p className="text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">Delivery Address</p>
              <p className="text-[0.875rem] text-[#1a1a1a]">
                {[quote.delivery_address, quote.delivery_city, quote.delivery_postal_code]
                  .filter(Boolean).join(", ")}
              </p>
            </div>
          )}
        </SectionCard>

        {/* ── 5. Attachments & Notes ── */}
        <SectionCard title="Attachments & Notes">

          {/* Specification sheet */}
          <div className="mb-5">
            <p className="mb-3 text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">
              Specification Sheet
            </p>
            {hasAttachment ? (
              <div className="flex items-center justify-between rounded-xl border border-black/[0.07] bg-[#f8f8f8] px-4 py-3.5">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
                    <Paperclip size={15} strokeWidth={1.8} className="text-[#5c5e62]" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[0.875rem] font-semibold text-[#1a1a1a]">
                      {attachmentName ?? "Specification sheet"}
                    </p>
                    <p className="text-[0.72rem] text-[#5c5e62]">
                      {[
                        quote.attachment_size != null ? formatBytes(quote.attachment_size) : null,
                        quote.attachment_mime ?? null,
                      ].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </div>
                {attachmentUrl ? (
                  <a
                    href={attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-4 flex shrink-0 items-center gap-1.5 rounded-full bg-[#E85C1A] px-4 py-2 text-[0.8rem] font-semibold text-white transition hover:bg-[#d14f14]"
                  >
                    <Download size={13} strokeWidth={2} />
                    Download
                  </a>
                ) : (
                  <span className="ml-4 shrink-0 text-[0.78rem] text-[#5c5e62]">Download unavailable</span>
                )}
              </div>
            ) : (
              <p className="text-[0.83rem] italic text-[#9ca3af]">No specification sheet attached.</p>
            )}
          </div>

          {/* Customer notes */}
          <div className="mb-4">
            <p className="mb-2 text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">Customer Notes</p>
            {quote.notes ? (
              <p className="whitespace-pre-wrap text-[0.875rem] leading-relaxed text-[#1a1a1a]">
                {quote.notes}
              </p>
            ) : (
              <p className="text-[0.83rem] italic text-[#9ca3af]">None provided.</p>
            )}
          </div>

          {/* Internal admin notes */}
          {quote.admin_notes && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5">
              <p className="mb-1.5 text-[0.7rem] font-bold uppercase tracking-[0.1em] text-amber-700">
                Internal Admin Notes
              </p>
              <p className="whitespace-pre-wrap text-[0.875rem] leading-relaxed text-amber-900">
                {quote.admin_notes}
              </p>
            </div>
          )}
        </SectionCard>

      </div>

      {/* ── Conversion modal ── */}
      {showConvertModal && (
        <QuoteConvertModal
          quote={quote}
          onClose={() => setShowConvertModal(false)}
          onSuccess={handleConvertSuccess}
        />
      )}
    </>
  );
}
