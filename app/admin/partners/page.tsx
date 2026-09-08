import type { Metadata } from "next";
import PartnersManager from "@/components/admin/partners-manager";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Partners" };

export default function PartnersPage() {
  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <p className="text-[0.75rem] font-bold uppercase tracking-[0.18em] text-[#f4511e]">
          Partner Sales Log
        </p>
        <h1 className="mt-0.5 text-[1.25rem] font-extrabold text-[#171a20]">Partners</h1>
        <p className="mt-1 max-w-2xl text-[0.875rem] text-[#5c5e62]">
          Distributors and agents who report their sales through{" "}
          <span className="font-medium">partners.okelcor.com</span>. There is no
          self-signup — create the business and its first user here, then give them
          the phone number and PIN to sign in with.
        </p>
      </div>

      <PartnersManager />
    </div>
  );
}
