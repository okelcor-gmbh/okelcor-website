import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import { AdminUnauthorizedError, AdminForbiddenError } from "@/lib/admin-api";
import { canAccess } from "@/lib/admin-permissions";
import FleetDashboard from "@/components/admin/tracking/fleet-dashboard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Fleet Tracking — Admin" };

export default async function TrackingPage() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token")?.value;
    if (!token) throw new AdminUnauthorizedError();
    const adminRole = cookieStore.get("admin_role")?.value ?? "";
    if (!canAccess(adminRole, "tracking")) throw new AdminForbiddenError();
  } catch (err) {
    if (err instanceof AdminForbiddenError) redirect("/admin/unauthorized");
    if (err instanceof AdminUnauthorizedError) redirect("/admin/login");
    redirect("/admin/login");
  }

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <div>
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-[#E85C1A]">
          Operations
        </p>
        <h1 className="text-[1.35rem] font-extrabold tracking-tight text-[#1a1a1a]">
          Fleet Tracking
        </h1>
        <p className="mt-0.5 text-[0.83rem] text-[#5c5e62]">
          Live GPS positions, routes and trips for your delivery fleet
        </p>
      </div>

      <FleetDashboard />
    </div>
  );
}
