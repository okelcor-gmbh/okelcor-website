import { redirect } from "next/navigation";
import type { Metadata } from "next";
import {
  adminApiFetch,
  adminSafeFetch,
  AdminUnauthorizedError,
  type AdminPromotion,
} from "@/lib/admin-api";
import PromotionsManager from "@/components/admin/promotions-manager";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Promotions" };

export default async function AdminPromotionsPage() {
  try {
    await adminApiFetch<AdminPromotion[]>("/promotions", {
      params: { per_page: 1 },
      revalidate: false,
    });
  } catch (e) {
    if (e instanceof AdminUnauthorizedError) redirect("/admin/login");
  }

  const res = await adminSafeFetch<AdminPromotion[]>("/promotions", {
    revalidate: false,
  });

  const promotions: AdminPromotion[] = Array.isArray(res?.data) ? res.data : [];

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <p className="text-[0.75rem] font-bold uppercase tracking-[0.18em] text-[#f4511e]">
          Promotions
        </p>
        <p className="mt-0.5 text-[0.875rem] text-[#5c5e62]">
          {promotions.length > 0
            ? `${promotions.length} promotion${promotions.length !== 1 ? "s" : ""} — only one can be active on the shop page at a time`
            : "Create a promotional banner to display on the shop page below the tyre selector"}
        </p>
      </div>

      <PromotionsManager promotions={promotions} />
    </div>
  );
}
