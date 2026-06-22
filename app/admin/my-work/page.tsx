import type { Metadata } from "next";
import MyWork from "@/components/admin/my-work";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My Work" };

export default function MyWorkPage() {
  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <p className="text-[0.75rem] font-bold uppercase tracking-[0.18em] text-[#E85C1A]">
          My Work
        </p>
        <p className="mt-0.5 text-[0.875rem] text-[#5c5e62]">
          Everything assigned to you that needs action — leads, follow-ups, proposals and approvals.
        </p>
      </div>

      <MyWork />
    </div>
  );
}
