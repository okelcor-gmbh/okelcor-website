import type { Metadata } from "next";
import StaffLedger from "@/components/admin/staff-ledger";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My Contribution" };

type SearchParams = Promise<{ admin_user_id?: string }>;

export default async function ContributionPage({ searchParams }: { searchParams: SearchParams }) {
  const { admin_user_id: adminUserId } = await searchParams;
  const initial = adminUserId && /^\d+$/.test(adminUserId) ? Number(adminUserId) : undefined;

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <p className="text-[0.75rem] font-bold uppercase tracking-[0.18em] text-[#f4511e]">
          My Contribution
        </p>
        <p className="mt-0.5 max-w-2xl text-[0.875rem] leading-relaxed text-[#5c5e62]">
          What you have worked on, drawn from the records the system already keeps — plus a
          place to enter the work it cannot see. Nothing here measures hours or presence.
        </p>
      </div>

      <StaffLedger initialAdminUserId={initial} />
    </div>
  );
}
