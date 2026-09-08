import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import ChatsInbox from "@/components/admin/chats-inbox";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Live Chats" };

export default async function AdminChatsPage() {
  const cookieStore = await cookies();
  if (!cookieStore.get("admin_token")?.value) redirect("/admin/login");

  const crispConfigured = !!(
    process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID &&
    process.env.CRISP_IDENTIFIER &&
    process.env.CRISP_KEY
  );

  return (
    <div className="flex h-full flex-col">
      {!crispConfigured && (
        <div className="m-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-[0.875rem] text-amber-800">
          <strong>Crisp API not configured.</strong> Add{" "}
          <code className="rounded bg-amber-100 px-1">CRISP_IDENTIFIER</code> and{" "}
          <code className="rounded bg-amber-100 px-1">CRISP_KEY</code> to your{" "}
          <code className="rounded bg-amber-100 px-1">.env.local</code> file.
          Get them from Crisp Dashboard → Settings → Integrations → API.
        </div>
      )}
      <ChatsInbox />
    </div>
  );
}
