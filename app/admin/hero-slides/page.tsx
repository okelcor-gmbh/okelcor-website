import { redirect } from "next/navigation";
import type { Metadata } from "next";
import {
  adminApiFetch,
  adminSafeFetch,
  AdminUnauthorizedError,
  type AdminHeroSlide,
} from "@/lib/admin-api";
import HeroSlidesManager from "@/components/admin/hero-slides-manager";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Hero Slides" };

export default async function AdminHeroSlidesPage() {
  try {
    await adminApiFetch<AdminHeroSlide[]>("/hero-slides", {
      params: { per_page: 1 },
      revalidate: false,
    });
  } catch (e) {
    if (e instanceof AdminUnauthorizedError) redirect("/admin/login");
  }

  const res = await adminSafeFetch<AdminHeroSlide[]>("/hero-slides", {
    revalidate: false,
  });

  const slides: AdminHeroSlide[] = Array.isArray(res?.data) ? res.data : [];

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <p className="text-[0.75rem] font-bold uppercase tracking-[0.18em] text-[#f4511e]">
          Hero Slides
        </p>
        <p className="mt-0.5 text-[0.875rem] text-[#5c5e62]">
          {slides.length > 0
            ? `${slides.length} slide${slides.length !== 1 ? "s" : ""} — displayed in the homepage hero carousel`
            : "Add slides to populate the homepage hero carousel"}
        </p>
      </div>

      <HeroSlidesManager slides={slides} />
    </div>
  );
}
