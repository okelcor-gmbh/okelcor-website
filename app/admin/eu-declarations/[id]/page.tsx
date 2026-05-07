import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import {
  AdminUnauthorizedError,
  AdminForbiddenError,
  adminApiFetch,
} from "@/lib/admin-api";

export const metadata: Metadata = {
  title: "EU Declaration — Admin",
};

// ── Types ─────────────────────────────────────────────────────────────────────

type EuDeclarationFull = {
  id: number;
  order_id: number;
  order_ref: string;
  customer_name: string;
  company_name?: string | null;
  email?: string | null;
  country?: string | null;
  vat_number?: string | null;
  status: "pending" | "signed" | "acknowledged";
  signed_at?: string | null;
  signed_document_url?: string | null;
  notes?: string | null;
  admin_notes?: string | null;
  created_at: string;
  updated_at?: string | null;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  pending:      "bg-amber-100 text-amber-700",
  signed:       "bg-blue-100 text-blue-700",
  acknowledged: "bg-emerald-100 text-emerald-700",
};

const STATUS_LABELS: Record<string, string> = {
  pending:      "Pending — awaiting customer signature",
  signed:       "Signed — awaiting admin acknowledgement",
  acknowledged: "Acknowledged — declaration complete",
};

function shortDate(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    }).format(new Date(iso));
  } catch { return iso; }
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">{label}</p>
      <p className="text-[0.875rem] text-[#1a1a1a]">{value ?? "—"}</p>
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

      {/* Status banner */}
      <div className={`flex items-center gap-3 rounded-2xl border px-5 py-4 ${
        declaration.status === "acknowledged"
          ? "border-emerald-200 bg-emerald-50"
          : declaration.status === "signed"
          ? "border-blue-200 bg-blue-50"
          : "border-amber-200 bg-amber-50"
      }`}>
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-[0.75rem] font-bold capitalize ${STATUS_STYLES[declaration.status] ?? "bg-gray-100 text-gray-500"}`}>
          {declaration.status}
        </span>
        <p className={`text-[0.875rem] font-semibold ${
          declaration.status === "acknowledged"
            ? "text-emerald-800"
            : declaration.status === "signed"
            ? "text-blue-800"
            : "text-amber-800"
        }`}>
          {STATUS_LABELS[declaration.status] ?? declaration.status}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">

        {/* Order & Customer */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="mb-5 text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#E85C1A]">
            Order &amp; Customer
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-0.5">
              <p className="text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">Order Ref</p>
              <Link
                href={`/admin/orders/${declaration.order_ref}`}
                className="font-mono text-[0.875rem] font-semibold text-[#E85C1A] hover:underline"
              >
                {declaration.order_ref}
              </Link>
            </div>
            <InfoRow label="Customer"     value={declaration.customer_name} />
            <InfoRow label="Company"      value={declaration.company_name} />
            <InfoRow label="Email"        value={declaration.email} />
            <InfoRow label="Country"      value={declaration.country} />
            <InfoRow label="VAT Number"   value={declaration.vat_number} />
          </div>
        </div>

        {/* Declaration Details */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="mb-5 text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#E85C1A]">
            Declaration Details
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InfoRow label="Created"    value={shortDate(declaration.created_at)} />
            <InfoRow label="Signed At"  value={shortDate(declaration.signed_at)} />
            <InfoRow label="Updated"    value={shortDate(declaration.updated_at)} />
          </div>

          {declaration.signed_document_url && (
            <div className="mt-4">
              <p className="mb-1.5 text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">
                Signed Document
              </p>
              <a
                href={declaration.signed_document_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-[#E85C1A]/30 bg-[#fff5f2] px-4 py-1.5 text-[0.8rem] font-semibold text-[#E85C1A] transition hover:bg-[#fff0ea]"
              >
                Download / View Document
              </a>
            </div>
          )}
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
                <p className="mb-1 text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">Customer Notes</p>
                <p className="text-[0.875rem] text-[#1a1a1a]">{declaration.notes}</p>
              </div>
            )}
            {declaration.admin_notes && (
              <div className="rounded-xl bg-amber-50 px-4 py-3">
                <p className="mb-1 text-[0.7rem] font-bold uppercase tracking-[0.1em] text-amber-600">Internal Notes</p>
                <p className="text-[0.875rem] text-[#1a1a1a]">{declaration.admin_notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
