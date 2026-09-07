import type { Metadata } from "next";
import TierPricingBoard from "@/components/admin/tier-pricing-board";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Tyre Pricing — Admin" };

export default function TierPricingPage() {
  return <TierPricingBoard />;
}
