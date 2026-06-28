import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import NotificationsCenter from "@/components/account/notifications-center";
import { getCustomerFromCookie } from "@/lib/get-customer";

export const metadata: Metadata = {
  title: "Notifications",
  description: "Your Okelcor portal notifications — order, payment, document and quote updates.",
};

export default async function NotificationsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("customer_token")?.value;
  if (!token) redirect("/login?redirect=/account/notifications");

  const customer = await getCustomerFromCookie();
  if (!customer) redirect("/login?redirect=/account/notifications");

  return (
    <main className="min-h-screen bg-[#f5f5f5]">
      <Navbar />

      <div className="tesla-shell pb-16 pt-[96px]">
        {/* Breadcrumb */}
        <Link
          href="/account"
          className="mb-5 inline-flex items-center gap-1 text-[0.82rem] font-semibold text-[var(--muted)] transition hover:text-[var(--primary)]"
        >
          <ChevronLeft size={15} strokeWidth={2.2} /> Back to account
        </Link>

        {/* Header */}
        <div className="mb-7">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--primary)]">Activity</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[var(--foreground)]">
            Notifications
          </h1>
          <p className="mt-1.5 max-w-2xl text-[0.88rem] text-[var(--muted)]">
            Every update about your orders, payments, documents and quotes — the same notifications we send to your email, kept in one place.
          </p>
        </div>

        <NotificationsCenter />
      </div>

      <Footer />
    </main>
  );
}
