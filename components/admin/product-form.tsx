"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, AlertCircle, Upload, ImagePlus, X } from "lucide-react";
import { createProduct, updateProduct, uploadProductPrimaryImage, uploadProductImages, type ProductInput, type SpecSheetRow } from "@/app/admin/products/actions";
import type { AdminProduct } from "@/lib/admin-api";
import ArticleRichEditor from "@/components/admin/article-rich-editor";

// ── Constants ─────────────────────────────────────────────────────────────────

const SEASONS = ["Summer", "Winter", "All Season", "All-Terrain"] as const;
const TYPES   = ["PCR", "TBR", "Used", "OTR"] as const;

/**
 * Who the listing is for (Session 116). "Both" is every product's default;
 * "Trade only" keeps container lots away from retail visitors, "Retail
 * only" keeps consumer promotions out of the trade view.
 */
const AUDIENCES = [
  { value: "both", label: "Both audiences" },
  { value: "b2b",  label: "Trade only (B2B)" },
  { value: "b2c",  label: "Retail only (B2C)" },
] as const;

// ── Styles ────────────────────────────────────────────────────────────────────

const inputCls =
  "w-full rounded-xl border border-black/[0.09] bg-white px-4 py-2.5 text-[0.875rem] text-[#1a1a1a] outline-none placeholder:text-[#aaa] transition focus:border-[#f4511e] focus:ring-2 focus:ring-[#f4511e]/10";

const inputErrCls =
  "w-full rounded-xl border border-red-400 bg-red-50/40 px-4 py-2.5 text-[0.875rem] text-[#1a1a1a] outline-none transition focus:border-red-500";

const labelCls = "mb-1.5 block text-[0.78rem] font-semibold text-[#1a1a1a]";

// ── Sub-components ────────────────────────────────────────────────────────────

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={labelCls}>
        {label}
        {required && <span className="ml-0.5 text-[#f4511e]">*</span>}
      </label>
      {children}
      {error && (
        <p role="alert" className="mt-1 text-[0.72rem] text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="col-span-full text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[#f4511e]">
      {children}
    </p>
  );
}

// ── Validation ────────────────────────────────────────────────────────────────

type FormErrors = Partial<Record<keyof ProductInput | "image", string>>;

function validate(data: ProductInput): FormErrors {
  const errs: FormErrors = {};
  if (!data.sku.trim())         errs.sku         = "SKU is required.";
  if (!data.brand.trim())       errs.brand        = "Brand is required.";
  if (!data.name.trim())        errs.name         = "Name is required.";
  if (!data.size.trim())        errs.size         = "Size is required.";
  if (!data.type)               errs.type         = "Type is required.";
  if (!data.description.trim()) errs.description  = "Description is required.";
  if (!data.price || data.price <= 0) errs.price  = "Enter a valid price.";
  return errs;
}

// ── Main component ────────────────────────────────────────────────────────────

type Props =
  | { mode: "create"; specSheet?: SpecSheetRow[] }
  | { mode: "edit"; product: AdminProduct; specSheet?: SpecSheetRow[] };

/**
 * Columns already edited by their own form fields above the sheet — rendering
 * them again inside the Artikelmerkmale section would mean two inputs for one
 * value. Hersteller = Brand, Modell = Product Name, Reifenspezifikation =
 * Spec / Load Index; Reifenzustand is derived from Type.
 */
const SHEET_COLUMNS_EDITED_ELSEWHERE = new Set(["brand", "name", "spec"]);

export default function ProductForm(props: Props) {
  const router = useRouter();
  const isEdit = props.mode === "edit";
  const initial: AdminProduct | undefined = isEdit ? props.product : undefined;
  const specSheet = props.specSheet ?? [];

  const [sku,         setSku]         = useState(initial?.sku         ?? "");
  const [brand,       setBrand]       = useState(initial?.brand       ?? "");
  const [name,        setName]        = useState(initial?.name        ?? "");
  const [size,        setSize]        = useState(initial?.size        ?? "");
  const [spec,        setSpec]        = useState(initial?.spec        ?? "");
  const [season,      setSeason]      = useState(initial?.season      ?? "Summer");
  const [type,        setType]        = useState(initial?.type        ?? "PCR");
  const [audience,    setAudience]    = useState(initial?.audience    ?? "both");
  const [price,       setPrice]       = useState(String(initial?.price ?? ""));
  const [description, setDescription] = useState(initial?.description ?? "");
  const [isActive,    setIsActive]    = useState(initial?.is_active   ?? true);

  // ── Product optimization (Session 92) ─────────────────────────────────────
  const [slug,            setSlug]            = useState(initial?.slug ?? "");
  const [descriptionHtml, setDescriptionHtml] = useState(initial?.description_html ?? "");
  const [shippingInfo,    setShippingInfo]    = useState(initial?.shipping_info ?? "");
  const [returnsInfo,     setReturnsInfo]     = useState(initial?.returns_info ?? "");
  // JSON-backed sheet values (EU label classes, EPREL …)
  const [specs, setSpecs] = useState<Record<string, string | boolean>>(
    (initial?.specs as Record<string, string | boolean>) ?? {}
  );
  // Column-backed sheet values (width, rim, load index …) — submitted as
  // top-level fields so they land in their existing columns.
  const [columnSpecs, setColumnSpecs] = useState<Record<string, string>>({
    width:          initial?.width != null ? String(initial.width) : "",
    height:         initial?.height != null ? String(initial.height) : "",
    rim:            initial?.rim != null ? String(initial.rim) : "",
    load_index:     initial?.load_index != null ? String(initial.load_index) : "",
    speed_rating:   initial?.speed_rating ?? "",
    ean:            initial?.ean ?? "",
    tread_depth_mm: initial?.tread_depth_mm != null ? String(initial.tread_depth_mm) : "",
  });

  const setSpec_ = (key: string, value: string | boolean) =>
    setSpecs((prev) => ({ ...prev, [key]: value }));
  const setColumnSpec = (column: string, value: string) =>
    setColumnSpecs((prev) => ({ ...prev, [column]: value }));

  const [imageFile,   setImageFile]   = useState<File | null>(null);
  const initialImg = initial?.primary_image ?? initial?.image_url ?? null;
  const [imagePreview, setImagePreview] = useState<string | null>(initialImg);
  const [galleryFiles,    setGalleryFiles]    = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Sync preview when server sends fresh props after router.refresh()
  useEffect(() => {
    if (!imageFile) {
      setImagePreview(initial?.primary_image ?? initial?.image_url ?? null);
    }
  }, [initial?.primary_image, initial?.image_url]);

  const [errors,      setErrors]      = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success,     setSuccess]     = useState(false);
  const [isPending, startTransition]  = useTransition();

  // ── Image pickers ─────────────────────────────────────────────────────────

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setGalleryFiles((prev) => [...prev, ...files]);
    setGalleryPreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
    e.target.value = "";
  };

  const removeGalleryFile = (idx: number) => {
    setGalleryFiles((prev) => prev.filter((_, i) => i !== idx));
    setGalleryPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSuccess(false);

    const data: ProductInput = {
      sku: sku.trim(),
      brand: brand.trim(),
      name: name.trim(),
      size: size.trim(),
      spec: spec.trim(),
      season,
      type,
      audience,
      price: parseFloat(price) || 0,
      description: description.trim(),
      is_active: isActive,

      // Product optimization (Session 92). Blank slug on create = backend
      // generates brand+name+season; on edit a blank keeps the existing URL.
      slug: slug.trim() || null,
      description_html: descriptionHtml.trim() || null,
      shipping_info: shippingInfo.trim() || null,
      returns_info: returnsInfo.trim() || null,
      specs,
      // Column-backed sheet fields — top-level, into their existing columns.
      width:          (columnSpecs.width || null) as ProductInput["width"],
      height:         (columnSpecs.height || null) as ProductInput["height"],
      rim:            (columnSpecs.rim || null) as ProductInput["rim"],
      load_index:     (columnSpecs.load_index || null) as ProductInput["load_index"],
      speed_rating:   columnSpecs.speed_rating || null,
      ean:            columnSpecs.ean || null,
      tread_depth_mm: columnSpecs.tread_depth_mm ? parseFloat(columnSpecs.tread_depth_mm) : null,
    };

    const errs = validate(data);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});

    startTransition(async () => {
      if (isEdit) {
        // ── Update ──────────────────────────────────────────────────────────
        const result = await updateProduct(initial!.id, data);
        if (result.error) { setSubmitError(result.error); return; }

        // Upload new primary image if selected
        if (imageFile) {
          const fd = new FormData();
          fd.append("primary_image", imageFile);
          const imgResult = await uploadProductPrimaryImage(initial!.id, fd);
          if (imgResult.error) { setSubmitError(imgResult.error); return; }
          // Clear so useEffect can sync preview from the fresh server data
          // returned by router.refresh() below.
          setImageFile(null);
        }

        setSuccess(true);
        router.refresh();
        setTimeout(() => setSuccess(false), 3000);
      } else {
        // ── Create ──────────────────────────────────────────────────────────
        const result = await createProduct(data);
        if (result.error) { setSubmitError(result.error); return; }

        const newId = result.id;

        // Upload primary image if selected
        if (imageFile && newId) {
          const fd = new FormData();
          fd.append("primary_image", imageFile);
          const imgResult = await uploadProductPrimaryImage(newId, fd);
          if (imgResult.error) { setSubmitError(imgResult.error); return; }
          setImageFile(null);
        }

        // Upload gallery images if selected
        if (galleryFiles.length > 0 && newId) {
          const fd = new FormData();
          galleryFiles.forEach((f) => fd.append("images[]", f));
          const galleryResult = await uploadProductImages(newId, fd);
          if (galleryResult.error) { setSubmitError(galleryResult.error); return; }
        }

        // Navigate to products list
        router.push("/admin/products");
      }
    });
  };

  const ic = (key: keyof ProductInput) => (errors[key] ? inputErrCls : inputCls);

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* Alerts */}
      {submitError && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[0.83rem] text-red-700">
          <AlertCircle size={15} className="shrink-0" />
          {submitError}
        </div>
      )}
      {success && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[0.83rem] text-emerald-700">
          <CheckCircle2 size={15} className="shrink-0" />
          Product saved successfully.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

        {/* ── Basic Info ── */}
        <SectionHeading>Basic Information</SectionHeading>

        <Field label="SKU" required error={errors.sku}>
          <input
            type="text"
            placeholder="OKL-0001"
            value={sku}
            onChange={(e) => { setSku(e.target.value); setErrors((p) => ({ ...p, sku: undefined })); }}
            className={ic("sku")}
          />
        </Field>

        <Field label="Brand" required error={errors.brand}>
          <input
            type="text"
            placeholder="Michelin"
            value={brand}
            onChange={(e) => { setBrand(e.target.value); setErrors((p) => ({ ...p, brand: undefined })); }}
            className={ic("brand")}
          />
        </Field>

        <Field label="Product Name" required error={errors.name}>
          <input
            type="text"
            placeholder="Energy Saver+"
            value={name}
            onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: undefined })); }}
            className={ic("name")}
          />
        </Field>

        <Field label="Size" required error={errors.size}>
          <input
            type="text"
            placeholder="205/55R16"
            value={size}
            onChange={(e) => { setSize(e.target.value); setErrors((p) => ({ ...p, size: undefined })); }}
            className={ic("size")}
          />
        </Field>

        {/* ── Specifications ── */}
        <SectionHeading>Specifications</SectionHeading>

        <Field label="Spec / Load Index">
          <input
            type="text"
            placeholder="91H"
            value={spec}
            onChange={(e) => setSpec(e.target.value)}
            className={inputCls}
          />
        </Field>

        <Field label="Season">
          <select
            value={season}
            onChange={(e) => setSeason(e.target.value)}
            className={inputCls}
          >
            {SEASONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </Field>

        <Field label="Type" required error={errors.type}>
          <select
            value={type}
            onChange={(e) => { setType(e.target.value); setErrors((p) => ({ ...p, type: undefined })); }}
            className={ic("type")}
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </Field>

        <Field label="Listed for" error={errors.audience}>
          <select
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            className={ic("audience")}
          >
            {AUDIENCES.map((a) => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </select>
        </Field>

        <Field label="Price (€)" required error={errors.price}>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="89.99"
            value={price}
            onChange={(e) => { setPrice(e.target.value); setErrors((p) => ({ ...p, price: undefined })); }}
            className={ic("price")}
          />
        </Field>

        {/* ── SEO URL ── */}
        <SectionHeading>SEO URL</SectionHeading>

        <div className="col-span-full">
          <Field label="URL Slug">
            <input
              type="text"
              placeholder={isEdit ? "" : "Leave blank — generated as brand-name-season"}
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className={inputCls}
            />
          </Field>
          <p className="mt-1.5 text-[0.72rem] text-[#5c5e62]">
            The product&apos;s address: <span className="font-mono">okelcor.com/shop/{slug.trim() || "brand-name-season"}</span>.
            {isEdit
              ? " Renaming the product does not change it — a changed slug moves a live URL that may be indexed and bookmarked, so only edit this deliberately."
              : " Left blank, it is generated from brand, name and season."}
          </p>
        </div>

        {/* ── Description ── */}
        <SectionHeading>Description</SectionHeading>

        <Field label="Short Description" required error={errors.description}>
          <div className="col-span-full">
            <textarea
              rows={3}
              placeholder="One or two plain sentences — used for search results and the meta description…"
              value={description}
              onChange={(e) => { setDescription(e.target.value); setErrors((p) => ({ ...p, description: undefined })); }}
              className={`${ic("description")} resize-none col-span-full`}
            />
          </div>
        </Field>

        {/* Rich description — same editor and same server-side sanitizer as
            article bodies, which is what the marketing brief asked for. */}
        <div className="col-span-full">
          <label className={labelCls}>Rich Description</label>
          <ArticleRichEditor
            value={descriptionHtml}
            onChange={setDescriptionHtml}
            placeholder="The full product story — headings, lists, tables and formatting, like an article…"
            minHeight={220}
          />
          <p className="mt-1.5 text-[0.72rem] text-[#5c5e62]">
            Shown on the product page. Leave empty to show only the short description.
          </p>
        </div>

        {/* ── Artikelmerkmale — the tyre specification sheet ──
            Rendered from the backend's catalogue, so a new attribute appears
            here without a frontend change. Empty fields are simply not shown
            on the product page. */}
        {specSheet.length > 0 && (
          <>
            <SectionHeading>Artikelmerkmale / Tyre Specifications</SectionHeading>

            <p className="col-span-full -mt-2 text-[0.72rem] text-[#5c5e62]">
              Condition, manufacturer, model and specification come from the fields
              above (Type, Brand, Product Name, Spec). Everything left empty is
              simply not printed on the product page.
            </p>

            {specSheet.map((row) => {
              if (row.source === "derived") return null;
              if (row.source === "column" && (!row.column || SHEET_COLUMNS_EDITED_ELSEWHERE.has(row.column))) return null;

              const label = `${row.label_de}${row.label_en !== row.label_de ? ` — ${row.label_en}` : ""}`;

              if (row.input === "select") {
                const value = (specs[row.key] as string) ?? "";
                return (
                  <Field key={row.key} label={label}>
                    <select
                      value={value}
                      onChange={(e) => setSpec_(row.key, e.target.value)}
                      className={inputCls}
                    >
                      <option value="">— not set —</option>
                      {(row.options ?? []).map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </Field>
                );
              }

              if (row.input === "boolean") {
                const value = specs[row.key];
                return (
                  <Field key={row.key} label={label}>
                    <select
                      value={value === true ? "yes" : value === false ? "no" : ""}
                      onChange={(e) => {
                        if (e.target.value === "") {
                          setSpecs((prev) => { const next = { ...prev }; delete next[row.key]; return next; });
                        } else {
                          setSpec_(row.key, e.target.value === "yes");
                        }
                      }}
                      className={inputCls}
                    >
                      <option value="">— not set —</option>
                      <option value="yes">Ja / Yes</option>
                      <option value="no">Nein / No</option>
                    </select>
                  </Field>
                );
              }

              // Free text — column-backed rows bind their existing column,
              // json rows bind the specs object.
              if (row.source === "column" && row.column) {
                return (
                  <Field key={row.key} label={label}>
                    <input
                      type="text"
                      value={columnSpecs[row.column] ?? ""}
                      onChange={(e) => setColumnSpec(row.column!, e.target.value)}
                      className={inputCls}
                    />
                  </Field>
                );
              }

              return (
                <Field key={row.key} label={label}>
                  <input
                    type="text"
                    value={(specs[row.key] as string) ?? ""}
                    onChange={(e) => setSpec_(row.key, e.target.value)}
                    className={inputCls}
                  />
                </Field>
              );
            })}
          </>
        )}

        {/* ── Shipping & Returns ── */}
        <SectionHeading>Shipping &amp; Returns</SectionHeading>

        <p className="col-span-full -mt-2 text-[0.72rem] text-[#5c5e62]">
          Site-wide texts live in Settings (<span className="font-mono">product_shipping_info</span>,{" "}
          <span className="font-mono">product_returns_info</span>) and apply to every product.
          Fill these only where THIS product differs — they override the site-wide text.
        </p>

        <Field label="Shipping (this product only)">
          <textarea
            rows={3}
            placeholder="Leave empty to use the site-wide shipping text…"
            value={shippingInfo}
            onChange={(e) => setShippingInfo(e.target.value)}
            className={`${inputCls} resize-none`}
          />
        </Field>

        <Field label="Returns (this product only)">
          <textarea
            rows={3}
            placeholder="Leave empty to use the site-wide returns text…"
            value={returnsInfo}
            onChange={(e) => setReturnsInfo(e.target.value)}
            className={`${inputCls} resize-none`}
          />
        </Field>

        {/* ── Primary Image ── */}
        <SectionHeading>Primary Image</SectionHeading>

        <div className="col-span-full flex flex-col gap-3 sm:flex-row sm:items-start">
          {/* Preview */}
          <div className="h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-[#f0f2f5]">
            {imagePreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imagePreview}
                alt="Product preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-[#bbb]">
                <Upload size={20} strokeWidth={1.5} />
                <span className="text-[0.65rem]">No image</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="product-image"
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-black/[0.09] bg-white px-4 py-2.5 text-[0.83rem] font-semibold text-[#1a1a1a] transition hover:border-[#f4511e] hover:text-[#f4511e]"
            >
              <Upload size={14} strokeWidth={2} />
              {imageFile ? "Change image" : isEdit ? "Replace image" : "Choose image"}
            </label>
            <input
              id="product-image"
              type="file"
              accept="image/*,video/mp4,video/mov,video/avi,video/webm"
              onChange={handleImageChange}
              className="sr-only"
            />
            <p className="text-[0.73rem] text-[#5c5e62]">
              JPG, PNG, WebP or MP4/MOV · Max 50 MB
            </p>
            {imageFile && (
              <p className="text-[0.73rem] font-medium text-[#f4511e]">
                Selected: {imageFile.name}
              </p>
            )}
          </div>
        </div>

        {/* ── Gallery Images (create mode only — edit page has GalleryManager) ── */}
        {!isEdit && (
          <>
            <SectionHeading>Gallery Images</SectionHeading>

            <div className="col-span-full space-y-3">
              {/* Selected previews */}
              {galleryPreviews.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {galleryPreviews.map((src, i) => (
                    <div key={i} className="group relative h-20 w-20 overflow-hidden rounded-xl bg-[#f0f2f5]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeGalleryFile(i)}
                        className="absolute right-1 top-1 hidden h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black group-hover:flex"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-xl border border-black/[0.09] bg-white px-4 py-2.5 text-[0.83rem] font-semibold text-[#1a1a1a] transition hover:border-[#f4511e] hover:text-[#f4511e]"
                >
                  <ImagePlus size={14} strokeWidth={2} />
                  {galleryFiles.length > 0 ? "Add more images" : "Choose gallery images"}
                </button>
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*,video/mp4,video/mov,video/avi,video/webm"
                  multiple
                  onChange={handleGalleryChange}
                  className="sr-only"
                />
                {galleryFiles.length > 0 && (
                  <span className="text-[0.78rem] text-[#5c5e62]">
                    {galleryFiles.length} file{galleryFiles.length !== 1 ? "s" : ""} selected
                  </span>
                )}
              </div>
              <p className="text-[0.72rem] text-[#aaa]">
                JPG, PNG, WebP or MP4/MOV · Max 50 MB per file · Optional — can also be added after creation
              </p>
            </div>
          </>
        )}

        {/* ── Status ── */}
        <SectionHeading>Visibility</SectionHeading>

        <div className="col-span-full">
          <label className="flex cursor-pointer items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={isActive}
              onClick={() => setIsActive((v) => !v)}
              className={[
                "relative h-6 w-11 rounded-full transition-colors",
                isActive ? "bg-[#f4511e]" : "bg-[#d1d5db]",
              ].join(" ")}
            >
              <span
                className={[
                  "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                  isActive ? "translate-x-5" : "translate-x-0.5",
                ].join(" ")}
              />
            </button>
            <span className="text-[0.875rem] font-medium text-[#1a1a1a]">
              {isActive ? "Active — visible in the catalogue" : "Inactive — hidden from the catalogue"}
            </span>
          </label>
        </div>

      </div>

      {/* Submit */}
      <div className="mt-8 flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="flex h-[46px] items-center justify-center rounded-full bg-[#f4511e] px-8 text-[0.9rem] font-semibold text-white transition hover:bg-[#df4618] disabled:opacity-60"
        >
          {isPending
            ? (isEdit ? "Saving…" : "Creating…")
            : (isEdit ? "Save Changes" : "Create Product")}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/products")}
          className="flex h-[46px] items-center justify-center rounded-full border border-black/10 bg-white px-6 text-[0.9rem] font-semibold text-[#1a1a1a] transition hover:bg-[#f0f2f5]"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
