import { redirect } from "next/navigation";
import type { Metadata } from "next";
import {
  AdminUnauthorizedError,
  AdminForbiddenError,
  adminApiFetch,
} from "@/lib/admin-api";
import EuDeclarationsTable, { type EuDeclaration } from "@/components/admin/eu-declarations-table";

export const metadata: Metadata = {
  title: "EU Entry Certificates — Admin",
};

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

      {/* Client table: summary tabs + filters + rows */}
      <EuDeclarationsTable declarations={declarations} />

    </div>
  );
}
