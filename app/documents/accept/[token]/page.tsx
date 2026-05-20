import type { Metadata } from "next";
import { AlertTriangle, CheckCircle2, Clock, ExternalLink, Mail, Phone, ShieldCheck, XCircle } from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import TokenAcceptanceActions from "@/components/documents/token-acceptance-actions";
import { COMPANY_EMAIL, COMPANY_LEGAL_NAME, COMPANY_PHONE } from "@/lib/constants";

export const dynamic = "force-dynamic";

const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000/api/v1";

// ── Types ──────────────────────────────────────────────────────────────────────

type AcceptanceInfo = {
  document_type: string;
  order_reference: string;
  issued_at?: string | null;
  expires_at?: string | null;
  already_accepted?: boolean;
  already_rejected?: boolean;
  document_url?: string | null;
  message?: string | null;
};

// ── Constants ──────────────────────────────────────────────────────────────────

const DOC_TYPE_LABEL: Record<string, string> = {
  order_confirmation: "Order Confirmation",
  proforma_invoice:   "Proforma Invoice",
  commercial_invoice: "Commercial Invoice",
  proposal:           "Commercial Proposal",
  other:              "Document",
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

async function fetchAcceptanceInfo(token: string): Promise<AcceptanceInfo | null> {
  try {
    const res = await fetch(
      `${API_URL}/documents/acceptance/${encodeURIComponent(token)}`,
      { cache: "no-store" },
    );
    if (!res.ok) return null;
    const json = await res.json();
    return (json.data ?? json) as AcceptanceInfo;
  } catch {
    return null;
  }
}

// ── Metadata ───────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  return {
    title: "Document Acceptance — Okelcor",
    description: "Review and accept or decline an Okelcor document.",
    robots: { index: false, follow: false },
  };
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default async function DocumentAcceptPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const info = await fetchAcceptanceInfo(token);

  const fetchFailed      = info === null;
  const alreadyAccepted  = info?.already_accepted === true;
  const alreadyRejected  = info?.already_rejected === true;
  const isPending        = !fetchFailed && !alreadyAccepted && !alreadyRejected;
  const docTypeLabel     = info ? (DOC_TYPE_LABEL[info.document_type] ?? info.document_type) : "Document";

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
              Document Acceptance
            </h1>
            <p className="mt-2 text-[0.875rem] text-[#5c5e62]">
              Review and confirm or decline the document below
            </p>
          </div>

          {/* Card */}
          <div className="overflow-hidden rounded-[22px] bg-white shadow-[0_4px_32px_rgba(0,0,0,0.08)]">

            {/* ── Status banner ── */}
            {fetchFailed && (
              <div className="flex items-start gap-3.5 border-b border-black/[0.06] bg-gray-50 px-6 py-5">
                <AlertTriangle size={20} className="mt-0.5 shrink-0 text-gray-400" />
                <div>
                  <p className="text-[0.9rem] font-bold text-[#1a1a1a]">Link invalid or expired</p>
                  <p className="mt-0.5 text-[0.8rem] text-[#5c5e62]">
                    This acceptance link could not be found or has expired. Please contact Okelcor for assistance.
                  </p>
                </div>
              </div>
            )}

            {alreadyAccepted && (
              <div className="flex items-start gap-3.5 border-b border-black/[0.06] bg-emerald-50 px-6 py-5">
                <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-emerald-600" />
                <div>
                  <p className="text-[0.9rem] font-bold text-emerald-800">Already accepted</p>
                  <p className="mt-0.5 text-[0.8rem] text-emerald-700">
                    This document has already been accepted. No further action is required.
                  </p>
                </div>
              </div>
            )}

            {alreadyRejected && (
              <div className="flex items-start gap-3.5 border-b border-black/[0.06] bg-gray-100 px-6 py-5">
                <XCircle size={20} className="mt-0.5 shrink-0 text-gray-500" />
                <div>
                  <p className="text-[0.9rem] font-bold text-gray-700">Already declined</p>
                  <p className="mt-0.5 text-[0.8rem] text-gray-600">
                    This document was previously declined. Please contact Okelcor if you need to proceed.
                  </p>
                </div>
              </div>
            )}

            {isPending && (
              <div className="flex items-start gap-3.5 border-b border-black/[0.06] bg-blue-50 px-6 py-5">
                <Clock size={20} className="mt-0.5 shrink-0 text-blue-500" />
                <div>
                  <p className="text-[0.9rem] font-bold text-blue-800">Awaiting your response</p>
                  <p className="mt-0.5 text-[0.8rem] text-blue-700">
                    Please review the details below and accept or decline this document.
                  </p>
                </div>
              </div>
            )}

            {/* ── Document details ── */}
            {info !== null && (
              <div className="divide-y divide-black/[0.05] px-6">
                <div className="flex flex-col gap-1 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <span className="shrink-0 text-[0.72rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">Document Type</span>
                  <span className="text-[0.9rem] font-semibold text-[#1a1a1a]">{docTypeLabel}</span>
                </div>
                <div className="flex flex-col gap-1 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <span className="shrink-0 text-[0.72rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">Order Reference</span>
                  <span className="font-mono text-[0.9rem] font-semibold text-[#1a1a1a]">{info.order_reference}</span>
                </div>
                {info.issued_at && (
                  <div className="flex flex-col gap-1 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <span className="shrink-0 text-[0.72rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">Issued On</span>
                    <span className="text-[0.9rem] font-semibold text-[#1a1a1a]">{longDate(info.issued_at)}</span>
                  </div>
                )}
                {info.expires_at && (
                  <div className="flex flex-col gap-1 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <span className="shrink-0 text-[0.72rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">Respond By</span>
                    <span className="text-[0.9rem] font-semibold text-[#1a1a1a]">{longDate(info.expires_at)}</span>
                  </div>
                )}
              </div>
            )}

            {/* ── View document ── */}
            {info?.document_url && (
              <div className="border-t border-black/[0.05] px-6 py-4">
                <a
                  href={info.document_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[0.875rem] font-semibold text-[#E85C1A] transition hover:text-[#d04d15] hover:underline"
                >
                  <ExternalLink size={14} strokeWidth={2} />
                  View Document
                </a>
              </div>
            )}

            {/* ── Accept / Reject actions (pending only) ── */}
            {isPending && (
              <div className="border-t border-black/[0.06] px-6 py-5">
                <TokenAcceptanceActions token={token} />
              </div>
            )}

            {/* ── Support block ── */}
            {(fetchFailed || alreadyRejected) && (
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

        </div>
      </section>

      <Footer />
    </main>
  );
}
