import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  adminApiFetch,
  AdminUnauthorizedError,
  type AdminBrand,
} from "@/lib/admin-api";
import BrandContentForm from "@/components/admin/brand-content-form";
import { getSpecSheet } from "@/app/admin/products/actions";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const res = await adminApiFetch<AdminBrand>(`/brands/${id}`, { revalidate: false });
    return { title: `Brand Content — ${res.data.name}` };
  } catch {
    return { title: "Brand Content" };
  }
}

/**
 * Content defaults for one brand (Session 93). Everything saved here is
 * inherited by every product of the brand that has no value of its own —
 * entered once instead of 15,000 times.
 */
export default async function BrandContentPage({ params }: Props) {
  const { id } = await params;
  const numId = Number(id);
  if (!numId) notFound();

  let brand: AdminBrand;
  try {
    const res = await adminApiFetch<AdminBrand>(`/brands/${numId}`, { revalidate: false });
    brand = res.data;
  } catch (e) {
    if (e instanceof AdminUnauthorizedError) redirect("/admin/login");
    notFound();
  }

  const specSheet = await getSpecSheet();

  return (
    <div className="p-6 md:p-8">
      <div className="mb-7">
        <Link
          href="/admin/brands"
          className="mb-4 inline-flex items-center gap-1.5 text-[0.8rem] font-medium text-[#5c5e62] transition hover:text-[#f4511e]"
        >
          <ArrowLeft size={14} strokeWidth={2} />
          Back to Brands
        </Link>
        <p className="text-[0.75rem] font-bold uppercase tracking-[0.18em] text-[#f4511e]">
          Brand Content — {brand.name}
        </p>
        <p className="mt-0.5 max-w-2xl text-[0.875rem] text-[#5c5e62]">
          Everything here applies to every {brand.name} product that has not set
          its own value — one entry instead of one per product. A product&apos;s own
          content always wins over the brand default.
        </p>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm md:p-8">
        <BrandContentForm brand={brand} specSheet={specSheet} />
      </div>
    </div>
  );
}
