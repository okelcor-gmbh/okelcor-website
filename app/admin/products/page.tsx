import Link from "next/link";
import { redirect } from "next/navigation";
import PageHeader from "@/components/admin/page-header";
import { Plus, Trash2 } from "lucide-react";
import {
  adminApiFetch,
  adminSafeFetch,
  AdminUnauthorizedError,
  type AdminProduct,
} from "@/lib/admin-api";
import ProductsTable from "@/components/admin/products-table";
import CsvActions from "@/components/admin/csv-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Products" };

type SearchParams = Promise<{ q?: string; type?: string; audience?: string; page?: string; view?: string }>;

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { q, type, audience, page, view } = await searchParams;
  const currentView = view === "b2b" || view === "b2c" ? view : "all";

  function tabUrl(v: string) {
    const p = new URLSearchParams();
    if (q?.trim()) p.set("q", q.trim());
    if (type && type !== "all") p.set("type", type);
    if (audience && audience !== "all") p.set("audience", audience);
    if (v !== "all") p.set("view", v);
    const qs = p.toString();
    return `/admin/products${qs ? `?${qs}` : ""}`;
  }

  // Auth check — token exists (middleware), but may be expired
  try {
    await adminApiFetch<AdminProduct[]>("/products", {
      params: { per_page: 1 },
      revalidate: false,
    });
  } catch (e) {
    if (e instanceof AdminUnauthorizedError) redirect("/admin/login");
    // Other errors (network down) — fall through, table shows empty
  }

  // per_page matches the backend's cap (100) — asking for 200 just got 100
  // back while the page believed otherwise.
  const params: Record<string, string | number> = { per_page: 100 };
  if (q?.trim())              params.q       = q.trim();
  if (type && type !== "all") params.type    = type;
  if (audience && audience !== "all") params.audience = audience;
  if (currentView !== "all")  params.segment = currentView;
  // The pagination links have always written ?page= into the URL and the
  // label read it back — but it was never forwarded to the API, so every
  // "page" showed the same first 100 products. With 15,000 in the catalogue,
  // everything older was unreachable in the panel.
  if (page && Number(page) > 1) params.page = Number(page);

  const res = await adminSafeFetch<AdminProduct[]>("/products", {
    params,
    revalidate: false,
  });

  const products: AdminProduct[] = Array.isArray(res?.data) ? res.data : [];
  const meta = res?.meta ?? {};

  return (
    <div className="p-6 md:p-8">
      <PageHeader
        eyebrow="Catalogue"
        title="Products"
        sub={typeof meta.total === "number"
          ? `${meta.total} product${meta.total !== 1 ? "s" : ""} total`
          : "Manage your product catalogue"}
      >
        <div className="flex shrink-0 items-center gap-2">
          <CsvActions currentView={currentView} />
          <Link
            href="/admin/products/trash"
            className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2.5 text-[0.875rem] font-semibold text-[#5c5e62] transition hover:border-red-200 hover:text-red-600"
          >
            <Trash2 size={15} strokeWidth={2} />
            Trash
          </Link>
          <Link
            href="/admin/products/new"
            className="flex items-center gap-2 rounded-full bg-[#f4511e] px-5 py-2.5 text-[0.875rem] font-semibold text-white transition hover:bg-[#df4618]"
          >
            <Plus size={16} strokeWidth={2.5} />
            Add Product
          </Link>
        </div>
      </PageHeader>

      {/* B2B / B2C segment tabs */}
      <div className="mb-6">
        <div className="flex gap-1 border-b border-black/[0.07]">
          {(
            [
              { label: "All Products",   value: "all",  desc: "Full catalogue" },
              { label: "B2B · Wholesale", value: "b2b", desc: "Wholesale segment only" },
              { label: "B2C · Retail",    value: "b2c", desc: "Retail segment only" },
            ] as const
          ).map(({ label, value }) => (
            <Link
              key={value}
              href={tabUrl(value)}
              className={[
                "mb-[-1px] rounded-t-lg border border-transparent px-4 py-2 text-[0.82rem] font-semibold transition",
                currentView === value
                  ? "border-black/[0.07] border-b-white bg-white text-[#1a1a1a]"
                  : "text-[#5c5e62] hover:text-[#1a1a1a]",
              ].join(" ")}
            >
              {label}
            </Link>
          ))}
        </div>
        {currentView !== "all" && (
          <p className="mt-2 text-[0.78rem] text-[#5c5e62]">
            {currentView === "b2b"
              ? "Showing products available to B2B / wholesale customers — price column shows wholesale rate."
              : "Showing products available to B2C / retail customers — price column shows retail rate."}
          </p>
        )}
      </div>

      <ProductsTable
        products={products}
        meta={meta}
        currentQ={q ?? ""}
        currentType={type ?? "all"}
        currentAudience={audience ?? "all"}
        currentPage={Number(page ?? 1)}
        currentView={currentView}
      />
    </div>
  );
}
