import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import WholesalerHeader from "@/components/tyre-wholesaler/wholesaler-header";
import WholesalerFooter from "@/components/tyre-wholesaler/wholesaler-footer";
import ThankYouTracker from "@/components/tyre-wholesaler/thank-you-tracker";

export const metadata: Metadata = {
  title: "Thank You | Tyre Wholesale Inquiry | Okelcor",
  description: "Your wholesale tyre inquiry has been received. Our team will be in touch shortly.",
  robots: { index: false, follow: false },
};

export default function WholesalerThankYouPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <ThankYouTracker />
      <WholesalerHeader bare />

      <section className="flex flex-1 items-center justify-center bg-[#f5f5f5] px-4 pb-20 pt-[68px] lg:pt-[72px]">
        <div className="mx-auto max-w-xl py-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 size={32} strokeWidth={1.5} className="text-green-500" />
          </div>
          <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-[var(--foreground)] md:text-4xl">
            Thank you for your inquiry
          </h1>
          <p className="mx-auto mt-4 max-w-md text-[1.02rem] leading-7 text-[var(--muted)]">
            Our wholesale team will review your request and contact you shortly.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full bg-[var(--primary)] px-8 py-3.5 text-[0.95rem] font-semibold text-white transition hover:bg-[var(--primary-hover)]"
            >
              Back to Okelcor
            </Link>
            <Link
              href="/shop"
              className="inline-flex items-center justify-center rounded-full border-2 border-black/[0.12] px-8 py-3.5 text-[0.95rem] font-semibold text-[var(--foreground)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
            >
              Browse Catalogue
            </Link>
          </div>
        </div>
      </section>

      <WholesalerFooter />
    </main>
  );
}
