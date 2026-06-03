import type { Metadata } from "next";
import {
  AlertTriangle, CheckCircle2, Clock, ExternalLink,
  Mail, Phone, ShieldCheck, XCircle,
} from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import ProposalAcceptanceActions from "@/components/proposals/proposal-acceptance-actions";
import { COMPANY_EMAIL, COMPANY_LEGAL_NAME, COMPANY_PHONE } from "@/lib/constants";

export const dynamic = "force-dynamic";

const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000/api/v1";

// ── Types ──────────────────────────────────────────────────────────────────────

type ProposalInfo = {
  proposal_number?: string | null;
  quote_ref?: string | null;
  company_name?: string | null;
  full_name?: string | null;
  proposal_total?: number | null;
  proposal_currency?: string | null;
  proposal_expires_at?: string | null;
  proposal_sent_at?: string | null;
  status?: string | null;
  already_accepted?: boolean;
  already_rejected?: boolean;
  already_expired?: boolean;
  message?: string | null;
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

function fmtCurrency(amount?: number | null, currency?: string | null): string {
  if (amount == null) return "—";
  try {
    return new Intl.NumberFormat("en-DE", {
      style: "currency",
      currency: currency ?? "EUR",
      minimumFractionDigits: 2,
    }).format(amount);
  } catch { return `${amount}`; }
}

function isExpired(expiresAt?: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}

async function fetchProposalInfo(token: string): Promise<ProposalInfo | null> {
  try {
    const res = await fetch(
      `${API_URL}/proposals/${encodeURIComponent(token)}`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    const json = await res.json();
    return (json.data ?? json) as ProposalInfo;
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
  await params;
  return {
    title: "Proposal Acceptance — Okelcor",
    description: "Review and accept or decline a commercial proposal from Okelcor.",
    robots: { index: false, follow: false },
  };
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default async function ProposalAcceptPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const info = await fetchProposalInfo(token);

  const fetchFailed     = info === null;
  const alreadyAccepted = info?.already_accepted === true || info?.status === "accepted";
  const alreadyRejected = info?.already_rejected === true || info?.status === "rejected";
  const alreadyExpired  = info?.already_expired  === true || info?.status === "expired"
    || isExpired(info?.proposal_expires_at);
  const isPending = !fetchFailed && !alreadyAccepted && !alreadyRejected && !alreadyExpired;

  const recipientName = info?.company_name ?? info?.full_name ?? "Valued Customer";

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
              Commercial Proposal
            </h1>
            <p className="mt-2 text-[0.875rem] text-[#5c5e62]">
              Review and accept or decline the proposal below
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
                    This proposal link could not be found or has expired. Please contact Okelcor for a new link.
                  </p>
                </div>
              </div>
            )}

            {alreadyAccepted && (
              <div className="flex items-start gap-3.5 border-b border-black/[0.06] bg-emerald-50 px-6 py-5">
                <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-emerald-600" />
                <div>
                  <p className="text-[0.9rem] font-bold text-emerald-800">Proposal Accepted</p>
                  <p className="mt-0.5 text-[0.8rem] text-emerald-700">
                    You have already accepted this proposal. Our team will be in touch shortly to progress your order.
                  </p>
                </div>
              </div>
            )}

            {alreadyRejected && (
              <div className="flex items-start gap-3.5 border-b border-black/[0.06] bg-gray-100 px-6 py-5">
                <XCircle size={20} className="mt-0.5 shrink-0 text-gray-500" />
                <div>
                  <p className="text-[0.9rem] font-bold text-gray-700">Proposal Declined</p>
                  <p className="mt-0.5 text-[0.8rem] text-gray-600">
                    This proposal was previously declined. Please contact Okelcor if you&apos;d like to discuss further.
                  </p>
                </div>
              </div>
            )}

            {alreadyExpired && !alreadyAccepted && !alreadyRejected && (
              <div className="flex items-start gap-3.5 border-b border-black/[0.06] bg-amber-50 px-6 py-5">
                <Clock size={20} className="mt-0.5 shrink-0 text-amber-500" />
                <div>
                  <p className="text-[0.9rem] font-bold text-amber-800">Proposal Expired</p>
                  <p className="mt-0.5 text-[0.8rem] text-amber-700">
                    This proposal has passed its response deadline. Please contact Okelcor to request a new proposal.
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
                    Please review the proposal details below and accept or decline.
                  </p>
                </div>
              </div>
            )}

            {/* ── Proposal details ── */}
            {info !== null && (
              <div className="divide-y divide-black/[0.05] px-6">
                {recipientName && (
                  <div className="flex flex-col gap-1 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <span className="shrink-0 text-[0.72rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">Prepared For</span>
                    <span className="text-[0.9rem] font-semibold text-[#1a1a1a]">{recipientName}</span>
                  </div>
                )}
                {info.proposal_number && (
                  <div className="flex flex-col gap-1 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <span className="shrink-0 text-[0.72rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">Proposal Number</span>
                    <span className="font-mono text-[0.9rem] font-semibold text-[#1a1a1a]">{info.proposal_number}</span>
                  </div>
                )}
                {info.quote_ref && (
                  <div className="flex flex-col gap-1 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <span className="shrink-0 text-[0.72rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">Quote Reference</span>
                    <span className="font-mono text-[0.9rem] font-semibold text-[#1a1a1a]">{info.quote_ref}</span>
                  </div>
                )}
                {info.proposal_total != null && (
                  <div className="flex flex-col gap-1 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <span className="shrink-0 text-[0.72rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">Proposal Total</span>
                    <span className="text-[1rem] font-extrabold text-[#1a1a1a]">
                      {fmtCurrency(info.proposal_total, info.proposal_currency)}
                    </span>
                  </div>
                )}
                {info.proposal_expires_at && (
                  <div className="flex flex-col gap-1 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <span className="shrink-0 text-[0.72rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">Respond By</span>
                    <span className={`text-[0.9rem] font-semibold ${alreadyExpired ? "text-red-700" : "text-[#1a1a1a]"}`}>
                      {longDate(info.proposal_expires_at)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* ── View proposal document link (if backend provides one) ── */}
            {typeof (info as Record<string, unknown> | null)?.document_url === "string" && (
              <div className="border-t border-black/[0.05] px-6 py-4">
                <a
                  href={(info as Record<string, unknown>).document_url as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[0.875rem] font-semibold text-[#E85C1A] transition hover:text-[#d04d15] hover:underline"
                >
                  <ExternalLink size={14} strokeWidth={2} />
                  View Proposal Document
                </a>
              </div>
            )}

            {/* ── Accept / Decline actions ── */}
            {isPending && (
              <div className="border-t border-black/[0.06] px-6 py-5">
                <ProposalAcceptanceActions token={token} />
              </div>
            )}

            {/* ── Support block ── */}
            {(fetchFailed || alreadyRejected || alreadyExpired) && (
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
