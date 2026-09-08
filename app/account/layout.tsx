import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import AccountNav from "@/components/account/account-nav";
import { getCustomerFromCookie } from "@/lib/get-customer";

/**
 * One shell for the whole customer portal — navbar, footer, and the
 * persistent account navigation live here, so every page under /account
 * is a pane in one product instead of an island with its own chrome.
 * Auth is guarded once, here; pages keep their own redirects as a
 * belt-and-braces (they also need the customer for data anyway).
 */
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("customer_token")?.value;
  if (!token) redirect("/login?redirect=/account");

  const customer = await getCustomerFromCookie();
  if (!customer) redirect("/login?redirect=/account");

  const isB2B = customer.customer_type === "b2b";
  const name = [customer.first_name, customer.last_name].filter(Boolean).join(" ") || customer.email;

  return (
    <main className="min-h-screen bg-[#f5f5f5]">
      <Navbar />
      <div className="tesla-shell pb-16 pt-[88px] sm:pt-[96px]">
        <div className="lg:grid lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-10">
          <AccountNav name={name} email={customer.email} company={customer.company_name} isB2B={isB2B} />
          <div className="min-w-0">{children}</div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
