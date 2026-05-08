import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ChevronLeft, Clock, AlertTriangle } from "lucide-react";
import {
  AdminUnauthorizedError,
  AdminForbiddenError,
  adminApiFetch,
} from "@/lib/admin-api";
import EuDeclarationActions from "@/components/admin/eu-declaration-actions";

export const metadata: Metadata = {
  title: "EU Declaration — Admin",
};

// ── Types ─────────────────────────────────────────────────────────────────────

type EuDeclarationFull = {
  id: number;
  order_id: number;
  order_ref: string;
  // Customer & company
  customer_name: string;
  company_name?: string | null;
  email?: string | null;
  // Delivery address snapshot from order
  delivery_address?: string | null;
  delivery_city?: string | null;
  delivery_postal_code?: string | null;
  country?: string | null;
  vat_number?: string | null;
  // Goods
  goods_description?: string | null;
  // Form fields submitted by the customer
  month_year_received?: string | null;
  member_state_of_entry?: string | null;
  place_of_entry?: string | null;
  self_transported?: boolean | null;
  month_year_transport_ended?: string | null;
  // Representative & signature
  representative_name?: string | null;
  representative_title?: string | null;
  signed_name?: string | null;
  // Status & timestamps
  status: "pending" | "signed" | "acknowledged";
  signed_at?: string | null;
  signed_document_url?: string | null;
  admin_acknowledged_at?: string | null;
  notes?: string | null;
  admin_notes?: string | null;
  reminder_count?: number | null;
  last_reminder_at?: string | null;
  created_at: string;
  updated_at?: string | null;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function shortDate(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    }).format(new Date(iso));
  } catch { return iso; }
}

function InfoRow({
  label,
  value,
  mono,
  span,
}: {
  label: string;
  value?: string | null;
  mono?: boolean;
  span?: boolean;
}) {
  return (
    <div className={`flex flex-col gap-0.5 ${span ? "sm:col-span-2" : ""}`}>
      <p className="text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">{label}</p>
      <p className={`text-[0.875rem] text-[#1a1a1a] ${mono ? "font-mono tracking-wide" : ""}`}>
        {value ?? "—"}
      </p>
    </div>
  );
}

function BoolBadge({ label, value }: { label: string; value?: boolean | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">{label}</p>
      {value == null ? (
        <p className="text-[0.875rem] text-[#1a1a1a]">—</p>
      ) : (
        <span className={`inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-[0.75rem] font-semibold ${
          value ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"
        }`}>
          {value ? "Yes" : "No"}
        </span>
      )}
    </div>
  );
}

// ── Compliance helpers ────────────────────────────────────────────────────────

type ComplianceUrgency = "normal" | "overdue" | "critical" | "signed" | "done";

function computeUrgency(dec: EuDeclarationFull): {
  urgency: ComplianceUrgency;
  daysPending: number | null;
} {
  let daysPending: number | null = null;
  const now = Date.now();
  if (dec.status === "pending") {
    daysPending = Math.floor((now - new Date(dec.created_at).getTime()) / 86_400_000);
  } else if (dec.status === "signed") {
    const from = dec.signed_at ?? dec.created_at;
    daysPending = Math.floor((now - new Date(from).getTime()) / 86_400_000);
  }
  let urgency: ComplianceUrgency = "normal";
  if (dec.status === "acknowledged") urgency = "done";
  else if (dec.status === "signed") urgency = "signed";
  else if (daysPending !== null && daysPending > 30) urgency = "critical";
  else if (daysPending !== null && daysPending > 14) urgency = "overdue";
  return { urgency, daysPending };
}

const URGENCY_COLORS: Record<ComplianceUrgency, { strip: string; badge: string; text: string; sub: string }> = {
  normal:   { strip: "border-sky-200   bg-sky-50",   badge: "bg-sky-100   text-sky-700",   text: "text-sky-700",   sub: "text-sky-600" },
  overdue:  { strip: "border-amber-200 bg-amber-50", badge: "bg-amber-100 text-amber-700", text: "text-amber-700", sub: "text-amber-600" },
  critical: { strip: "border-red-200   bg-red-50",   badge: "bg-red-100   text-red-700",   text: "text-red-700",   sub: "text-red-600" },
  signed:   { strip: "border-blue-200  bg-blue-50",  badge: "bg-blue-100  text-blue-700",  text: "text-blue-700",  sub: "text-blue-600" },
  done:     { strip: "border-emerald-200 bg-emerald-50", badge: "bg-emerald-100 text-emerald-700", text: "text-emerald-700", sub: "text-emerald-600" },
};

const URGENCY_LABEL: Record<ComplianceUrgency, { state: string; desc: string }> = {
  normal:   { state: "On Track",          desc: "Pending — within the 14-day window" },
  overdue:  { state: "Overdue",           desc: "Pending — customer has not responded within 14 days" },
  critical: { state: "Critical — Overdue", desc: "Pending — 30+ days without a customer signature" },
  signed:   { state: "Awaiting Acknowledgement", desc: "Customer has signed — admin review needed" },
  done:     { state: "Complete",          desc: "Declaration acknowledged by admin" },
};

function ComplianceStrip({ declaration }: { declaration: EuDeclarationFull }) {
  const { urgency, daysPending } = computeUrgency(declaration);
  const c = URGENCY_COLORS[urgency];
  const l = URGENCY_LABEL[urgency];

  return (
    <div className={`grid grid-cols-2 gap-px overflow-hidden rounded-2xl border lg:grid-cols-4 ${c.strip}`}>

      {/* Days Pending */}
      <div className="flex flex-col gap-1 bg-white/70 px-5 py-4">
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">Days Pending</p>
        {daysPending === null ? (
          <p className="text-[0.875rem] text-[#1a1a1a]">—</p>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <p className={`text-[1.5rem] font-extrabold leading-none ${c.text}`}>{daysPending}</p>
            {urgency === "critical" && (
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.68rem] font-bold ${c.badge}`}>
                <AlertTriangle size={9} strokeWidth={2.5} />
                Critical
              </span>
            )}
            {urgency === "overdue" && (
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.68rem] font-bold ${c.badge}`}>
                <Clock size={9} strokeWidth={2.5} />
                Overdue
              </span>
            )}
          </div>
        )}
      </div>

      {/* Reminders Sent */}
      <div className="flex flex-col gap-1 bg-white/70 px-5 py-4">
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">Reminders Sent</p>
        {declaration.reminder_count != null ? (
          <p className="text-[1.5rem] font-extrabold leading-none text-[#1a1a1a]">{declaration.reminder_count}</p>
        ) : (
          <p className="text-[0.875rem] text-[#1a1a1a]">—</p>
        )}
      </div>

      {/* Last Reminder */}
      <div className="flex flex-col gap-1 bg-white/70 px-5 py-4">
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">Last Reminder</p>
        <p className="text-[0.875rem] text-[#1a1a1a]">{shortDate(declaration.last_reminder_at)}</p>
      </div>

      {/* Compliance State */}
      <div className="flex flex-col gap-1.5 bg-white/70 px-5 py-4">
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">Compliance State</p>
        <span className={`inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-[0.72rem] font-bold ${c.badge}`}>
          {l.state}
        </span>
        <p className={`text-[0.72rem] ${c.sub}`}>{l.desc}</p>
      </div>

    </div>
  );
}

// ── Data fetching ─────────────────────────────────────────────────────────────

async function fetchDeclaration(id: string): Promise<EuDeclarationFull | null> {
  try {
    const res = await adminApiFetch<EuDeclarationFull>(`/eu-declarations/${id}`, {
      revalidate: false,
    });
    return res.data ?? null;
  } catch (err) {
    if (err instanceof AdminUnauthorizedError) throw err;
    if (err instanceof AdminForbiddenError) throw err;
    return null;
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

type Props = { params: Promise<{ id: string }> };

export default async function EuDeclarationDetailPage({ params }: Props) {
  const { id } = await params;

  let declaration: EuDeclarationFull | null = null;
  try {
    declaration = await fetchDeclaration(id);
  } catch (err) {
    if (err instanceof AdminUnauthorizedError) redirect("/admin/login");
    if (err instanceof AdminForbiddenError) redirect("/admin/unauthorized");
  }

  if (!declaration) notFound();

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div>
        <Link
          href="/admin/eu-declarations"
          className="mb-4 inline-flex items-center gap-1.5 text-[0.83rem] font-semibold text-[#5c5e62] transition hover:text-[#1a1a1a]"
        >
          <ChevronLeft size={14} strokeWidth={2.2} />
          EU Declarations
        </Link>
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-[#E85C1A]">
          Compliance
        </p>
        <h1 className="text-[1.35rem] font-extrabold tracking-tight text-[#1a1a1a]">
          Declaration #{declaration.id}
        </h1>
        <p className="mt-0.5 text-[0.83rem] text-[#5c5e62]">
          Gelangensbestätigung — §17a UStDV
        </p>
      </div>

      {/* Status banner + actions — client component owns both so status updates optimistically */}
      <EuDeclarationActions
        id={declaration.id}
        initialStatus={declaration.status}
        orderRef={declaration.order_ref}
      />

      {/* Compliance metrics strip */}
      <ComplianceStrip declaration={declaration} />

      {/* Row 1: Order & Customer | Certificate Submission */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Order & Customer */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="mb-5 text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#E85C1A]">
            Order &amp; Customer
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Order ref gets full width */}
            <div className="flex flex-col gap-0.5 sm:col-span-2">
              <p className="text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">Order Ref</p>
              <Link
                href={`/admin/orders/${declaration.order_ref}`}
                className="font-mono text-[0.875rem] font-semibold text-[#E85C1A] hover:underline"
              >
                {declaration.order_ref}
              </Link>
            </div>
            <InfoRow label="Customer"       value={declaration.customer_name} />
            <InfoRow label="Company"        value={declaration.company_name} />
            <InfoRow label="Email"          value={declaration.email} />
            <InfoRow label="Country"        value={declaration.country} />
            <InfoRow label="VAT Number"     value={declaration.vat_number} mono />
            <InfoRow label="Street Address" value={declaration.delivery_address} />
            <InfoRow label="City"           value={declaration.delivery_city} />
            <InfoRow label="Postal Code"    value={declaration.delivery_postal_code} />
          </div>
        </div>

        {/* Certificate details — form fields submitted by the customer */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="mb-5 text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#E85C1A]">
            Certificate Details
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {declaration.goods_description && (
              <InfoRow
                label="Goods Description"
                value={declaration.goods_description}
                span
              />
            )}
            <InfoRow label="Month / Year Received"    value={declaration.month_year_received} />
            <InfoRow label="EU Member State"           value={declaration.member_state_of_entry} />
            <InfoRow
              label="Place of Entry / Customs Office"
              value={declaration.place_of_entry}
              span
            />
            <BoolBadge label="Own Transport"           value={declaration.self_transported} />
            {declaration.self_transported ? (
              <InfoRow label="Transport Ended"         value={declaration.month_year_transport_ended} />
            ) : (
              <div /> /* keep grid aligned */
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Representative & Signature */}
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <p className="mb-5 text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#E85C1A]">
          Representative &amp; Signature
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <InfoRow label="Representative Name"   value={declaration.representative_name} />
          <InfoRow label="Title / Position"      value={declaration.representative_title} />
          <InfoRow label="Signed Name (print)"   value={declaration.signed_name} mono />
          <InfoRow label="Signed At"             value={shortDate(declaration.signed_at)} />
        </div>
        {declaration.admin_acknowledged_at && (
          <div className="mt-5 border-t border-black/[0.05] pt-4">
            <InfoRow label="Acknowledged At" value={shortDate(declaration.admin_acknowledged_at)} />
          </div>
        )}
        <div className="mt-5 grid grid-cols-1 gap-4 border-t border-black/[0.05] pt-4 sm:grid-cols-3">
          <InfoRow label="Declaration ID" value={String(declaration.id)} mono />
          <InfoRow label="Created"        value={shortDate(declaration.created_at)} />
          <InfoRow label="Last Updated"   value={shortDate(declaration.updated_at)} />
        </div>
      </div>

      {/* Notes */}
      {(declaration.notes || declaration.admin_notes) && (
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="mb-4 text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#E85C1A]">
            Notes
          </p>
          <div className="flex flex-col gap-4">
            {declaration.notes && (
              <div>
                <p className="mb-1 text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">
                  Customer Notes
                </p>
                <p className="text-[0.875rem] text-[#1a1a1a]">{declaration.notes}</p>
              </div>
            )}
            {declaration.admin_notes && (
              <div className="rounded-xl bg-amber-50 px-4 py-3">
                <p className="mb-1 text-[0.7rem] font-bold uppercase tracking-[0.1em] text-amber-600">
                  Internal Notes
                </p>
                <p className="text-[0.875rem] text-[#1a1a1a]">{declaration.admin_notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
