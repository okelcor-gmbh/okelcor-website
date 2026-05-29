import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { adminApiFetch, AdminUnauthorizedError } from "@/lib/admin-api";
import FollowUpsTable from "@/components/admin/follow-ups-table";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "CRM Follow-ups" };

export default async function FollowUpsPage() {
  try {
    await adminApiFetch("/quote-requests?per_page=1", { revalidate: false });
  } catch (e) {
    if (e instanceof AdminUnauthorizedError) redirect("/admin/login");
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <p className="text-[0.75rem] font-bold uppercase tracking-[0.18em] text-[#E85C1A]">
          CRM Follow-ups
        </p>
        <p className="mt-0.5 text-[0.875rem] text-[#5c5e62]">
          Track overdue and upcoming follow-ups across all active leads.
        </p>
      </div>

      <FollowUpsTable />
    </div>
  );
}
