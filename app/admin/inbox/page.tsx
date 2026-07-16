import type { Metadata } from "next";
import CommunicationsInbox from "@/components/admin/communications-inbox";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Inbox" };

export default function InboxPage() {
  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <p className="text-[0.75rem] font-bold uppercase tracking-[0.18em] text-[#E85C1A]">
          Inbox
        </p>
        <p className="mt-0.5 text-[0.875rem] text-[#5c5e62]">
          Every new customer reply across e-mail and WhatsApp, in one place — no need to open each profile to check.
        </p>
      </div>

      <CommunicationsInbox />
    </div>
  );
}
