import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import MessagesCenter from "@/components/account/messages-center";
import { getCustomerFromCookie } from "@/lib/get-customer";

export const metadata: Metadata = {
  title: "Messages",
  description: "Messages from the Okelcor team about your orders and quotes.",
};

export default async function MessagesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("customer_token")?.value;
  if (!token) redirect("/login?redirect=/account/messages");

  const customer = await getCustomerFromCookie();
  if (!customer) redirect("/login?redirect=/account/messages");

  return (
    <main className="min-h-screen bg-[#f5f5f5]">
      <Navbar />

      <div className="tesla-shell pb-16 pt-[96px]">
        {/* Breadcrumb */}
        <Link
          href="/account"
          className="mb-6 inline-flex items-center gap-1.5 text-[0.83rem] text-[var(--muted)] transition hover:text-[var(--foreground)]"
        >
          <ChevronLeft size={14} /> Back to account
        </Link>

        <div className="mb-6">
          <h1 className="text-[1.6rem] font-extrabold tracking-tight text-[var(--foreground)] sm:text-2xl md:text-3xl">
            Messages
          </h1>
          <p className="mt-1 text-[0.85rem] text-[var(--muted)] sm:text-[0.88rem]">
            E-mails from the Okelcor team about your orders and quotes.
          </p>
        </div>

        <MessagesCenter />
      </div>

      <Footer />
    </main>
  );
}
