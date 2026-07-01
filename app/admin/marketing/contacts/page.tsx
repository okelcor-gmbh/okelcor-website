import type { Metadata } from "next";
import MarketingContactsPanel from "@/components/admin/marketing-contacts-panel";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Marketing Contacts" };

export default function MarketingContactsPage() {
  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <p className="text-[0.75rem] font-bold uppercase tracking-[0.18em] text-[#E85C1A]">
          Marketing
        </p>
        <h1 className="mt-0.5 text-[1.25rem] font-extrabold text-[#171a20]">Contacts</h1>
        <p className="mt-1 text-[0.875rem] text-[#5c5e62]">
          Import and manage your marketing contact list. Unsubscribed contacts are automatically excluded from all campaigns.
        </p>
      </div>

      <MarketingContactsPanel />
    </div>
  );
}
