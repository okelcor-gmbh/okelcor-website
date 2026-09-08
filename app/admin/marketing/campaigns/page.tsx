import type { Metadata } from "next";
import BulkEmailPanel from "@/components/admin/bulk-email-panel";
import { adminApiFetch, type AdminProfile } from "@/lib/admin-api";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Email Campaigns" };

/**
 * The test-send box defaults to the logged-in admin's own address — "send it
 * to myself and look at it" should be one click, not a retyped email.
 * Best-effort: an unavailable profile endpoint just leaves the field blank.
 */
async function getAdminEmail(): Promise<string> {
  try {
    const res = await adminApiFetch<AdminProfile>("/profile", { revalidate: false });
    return res.data.email ?? "";
  } catch {
    return "";
  }
}

export default async function MarketingCampaignsPage() {
  const adminEmail = await getAdminEmail();
  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <p className="text-[0.75rem] font-bold uppercase tracking-[0.18em] text-[#f4511e]">
          Marketing
        </p>
        <h1 className="mt-0.5 text-[1.25rem] font-extrabold text-[#171a20]">Email Campaigns</h1>
        <p className="mt-1 text-[0.875rem] text-[#5c5e62]">
          Design an email from blocks — no HTML needed — then choose who receives it. Always send
          yourself a test first.
        </p>
      </div>

      <BulkEmailPanel adminEmail={adminEmail} />
    </div>
  );
}
