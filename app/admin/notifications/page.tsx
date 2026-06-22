import type { Metadata } from "next";
import NotificationsCenter from "@/components/admin/notifications-center";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Notifications" };

export default function NotificationsPage() {
  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <p className="text-[0.75rem] font-bold uppercase tracking-[0.18em] text-[#E85C1A]">
          Notifications
        </p>
        <p className="mt-0.5 text-[0.875rem] text-[#5c5e62]">
          Every alert raised for your account — assignments, follow-ups, approvals and more.
        </p>
      </div>

      <NotificationsCenter />
    </div>
  );
}
