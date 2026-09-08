import { redirect } from "next/navigation";
import type { Metadata } from "next";
import {
  adminApiFetch, adminSafeFetch, AdminUnauthorizedError, type AdminOrder,
} from "@/lib/admin-api";
import OrdersTable from "@/components/admin/orders-table";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "eBay Orders" };

type SearchParams = Promise<{ status?: string; payment_status?: string; q?: string; page?: string }>;

/**
 * eBay orders, separated from the rest.
 *
 * Built on `/admin/orders?channel=ebay` rather than the existing
 * `/admin/ebay/orders`, which sits behind `ebay.manage` — super_admin and admin
 * only. The people who work these orders are order managers, and that endpoint
 * would 403 every one of them. This route is under `orders.view` like the rest
 * of the orders section.
 */
export default async function AdminEbayOrdersPage({ searchParams }: { searchParams: SearchParams }) {
  const { status, payment_status, q, page } = await searchParams;

  try {
    await adminApiFetch<AdminOrder[]>("/orders", { params: { per_page: 1 }, revalidate: false });
  } catch (e) {
    if (e instanceof AdminUnauthorizedError) redirect("/admin/login");
  }

  const params: Record<string, string | number> = { per_page: 20, channel: "ebay" };
  if (status && status !== "all")                 params.status         = status;
  if (payment_status && payment_status !== "all") params.payment_status = payment_status;
  if (q?.trim())                                  params.q              = q.trim();
  if (page)                                       params.page           = page;

  const res = await adminSafeFetch<AdminOrder[]>("/orders", { params, revalidate: false });
  const orders: AdminOrder[] = Array.isArray(res?.data) ? res.data : [];
  const meta = res?.meta ?? {};

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <p className="text-[0.75rem] font-bold uppercase tracking-[0.18em] text-[#f4511e]">
          eBay Orders
        </p>
        <p className="mt-0.5 text-[0.875rem] text-[#5c5e62]">
          {typeof meta.total === "number"
            ? `${meta.total} eBay order${meta.total !== 1 ? "s" : ""}`
            : "Orders that came in through eBay"}
        </p>
      </div>

      <OrdersTable
        orders={orders}
        meta={meta}
        basePath="/admin/orders/ebay"
        currentStatus={status ?? "all"}
        currentPaymentStatus={payment_status ?? "all"}
        currentQ={q ?? ""}
        currentPage={Number(page ?? 1)}
        emptyHeading="No eBay orders"
        emptyDescription="Orders placed through eBay appear here. Website orders are on the main Orders page."
      />
    </div>
  );
}
