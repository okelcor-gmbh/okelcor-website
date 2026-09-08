import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import ClaimsPanel from "@/components/account/claims-panel";
import { getCustomerFromCookie } from "@/lib/get-customer";

export const metadata: Metadata = {
  title: "Claims & Returns",
  description: "Report a problem with a delivery and track your claims.",
};

export const dynamic = "force-dynamic";

// ?order=REF prefills the form with that order and opens it; ?new=1 just
// opens the form. Both come from the "Report a problem" buttons elsewhere
// in the portal.
type SearchParams = Promise<{ order?: string; new?: string }>;

export default async function ClaimsPage({ searchParams }: { searchParams: SearchParams }) {
  const cookieStore = await cookies();
  if (!cookieStore.get("customer_token")?.value) {
    redirect("/login?redirect=/account/claims");
  }
  const customer = await getCustomerFromCookie();
  if (!customer) {
    redirect("/login?redirect=/account/claims");
  }

  const { order, new: openNew } = await searchParams;

  return (
    <div>

      <div className="">
        <nav className="mb-6 flex items-center gap-1.5 text-[0.82rem] text-[var(--muted)]">
          <Link href="/account" className="transition hover:text-[var(--primary)]">My Account</Link>
          <ChevronRight size={13} strokeWidth={2.2} />
          <span className="font-semibold text-[var(--foreground)]">Claims &amp; Returns</span>
        </nav>

        <div className="mb-8">
          <h1 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]">
            Claims &amp; Returns
          </h1>
          <p className="mt-1 text-[0.9rem] text-[var(--muted)]">
            Something wrong with a delivery? Report it here and follow its status. No e-mail thread needed.
          </p>
        </div>

        <ClaimsPanel prefillOrder={order ?? null} openForm={Boolean(order || openNew)} />
      </div>
    </div>
  );
}
