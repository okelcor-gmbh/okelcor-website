import { redirect } from "next/navigation";
import type { Metadata } from "next";
import {
  adminApiFetch,
  AdminUnauthorizedError,
  type AdminProduct,
} from "@/lib/admin-api";
import SupplierIntel from "@/components/admin/supplier-intel";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Supplier Intel" };

export default async function SupplierPage() {
  let products: AdminProduct[] = [];
  try {
    const res = await adminApiFetch<AdminProduct[]>("/products", {
      params: { per_page: 200 },
      revalidate: 60,
    });
    products = Array.isArray(res.data) ? res.data : [];
  } catch (e) {
    if (e instanceof AdminUnauthorizedError) redirect("/admin/login");
    // Non-fatal — page still works without the product dropdown
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-7">
        <p className="text-[0.75rem] font-bold uppercase tracking-[0.18em] text-[#f4511e]">
          Intelligence
        </p>
        <p className="mt-0.5 text-[1rem] font-extrabold text-[#1a1a1a]">
          Supplier Intel
        </p>
        <p className="mt-1 text-[0.82rem] text-[#5c5e62]">
          Search eBay Germany and global B2B marketplaces to benchmark supplier prices against your catalogue.
        </p>
      </div>
      <SupplierIntel products={products} />
    </div>
  );
}
