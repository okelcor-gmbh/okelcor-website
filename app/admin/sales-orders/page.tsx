import type { Metadata } from "next";
import SalesOrderBoard from "@/components/admin/sales-order-board";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Sales & Orders Board" };

export default function SalesOrdersPage() {
  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <p className="text-[0.75rem] font-bold uppercase tracking-[0.18em] text-[#f4511e]">
          Sales &amp; Order Management
        </p>
        <p className="mt-0.5 text-[0.875rem] text-[#5c5e62]">
          Customer revenue against supplier costs, order by order — the margin and its proof
        </p>
      </div>
      <SalesOrderBoard />
    </div>
  );
}
