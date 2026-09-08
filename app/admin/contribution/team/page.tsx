import type { Metadata } from "next";
import StaffTeamReport from "@/components/admin/staff-team-report";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Team Contribution" };

export default function TeamContributionPage() {
  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <p className="text-[0.75rem] font-bold uppercase tracking-[0.18em] text-[#f4511e]">
          Team Contribution
        </p>
        <p className="mt-0.5 max-w-2xl text-[0.875rem] leading-relaxed text-[#5c5e62]">
          What everyone worked on over the period, ordered alphabetically. Nobody is scored
          or ranked here — the same report is e-mailed monthly to whoever is listed to
          receive it.
        </p>
      </div>

      <StaffTeamReport />
    </div>
  );
}
