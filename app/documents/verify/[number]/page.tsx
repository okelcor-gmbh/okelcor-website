import type { Metadata } from "next";
import { AlertTriangle, CheckCircle2, Mail, Phone, ShieldCheck, XCircle } from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { COMPANY_EMAIL, COMPANY_LEGAL_NAME, COMPANY_PHONE } from "@/lib/constants";

export const dynamic = "force-dynamic";

const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000/api/v1";

// ── Types ──────────────────────────────────────────────────────────────────────

type VerifyResult = {
  valid: boolean;
  document_number: string;
  document_type: string;
  order_reference: string;
  issued_at: string | null;
  status: "issued" | "sent" | "superseded" | "void" | string;
  company: string;
  message?: string | null;
};

// ── Constants ──────────────────────────────────────────────────────────────────

const DOC_TYPE_LABEL: Record<string, string> = {
  order_confirmation: "Order Confirmation",
  proforma_invoice:   "Proforma Invoice",
  commercial_invoice: "Commercial Invoice",
  packing_list:       "Packing List",
  delivery_note:      "Delivery Note",
  shipment_document:  "Shipment Document",
  other:              "Document",
};

const STATUS_LABEL: Record<string, string> = {
  issued:     "Issued",
  sent:       "Sent",
  superseded: "Superseded",
  void:       "Void",
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function longDate(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit", month: "long", year: "numeric",
    }).format(new Date(iso));
  } catch { return iso; }
}

async function fetchVerification(number: string): Promise<VerifyResult | null> {
  try {
    const res = await fetch(
      `${API_URL}/documents/verify/${encodeURIComponent(number)}`,
      { cache: "no-store" },
    );
    if (!res.ok) return null;
    const json = await res.json();
    return (json.data ?? json) as VerifyResult;
  } catch {
    return null;
  }
}

// ── Metadata ───────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ number: string }>;
}): Promise<Metadata> {
  const { number } = await params;
  return {
    title: `Verify Document ${number}`,
    description: `Verify the authenticity of Okelcor document ${number}.`,
    robots: { index: false, follow: false },
  };
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function InfoRow({
  label,
  value,
  mono = false,
  badge,
}: {
  label: string;
  value: string;
  mono?: boolean;
  badge?: "green" | "amber" | "gray";
}) {
  return (
    <div className="flex flex-col gap-1 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <span className="shrink-0 text-[0.72rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">
        {label}
      </span>
      {badge ? (
        <span className={`inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-[0.75rem] font-bold capitalize ${
          badge === "green"  ? "bg-emerald-100 text-emerald-700" :
          badge === "amber"  ? "bg-amber-100 text-amber-700"     :
                               "bg-gray-100 text-gray-600"
        }`}>
          {value}
        </span>
      ) : (
        <span className={`text-[0.9rem] font-semibold text-[#1a1a1a] ${mono ? "font-mono" : ""}`}>
          {value}
        </span>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default async function DocumentVerifyPage({
  params,
}: {
  params: Promise<{ number: string }>;
}) {
  const { number } = await params;
  const result = await fetchVerification(number);

  const isValid      = result?.valid === true;
  const isSuperseded = result?.status === "superseded" || result?.status === "void";
  const fetchFailed  = result === null;

  const statusBadge = (status: string): "green" | "amber" | "gray" => {
    if (status === "issued" || status === "sent") return "green";
    if (status === "superseded" || status === "void") return "amber";
    return "gray";
  };

  return (
    <main>
      <Navbar />

      <section className="min-h-[calc(100vh-80px)] w-full bg-[#f5f5f5] py-16 md:py-24">
        <div className="mx-auto max-w-lg px-4">

          {/* Brand header */}
          <div className="mb-8 text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#E85C1A]/10">
                <ShieldCheck size={26} className="text-[#E85C1A]" strokeWidth={1.8} />
              </div>
            </div>
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[#E85C1A]">
              {COMPANY_LEGAL_NAME}
            </p>
            <h1 className="mt-1.5 text-[1.6rem] font-extrabold tracking-tight text-[#171a20] sm:text-[1.85rem]">
              Document Verification
            </h1>
            <p className="mt-2 text-[0.875rem] text-[#5c5e62]">
              Confirm the authenticity of an Okelcor trade document
            </p>
          </div>

          {/* Result card */}
          <div className="overflow-hidden rounded-[22px] bg-white shadow-[0_4px_32px_rgba(0,0,0,0.08)]">

            {/* ── Status banner ── */}
            {fetchFailed ? (
              <div className="flex items-start gap-3.5 border-b border-black/[0.06] bg-gray-50 px-6 py-5">
                <AlertTriangle size={20} className="mt-0.5 shrink-0 text-gray-400" />
                <div>
                  <p className="text-[0.9rem] font-bold text-[#1a1a1a]">Verification unavailable</p>
                  <p className="mt-0.5 text-[0.8rem] text-[#5c5e62]">
                    The verification service could not be reached. Please try again shortly or contact Okelcor directly.
                  </p>
                </div>
              </div>
            ) : isValid ? (
              <div className="flex items-start gap-3.5 border-b border-black/[0.06] bg-emerald-50 px-6 py-5">
                <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-emerald-600" />
                <div>
                  <p className="text-[0.9rem] font-bold text-emerald-800">Valid Document</p>
                  <p className="mt-0.5 text-[0.8rem] text-emerald-700">
                    This document is authentic and was issued by {result.company}.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3.5 border-b border-black/[0.06] bg-amber-50 px-6 py-5">
                <AlertTriangle size={20} className="mt-0.5 shrink-0 text-amber-600" />
                <div>
                  <p className="text-[0.9rem] font-bold text-amber-800">
                    {isSuperseded ? "Document Superseded" : "Document Invalid"}
                  </p>
                  <p className="mt-0.5 text-[0.8rem] text-amber-700">
                    {result?.message ?? (
                      isSuperseded
                        ? "This document has been superseded. Please request the latest version from Okelcor."
                        : "This document could not be verified. Contact Okelcor if you believe this is an error."
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* ── Document details ── */}
            {result !== null && (
              <div className="divide-y divide-black/[0.05] px-6">
                <InfoRow
                  label="Document Number"
                  value={result.document_number}
                  mono
                />
                <InfoRow
                  label="Document Type"
                  value={DOC_TYPE_LABEL[result.document_type] ?? result.document_type}
                />
                <InfoRow
                  label="Order Reference"
                  value={result.order_reference}
                  mono
                />
                <InfoRow
                  label="Issued On"
                  value={longDate(result.issued_at)}
                />
                <InfoRow
                  label="Status"
                  value={STATUS_LABEL[result.status] ?? result.status}
                  badge={statusBadge(result.status)}
                />
                <InfoRow
                  label="Issued By"
                  value={result.company}
                />
              </div>
            )}

            {/* ── Support block — shown on failure or invalid/superseded ── */}
            {(fetchFailed || !isValid) && (
              <div className="border-t border-black/[0.06] bg-[#fafafa] px-6 py-5">
                <p className="mb-3 text-[0.68rem] font-bold uppercase tracking-[0.15em] text-[#5c5e62]">
                  Need help?
                </p>
                <div className="flex flex-col gap-2.5">
                  <a
                    href={`mailto:${COMPANY_EMAIL}`}
                    className="inline-flex items-center gap-2 text-[0.875rem] font-semibold text-[#E85C1A] hover:underline"
                  >
                    <Mail size={14} strokeWidth={2} />
                    {COMPANY_EMAIL}
                  </a>
                  <a
                    href={`tel:${COMPANY_PHONE.replace(/[\s/]/g, "")}`}
                    className="inline-flex items-center gap-2 text-[0.875rem] text-[#5c5e62] transition hover:text-[#1a1a1a]"
                  >
                    <Phone size={14} strokeWidth={2} />
                    {COMPANY_PHONE}
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Document number footnote */}
          <p className="mt-5 text-center font-mono text-[0.7rem] text-[#9ca3af]">
            Document · {number}
          </p>

        </div>
      </section>

      <Footer />
    </main>
  );
}
