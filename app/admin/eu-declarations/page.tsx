import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  AdminUnauthorizedError,
  AdminForbiddenError,
  adminApiFetch,
} from "@/lib/admin-api";

export const metadata: Metadata = {
  title: "EU Entry Certificates — Admin",
};

// ── Types ─────────────────────────────────────────────────────────────────────

type EuDeclaration = {
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
  created_at: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  pending:      "bg-amber-100 text-amber-700",
  signed:       "bg-blue-100 text-blue-700",
  acknowledged: "bg-emerald-100 text-emerald-700",
};

function shortDate(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
    }).format(new Date(iso));
  } catch { return iso; }
}

// ── Data fetching ─────────────────────────────────────────────────────────────

async function fetchDeclarations(): Promise<EuDeclaration[]> {
  try {
    const res = await adminApiFetch<EuDeclaration[]>("/eu-declarations", {
      revalidate: false,
    });
    return Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    if (err instanceof AdminUnauthorizedError) throw err;
    if (err instanceof AdminForbiddenError) throw err;
    console.error("[eu-declarations] fetch error:", err);
    return [];
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function EuDeclarationsPage() {
  let declarations: EuDeclaration[] = [];
  try {
    declarations = await fetchDeclarations();
  } catch (err) {
    if (err instanceof AdminUnauthorizedError) redirect("/admin/login");
    if (err instanceof AdminForbiddenError) redirect("/admin/unauthorized");
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-[#E85C1A]">
            Compliance
          </p>
          <h1 className="text-[1.35rem] font-extrabold tracking-tight text-[#1a1a1a]">
            EU Entry Certificates
          </h1>
          <p className="mt-0.5 text-[0.83rem] text-[#5c5e62]">
            Gelangensbestätigung — §17a UStDV intra-community B2B declarations
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">

        {declarations.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-[0.875rem] text-[#5c5e62]">No EU declarations found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left">
              <thead>
                <tr className="border-b border-black/[0.06] bg-[#fafafa]">
                  {["Order Ref", "Customer / Company", "Email", "Country", "VAT Number", "Status", "Signed", "Created", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-[0.7rem] font-bold uppercase tracking-[0.12em] text-[#5c5e62]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04]">
                {declarations.map((dec) => (
                  <tr key={dec.id} className="hover:bg-[#fafafa]">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/orders/${dec.order_ref}`}
                        className="font-mono text-[0.83rem] font-semibold text-[#E85C1A] hover:underline"
                      >
                        {dec.order_ref}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[0.875rem] font-semibold text-[#1a1a1a]">
                        {dec.customer_name}
                      </p>
                      {dec.company_name && (
                        <p className="text-[0.75rem] text-[#5c5e62]">{dec.company_name}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[0.83rem] text-[#5c5e62]">
                      {dec.email ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-[0.875rem] text-[#1a1a1a]">
                      {dec.country ?? "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-[0.8rem] text-[#5c5e62]">
                      {dec.vat_number ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.72rem] font-bold capitalize ${STATUS_STYLES[dec.status] ?? "bg-gray-100 text-gray-500"}`}>
                        {dec.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[0.83rem] text-[#5c5e62]">
                      {shortDate(dec.signed_at)}
                    </td>
                    <td className="px-4 py-3 text-[0.83rem] text-[#5c5e62]">
                      {shortDate(dec.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/eu-declarations/${dec.id}`}
                        className="inline-flex h-7 items-center rounded-full border border-black/[0.09] bg-white px-3 text-[0.75rem] font-semibold text-[#1a1a1a] transition hover:border-[#E85C1A]/40 hover:text-[#E85C1A]"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
