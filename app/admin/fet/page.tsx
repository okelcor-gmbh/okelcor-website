import { redirect } from "next/navigation";
import type { Metadata } from "next";
import {
  adminApiFetch,
  adminSafeFetch,
  AdminUnauthorizedError,
  type AdminFetEngine,
} from "@/lib/admin-api";
import FetManager from "@/components/admin/fet-manager";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "FET Engine Models" };

export default async function AdminFetPage() {
  try {
    await adminApiFetch<AdminFetEngine[]>("/fet/engines", {
      params: { per_page: 1 },
      revalidate: false,
    });
  } catch (e) {
    if (e instanceof AdminUnauthorizedError) redirect("/admin/login");
  }

  const res = await adminSafeFetch<AdminFetEngine[]>("/fet/engines", {
    params: { per_page: 200 },
    revalidate: false,
  });

  const engines: AdminFetEngine[] = Array.isArray(res?.data) ? res.data : [];
  const total = res?.meta?.total ?? engines.length;

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <p className="text-[0.75rem] font-bold uppercase tracking-[0.18em] text-[#f4511e]">
          Fuel Echo Tech
        </p>
        <p className="mt-0.5 text-[0.875rem] text-[#5c5e62]">
          Manage engine compatibility data — used in the FET tab on the shop page and the /fet page engine lookup.
        </p>
      </div>

      <FetManager engines={engines} total={Number(total)} />
    </div>
  );
}
