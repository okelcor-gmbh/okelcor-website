import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { ArrowLeft } from "lucide-react";
import {
  adminApiFetch,
  AdminUnauthorizedError,
  type AdminOrderFull,
} from "@/lib/admin-api";
import OrderDetail from "@/components/admin/order-detail";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const res = await adminApiFetch<AdminOrderFull>(`/orders/${id}`, { revalidate: false });
    return { title: `Order ${res.data.order_ref}` };
  } catch {
    return { title: "Order Detail" };
  }
}

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params;
  const numId = Number(id);
  if (!numId) notFound();

  let order: AdminOrderFull;
  let adminRole: string;
  try {
    const [res, cookieStore] = await Promise.all([
      adminApiFetch<AdminOrderFull>(`/orders/${numId}`, { revalidate: false }),
      cookies(),
    ]);
    order = res.data;
    adminRole = cookieStore.get("admin_role")?.value ?? "";
  } catch (e) {
    if (e instanceof AdminUnauthorizedError) redirect("/admin/login");
    notFound();
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-7">
        <Link
          href="/admin/orders"
          className="mb-4 inline-flex items-center gap-1.5 text-[0.8rem] font-medium text-[#5c5e62] transition hover:text-[#f4511e]"
        >
          <ArrowLeft size={14} strokeWidth={2} />
          Back to Orders
        </Link>
        <p className="text-[0.75rem] font-bold uppercase tracking-[0.18em] text-[#f4511e]">
          Order Detail
        </p>
        <p className="mt-0.5 text-[1rem] font-extrabold text-[#1a1a1a]">
          {order.order_ref}
        </p>
      </div>

      <OrderDetail order={order} adminRole={adminRole} />
    </div>
  );
}
