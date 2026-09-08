import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";
import {
  adminApiFetch,
  AdminUnauthorizedError,
  type AdminProduct,
  type AdminProductImage,
} from "@/lib/admin-api";
import ProductForm from "@/components/admin/product-form";
import GalleryManager from "@/components/admin/gallery-manager";
import DeleteProductButton from "@/components/admin/delete-product-button";
import { getSpecSheet } from "@/app/admin/products/actions";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const res = await adminApiFetch<AdminProduct>(`/products/${id}`, { revalidate: false });
    const p = res.data;
    return { title: `Edit — ${p.brand} ${p.name}` };
  } catch {
    return { title: "Edit Product" };
  }
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  const numId = Number(id);
  if (!numId) notFound();

  let product: AdminProduct;
  try {
    const res = await adminApiFetch<AdminProduct>(`/products/${numId}`, {
      revalidate: false,
    });
    product = res.data;
  } catch (e) {
    if (e instanceof AdminUnauthorizedError) redirect("/admin/login");
    notFound();
  }

  const specSheet = await getSpecSheet();

  // Normalise gallery images — API may return objects or plain URL strings
  const rawImages = product.images ?? [];
  const galleryImages: AdminProductImage[] = rawImages.map((img, idx) =>
    typeof img === "string"
      ? { id: idx, url: img }
      : (img as AdminProductImage)
  );

  return (
    <div className="p-6 md:p-8">
      {/* Back + header */}
      <div className="mb-7">
        <Link
          href="/admin/products"
          className="mb-4 inline-flex items-center gap-1.5 text-[0.8rem] font-medium text-[#5c5e62] transition hover:text-[#f4511e]"
        >
          <ArrowLeft size={14} strokeWidth={2} />
          Back to Products
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[0.75rem] font-bold uppercase tracking-[0.18em] text-[#f4511e]">
              Edit Product
            </p>
            <p className="mt-0.5 text-[0.875rem] text-[#5c5e62]">
              {product.brand} · {product.name} · <span className="font-mono">{product.sku}</span>
            </p>
          </div>
          <DeleteProductButton productId={numId} productName={`${product.brand} ${product.name}`} />
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* Product form */}
        <div className="rounded-2xl bg-white p-6 shadow-sm md:p-8">
          <ProductForm mode="edit" product={product} specSheet={specSheet} />
        </div>

        {/* Gallery manager */}
        <GalleryManager productId={numId} images={galleryImages} />
      </div>
    </div>
  );
}
