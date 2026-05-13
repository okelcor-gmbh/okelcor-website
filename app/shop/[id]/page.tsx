import { notFound, redirect } from "next/navigation";
import { SHOP_REQUIRES_LOGIN } from "@/lib/flags";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import ShopBreadcrumb from "@/components/shop/shop-breadcrumb";
import ProductGallery from "@/components/shop/product-gallery";
import ProductInfo from "@/components/shop/product-info";
import ProductAccordion from "@/components/shop/product-accordion";
import RelatedProducts from "@/components/shop/related-products";
import { getProductById, getRelatedProducts, type Product } from "@/components/shop/data";
import { SITE_URL } from "@/lib/constants";
import ProductViewTracker from "@/components/shop/product-view-tracker";
import { apiFetch, type ApiProduct } from "@/lib/api";
import { getServerLocale } from "@/lib/locale";
import { getProductImageUrl } from "@/lib/utils";

type Props = { params: Promise<{ id: string }> };

function extractImagePath(entry: unknown): string {
  if (!entry) return "";
  if (typeof entry === "string") return entry;
  const obj = entry as Record<string, unknown>;
  // Use || so empty strings fall through
  return ((obj.path || obj.url || obj.image_url || "") as string);
}

/** Map the API product shape → local Product shape used by all components. */
function toProduct(p: ApiProduct): Product {
  // Do NOT fall back to p.image — that field may contain an admin category image.
  const rawPrimary = p.primary_image || p.image_url || extractImagePath(p.images?.[0]) || "";
  const galleryPaths = (p.images ?? []).map(extractImagePath).filter(Boolean);
  const allPaths = [rawPrimary, ...galleryPaths.filter((g) => g !== rawPrimary)].filter(Boolean);
  return {
    ...p,
    primary_image: rawPrimary,
    image:         getProductImageUrl(rawPrimary),
    images:        allPaths.map(getProductImageUrl),
    brand_image:   p.brand_image ? getProductImageUrl(p.brand_image) : undefined,
    in_stock:      p.in_stock != null ? Boolean(p.in_stock) : undefined,
    price_b2b:     p.price_b2b != null && Number(p.price_b2b) > 0 ? Number(p.price_b2b) : undefined,
    price_b2c:     p.price_b2c != null && Number(p.price_b2c) > 0 ? Number(p.price_b2c) : undefined,
  };
}

// Always render dynamically — product data must never be baked at build time
// because the API returns Cache-Control: no-store and products can be deleted
// or updated at any time via the admin CMS.
export const dynamic = "force-dynamic";

async function getToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return (
    cookieStore.get("customer_token")?.value ||
    process.env.SHOP_GUEST_TOKEN ||
    undefined
  );
}

async function fetchProduct(id: number, locale: string, token?: string): Promise<Product | undefined> {
  try {
    const res = await apiFetch<ApiProduct>(`/products/${id}`, {
      locale,
      revalidate: false,
      token,
    });
    return res.data ? toProduct(res.data) : undefined;
  } catch {
    // API unavailable — fall back to static data
    return getProductById(id);
  }
}

async function fetchRelated(product: Product, locale: string, token?: string, count = 3): Promise<Product[]> {
  try {
    const res = await apiFetch<ApiProduct[]>("/products", {
      locale,
      revalidate: false,
      params: { type: product.type },
      token,
    });
    if (!res.data?.length) throw new Error("empty");
    return res.data
      .filter((p) => p.type === product.type && p.id !== product.id)
      .slice(0, count)
      .map(toProduct);
  } catch {
    return getRelatedProducts(product, count);
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const [locale, token] = await Promise.all([getServerLocale(), getToken()]);
  const product = await fetchProduct(Number(id), locale, token);
  if (!product) return { title: "Product Not Found" };

  const title = `${product.brand} ${product.name} ${product.size}`;
  const description = `${product.description} Available for wholesale order. Global delivery from Okelcor.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://www.okelcor.com/shop/${product.id}`,
    },
    openGraph: {
      title: `${title} – Okelcor`,
      description,
      url: `https://www.okelcor.com/shop/${product.id}`,
      type: "website",
    },
    twitter: {
      title: `${title} – Okelcor`,
      description,
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  const [locale, token] = await Promise.all([getServerLocale(), getToken()]);

  if (SHOP_REQUIRES_LOGIN && !token) redirect(`/login?redirect=/shop/${id}`);

  const product = await fetchProduct(Number(id), locale, token);
  if (!product) notFound();

  const related = await fetchRelated(product, locale, token);

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${product.brand} ${product.name} ${product.size}`,
    description: product.description,
    sku: product.sku,
    brand: { "@type": "Brand", name: product.brand },
    image: product.image?.startsWith("/") ? `${SITE_URL}${product.image}` : product.image,
    offers: {
      "@type": "Offer",
      priceCurrency: "EUR",
      price: product.price.toFixed(2),
      availability: "https://schema.org/InStock",
      seller: { "@type": "Organization", name: "Okelcor" },
      url: `${SITE_URL}/shop/${product.id}`,
    },
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <ProductViewTracker product={product} />
      <Navbar />

      <div className="w-full bg-[#f5f5f5]" style={{ paddingTop: "calc(var(--bar-h, 0px) + 76px)" }}>
        {/* Breadcrumb */}
        <div className="tesla-shell py-4">
          <ShopBreadcrumb product={product} />
        </div>

        {/* Product layout */}
        <div className="tesla-shell pb-10 pt-2">
          <div className="grid gap-8 md:grid-cols-2 md:gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            <ProductGallery product={product} />
            <ProductInfo product={product} />
          </div>
        </div>

        {/* Accordion */}
        <div className="tesla-shell pb-12">
          <ProductAccordion product={product} />
        </div>
      </div>

      {/* Related products */}
      <RelatedProducts products={related} />

      <Footer />
    </main>
  );
}
