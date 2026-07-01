import type { Metadata } from "next";
import BulkEmailPanel from "@/components/admin/bulk-email-panel";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Email Campaigns" };

export default function MarketingCampaignsPage() {
  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <p className="text-[0.75rem] font-bold uppercase tracking-[0.18em] text-[#E85C1A]">
          Marketing
        </p>
        <h1 className="mt-0.5 text-[1.25rem] font-extrabold text-[#171a20]">Email Campaigns</h1>
        <p className="mt-1 text-[0.875rem] text-[#5c5e62]">
          Compose and send bulk emails to your contact list. Use audience filters to target specific segments.
        </p>
      </div>

      <BulkEmailPanel />
    </div>
  );
}
