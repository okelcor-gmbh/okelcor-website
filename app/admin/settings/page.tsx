import { redirect } from "next/navigation";
import type { Metadata } from "next";
import {
  adminApiFetch,
  adminSafeFetch,
  AdminUnauthorizedError,
  type AdminSetting,
} from "@/lib/admin-api";
import SettingsPanel from "@/components/admin/settings-panel";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  // Auth check
  try {
    await adminApiFetch<AdminSetting[]>("/settings", {
      revalidate: false,
    });
  } catch (e) {
    if (e instanceof AdminUnauthorizedError) redirect("/admin/login");
  }

  const res = await adminSafeFetch<AdminSetting[]>("/settings", {
    revalidate: false,
  });

  // Normalise: backend may return an array or a key→value map object
  let settings: AdminSetting[] = [];
  if (Array.isArray(res?.data)) {
    settings = res.data;
  } else if (res?.data && typeof res.data === "object") {
    settings = Object.entries(res.data as Record<string, string>).map(
      ([key, value]) => ({ key, value })
    );
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <p className="text-[0.75rem] font-bold uppercase tracking-[0.18em] text-[#f4511e]">
          Settings
        </p>
        <p className="mt-0.5 text-[0.875rem] text-[#5c5e62]">
          Manage site-wide configuration and company information.
        </p>
      </div>

      <SettingsPanel settings={settings} />
    </div>
  );
}
