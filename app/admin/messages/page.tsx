import type { Metadata } from "next";
import StaffMessagesInbox from "@/components/admin/staff-messages-inbox";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Messages" };

export default function StaffMessagesPage() {
  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <p className="text-[0.75rem] font-bold uppercase tracking-[0.18em] text-[#f4511e]">
          Messages
        </p>
        <p className="mt-0.5 text-[0.875rem] text-[#5c5e62]">
          Write to a colleague without leaving the panel. Everything you send also
          reaches their Okelcor mailbox, so they see it whether or not they&apos;re logged in.
        </p>
      </div>

      <StaffMessagesInbox />
    </div>
  );
}
