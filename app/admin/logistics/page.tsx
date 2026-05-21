import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import { AdminUnauthorizedError, AdminForbiddenError } from "@/lib/admin-api";
import LogisticsDashboard from "@/components/admin/logistics-dashboard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Logistics — Admin" };

export default async function LogisticsPage() {
  let adminRole: string;

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token")?.value;
    if (!token) throw new AdminUnauthorizedError();
    adminRole = cookieStore.get("admin_role")?.value ?? "";
  } catch (err) {
    if (err instanceof AdminUnauthorizedError) redirect("/admin/login");
    if (err instanceof AdminForbiddenError) redirect("/admin/unauthorized");
    redirect("/admin/login");
  }

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <div>
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-[#E85C1A]">
          Operations
        </p>
        <h1 className="text-[1.35rem] font-extrabold tracking-tight text-[#1a1a1a]">
          Logistics Dashboard
        </h1>
        <p className="mt-0.5 text-[0.83rem] text-[#5c5e62]">
          Unified operations view — website and eBay orders requiring logistics action
        </p>
      </div>

      <LogisticsDashboard adminRole={adminRole} />
    </div>
  );
}
