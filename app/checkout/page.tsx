import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import CheckoutFlow from "@/components/checkout/checkout-flow";

export const metadata: Metadata = {
  title: "Checkout – Okelcor",
  description: "Complete your tyre order with Okelcor.",
};

/**
 * Server-side session check — defence-in-depth layer.
 *
 * The middleware (middleware.ts) is the primary gate and redirects
 * unauthenticated users before this page renders. This check is a
 * fallback: if middleware is misconfigured or bypassed, the page
 * itself refuses to render checkout content without a valid session.
 *
 * On no session → redirect to /auth with callbackUrl=/checkout so
 * NextAuth returns the user here after a successful sign-in.
 */
export default async function CheckoutPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("customer_token")?.value;

  if (!token) {
    redirect("/login?redirect=/checkout");
  }

  return (
    <main>
      <Navbar />
      <div className="min-h-screen w-full bg-[#f5f5f5] pt-[72px] sm:pt-[80px] lg:pt-20">
        <CheckoutFlow />
      </div>
      <Footer />
    </main>
  );
}
