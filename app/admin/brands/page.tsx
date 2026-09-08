import { redirect } from "next/navigation";
import type { Metadata } from "next";
import {
  adminApiFetch,
  adminSafeFetch,
  AdminUnauthorizedError,
  type AdminBrand,
} from "@/lib/admin-api";
import BrandsManager from "@/components/admin/brands-manager";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Brands" };

export default async function AdminBrandsPage() {
  try {
    await adminApiFetch<AdminBrand[]>("/brands", {
      params: { per_page: 1 },
      revalidate: false,
    });
  } catch (e) {
    if (e instanceof AdminUnauthorizedError) redirect("/admin/login");
  }

  const res = await adminSafeFetch<AdminBrand[]>("/brands", {
    revalidate: false,
  });

  const brands: AdminBrand[] = Array.isArray(res?.data) ? res.data : [];

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <p className="text-[0.75rem] font-bold uppercase tracking-[0.18em] text-[#f4511e]">
          Brands
        </p>
        <p className="mt-0.5 text-[0.875rem] text-[#5c5e62]">
          {brands.length > 0
            ? `${brands.length} brand${brands.length !== 1 ? "s" : ""} — logos shown on the homepage`
            : "Add brands to display their logos on the homepage"}
        </p>
      </div>

      <BrandsManager brands={brands} />
    </div>
  );
}
