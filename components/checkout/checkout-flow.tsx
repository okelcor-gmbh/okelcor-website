"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ChevronRight, CreditCard, Info, Landmark, Lock, ShieldCheck, Tag } from "lucide-react";
import BankTransferDetails from "@/components/account/bank-transfer-details";
import { useCart } from "@/context/cart-context";
import { useLanguage } from "@/context/language-context";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import OrderSummary from "./order-summary";
import VatField from "@/components/vat-field";
import { trackCheckoutStarted } from "@/lib/analytics";
import { EU_COUNTRIES, isEuCountryExceptGermany } from "@/lib/eu-vat";

// ─── Types ────────────────────────────────────────────────────────────────────

type DeliveryData = {
  name: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
};

type DeliveryErrors = Partial<DeliveryData>;

// ─── Constants ────────────────────────────────────────────────────────────────

const DELIVERY_COST = 0;

const COUNTRIES = [
  "Germany", "United Kingdom", "Netherlands", "Belgium", "France",
  "Italy", "Spain", "Sweden", "Poland", "Austria", "Switzerland",
  "United States", "Canada", "United Arab Emirates", "Saudi Arabia",
  "Nigeria", "South Africa", "Kenya", "Uganda", "Singapore",
  "China", "India", "Japan", "Australia",
];

function getVatMessage(country: string, vatValid: boolean): {
  text: string; variant: "green" | "amber" | "blue";
} | null {
  if (!country) return null;
  if (!EU_COUNTRIES.has(country)) {
    return { text: "VAT exempt export destination.", variant: "blue" };
  }
  if (country === "Germany") {
    return { text: "German VAT still applies.", variant: "amber" };
  }
  if (!vatValid) return null;
  return { text: "Valid EU VAT number — reverse charge applies.", variant: "green" };
}

const inputCls =
  "w-full rounded-[12px] border border-black/[0.08] bg-white px-4 py-3.5 text-[0.93rem] text-[var(--foreground)] outline-none placeholder:text-[var(--muted)] transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10";

const inputErrCls =
  "w-full rounded-[12px] border border-red-400 bg-red-50/50 px-4 py-3.5 text-[0.93rem] text-[var(--foreground)] outline-none placeholder:text-[var(--muted)] transition focus:border-red-500";

// ─── FET upsell ───────────────────────────────────────────────────────────────

const FET_PRODUCT = {
  product_name: "Fuel Echo Tech",
  sku:          "FET-001",
  unit_price:   249.00,
} as const;

function FetUpsellCard({
  added, qty, onAdd, onChangeQty, onRemove, onDismiss,
}: {
  added: boolean; qty: number;
  onAdd: () => void; onChangeQty: (q: number) => void;
  onRemove: () => void; onDismiss: () => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-[22px] border border-[#d1fae5] bg-[#f0fdf4]">
      <div className="absolute inset-y-0 left-0 w-1 bg-[#10b981]" aria-hidden="true" />
      <div className="px-4 py-4 pl-6 sm:px-5 sm:py-5 sm:pl-7 md:pl-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-[#dcfce7] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#166534]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" aria-hidden="true" />
              Add-on
            </span>
            <h3 className="text-[1rem] font-extrabold leading-snug text-[#111111]">
              Add Fuel Echo Tech to your order?
            </h3>
            <p className="mt-1.5 max-w-[460px] text-[0.85rem] leading-6 text-[#6b7280]">
              Improve fuel efficiency by up to 15% and protect your engine. Trusted by fleet operators across Europe.
            </p>
          </div>
          <div className="shrink-0 sm:text-right">
            <p className="text-[0.72rem] font-semibold uppercase tracking-wide text-[#9ca3af]">From</p>
            <p className="text-[1.4rem] font-extrabold leading-none text-[#10b981]">€249.00</p>
            <p className="mt-0.5 text-[0.72rem] text-[#9ca3af]">per unit</p>
          </div>
        </div>

        {!added ? (
          <div className="mt-4 flex w-full flex-col gap-2 sm:flex-row sm:items-center">
            <button type="button" onClick={onAdd}
              className="flex h-[44px] w-full items-center justify-center rounded-full bg-[#10b981] px-6 text-[0.88rem] font-semibold text-white transition hover:bg-[#0d9e6e] sm:w-auto">
              Add to Order
            </button>
            <button type="button" onClick={onDismiss}
              className="flex h-[44px] w-full items-center justify-center rounded-full px-4 text-[0.88rem] font-semibold text-[#6b7280] transition hover:text-[#111111] sm:w-auto">
              No thanks
            </button>
          </div>
        ) : (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-full bg-[#dcfce7] px-3 py-1.5">
              <CheckCircle2 size={14} className="shrink-0 text-[#22c55e]" />
              <span className="text-[0.82rem] font-semibold text-[#166534]">Added to order</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[0.82rem] font-semibold text-[#6b7280]" htmlFor="fet-qty">Qty:</label>
              <select id="fet-qty" value={qty} onChange={(e) => onChangeQty(Number(e.target.value))}
                className="rounded-[8px] border border-[#d1fae5] bg-white px-3 py-1.5 text-[0.88rem] font-semibold text-[#111111] outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981]/20">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <button type="button" onClick={onRemove}
              className="text-[0.82rem] font-semibold text-[#9ca3af] underline transition hover:text-[#111111]">
              Remove
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Field({ label, htmlFor, error, children }: {
  label: string; htmlFor?: string; error?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-[0.82rem] font-semibold text-[var(--foreground)]">
        {label}
      </label>
      {children}
      {error && (
        <p id={htmlFor ? `${htmlFor}-error` : undefined} role="alert" className="mt-0.5 text-[0.75rem] text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[18px] bg-[#efefef] p-4 sm:rounded-[22px] sm:p-6">
      <p className="mb-3.5 text-[0.95rem] font-extrabold text-[var(--foreground)] sm:mb-4 sm:text-[1rem]">{title}</p>
      {children}
    </div>
  );
}

// ─── Bank transfer success screen ────────────────────────────────────────────

function BankTransferSuccess({ orderRef }: { orderRef: string }) {
  return (
    <div className="tesla-shell py-10 md:py-16">
      <div className="mx-auto max-w-[640px]">
        <div className="mb-6 flex items-start gap-3 sm:gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-100 sm:h-12 sm:w-12">
            <CheckCircle2 size={22} strokeWidth={2} className="text-green-600 sm:hidden" />
            <CheckCircle2 size={24} strokeWidth={2} className="hidden text-green-600 sm:block" />
          </div>
          <div>
            <h1 className="text-[1.2rem] font-extrabold text-[var(--foreground)] sm:text-[1.35rem]">
              Order Placed Successfully
            </h1>
            <p className="mt-0.5 text-[0.85rem] text-[var(--muted)]">
              Transfer to the account below to confirm your order.
            </p>
          </div>
        </div>

        <BankTransferDetails orderRef={orderRef} />

        <p className="mt-4 text-[0.82rem] leading-6 text-[var(--muted)]">
          Please quote your order reference in the payment description. Your order will be
          processed once the transfer is received.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/account/orders"
            className="flex h-[44px] items-center justify-center rounded-full bg-[var(--primary)] px-6 text-[0.88rem] font-semibold text-white transition hover:bg-[var(--primary-hover)]"
          >
            View My Orders
          </Link>
          <Link
            href="/shop"
            className="flex h-[44px] items-center justify-center rounded-full border border-black/[0.08] bg-white px-6 text-[0.88rem] font-semibold text-[var(--foreground)] transition hover:bg-[#f0f0f0]"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── VAT status message ───────────────────────────────────────────────────────

function VatStatusMessage({ country, vatValid }: { country: string; vatValid: boolean }) {
  const msg = getVatMessage(country, vatValid);
  if (!msg) return null;
  const isGreen = msg.variant === "green";
  return (
    <div
      className={[
        "mt-3 flex items-start gap-2.5 rounded-[12px] border px-3.5 py-3 text-[0.83rem] font-medium",
        isGreen
          ? "border-green-200 bg-green-50 text-green-700"
          : msg.variant === "amber"
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : "border-blue-200 bg-blue-50 text-blue-700",
      ].join(" ")}
    >
      {isGreen
        ? <CheckCircle2 size={15} strokeWidth={2} className="mt-0.5 shrink-0" />
        : <Info size={15} strokeWidth={2} className="mt-0.5 shrink-0" />
      }
      <span>{msg.text}</span>
    </div>
  );
}

// ─── Empty cart ───────────────────────────────────────────────────────────────

function EmptyCartState() {
  const { t } = useLanguage();
  const c = t.checkout;
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4 py-16 text-center">
      <div>
        <p className="text-2xl font-extrabold text-[var(--foreground)]">{c.emptyTitle}</p>
        <p className="mt-2 text-[0.95rem] text-[var(--muted)]">{c.emptyBody}</p>
        <Link href="/shop"
          className="mt-5 inline-flex h-[46px] items-center gap-2 rounded-full bg-[var(--primary)] px-6 text-[0.9rem] font-semibold text-white transition hover:bg-[var(--primary-hover)]">
          {c.browseCatalogue} <ChevronRight size={16} />
        </Link>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function CheckoutFlow() {
  const { items, clearCart } = useCart();
  const { t }                = useLanguage();
  const { customer }         = useCustomerAuth();
  const showVatField         = customer?.customer_type === "b2b";
  const c                    = t.checkout;
  const deliveryRef          = useRef<HTMLDivElement>(null);
  const vatSectionRef        = useRef<HTMLDivElement>(null);

  const [delivery, setDelivery] = useState<DeliveryData>({
    name: "", email: "", address: "", city: "", postalCode: "", country: "", phone: "",
  });
  const [deliveryErrors, setDeliveryErrors] = useState<DeliveryErrors>({});
  const [vatNumber, setVatNumber]           = useState("");
  const [vatValid, setVatValid]             = useState(false);
  const [vatError, setVatError]             = useState<string | null>(null);

  // EU non-Germany B2B: VAT validation is mandatory.
  // Germany B2B: VAT optional (reverse charge does not apply — German VAT remains).
  // Non-EU B2B: VAT optional.
  const vatRequired = showVatField && isEuCountryExceptGermany(delivery.country);

  // Prefill delivery form from customer profile once loaded.
  // Only fills empty fields so user edits are never overwritten.
  useEffect(() => {
    if (!customer) return;
    setDelivery((prev) => ({
      ...prev,
      name:    prev.name    || `${customer.first_name ?? ""} ${customer.last_name ?? ""}`.trim(),
      email:   prev.email   || customer.email  || "",
      country: prev.country || customer.country || "",
      phone:   prev.phone   || customer.phone   || "",
    }));
  }, [customer]);

  const [submitting, setSubmitting]         = useState(false);
  const [submitError, setSubmitError]       = useState<string | null>(null);
  const [fetAdded, setFetAdded]         = useState(false);
  const [fetQty, setFetQty]             = useState(1);
  const [fetDismissed, setFetDismissed] = useState(false);

  type CartCampaign = { brand_name: string; discount_pct: number | null; promo_code?: string | null };
  const [cartCampaign, setCartCampaign] = useState<CartCampaign | null>(null);

  useEffect(() => {
    fetch("/api/promotions/active", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        type P = { brand_name?: string | null; brand?: string | null; discount_pct?: number | null; customer_type_target?: string | null; promo_code?: string | null; code?: string | null };
        const all: P[] = Array.isArray(json?.data) ? json.data : [];
        const campaign = all.find(
          (p) => (p.brand_name ?? p.brand) &&
            (!p.customer_type_target || p.customer_type_target === "b2c" || p.customer_type_target === "all")
        );
        const campaignBrand = campaign?.brand_name ?? campaign?.brand ?? null;
        if (campaignBrand) {
          setCartCampaign({
            brand_name:   campaignBrand,
            discount_pct: campaign?.discount_pct ?? null,
            promo_code:   campaign?.promo_code ?? campaign?.code ?? null,
          });
        }
      })
      .catch(() => {});
  }, []);

  const [promoInput, setPromoInput]             = useState("");
  const [appliedPromoCode, setAppliedPromoCode] = useState("");
  const [promoError, setPromoError]             = useState<string | null>(null);

  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "bank_transfer">("stripe");
  const [orderCreated, setOrderCreated]   = useState<{ ref: string } | null>(null);

  // Pre-fill promo input once when campaign loads and cart has matching brand
  useEffect(() => {
    if (!cartCampaign?.promo_code || promoInput || appliedPromoCode) return;
    const hasBrand = items.some(
      (item) => item.product.brand.toLowerCase().trim() === cartCampaign.brand_name.toLowerCase().trim()
    );
    if (hasBrand) setPromoInput(cartCampaign.promo_code!);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartCampaign]);

  // Stable object reference — recreated only when fetAdded/fetQty actually change.
  // Without useMemo, every CheckoutFlow render creates a new object, causing
  // OrderSummary's useEffect to cancel and restart its fetch continuously.
  const fetAddonProp = useMemo(
    () => fetAdded
      ? { name: FET_PRODUCT.product_name, unitPrice: FET_PRODUCT.unit_price, qty: fetQty }
      : null,
    [fetAdded, fetQty],
  );

  if (orderCreated) return <BankTransferSuccess orderRef={orderCreated.ref} />;

  if (items.length === 0) return <EmptyCartState />;

  // ── Validation ──────────────────────────────────────────────────────────────

  const validateDelivery = (): boolean => {
    const errs: DeliveryErrors = {};
    if (!delivery.name.trim())        errs.name       = c.errName;
    if (!delivery.email.trim())       errs.email      = c.errEmail;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(delivery.email)) errs.email = c.errEmailInvalid;
    if (!delivery.address.trim())     errs.address    = c.errAddress;
    if (!delivery.city.trim())        errs.city       = c.errCity;
    if (!delivery.postalCode.trim())  errs.postalCode = c.errPostalCode;
    if (!delivery.country)            errs.country    = c.errCountry;
    if (!delivery.phone.trim())       errs.phone      = c.errPhone;
    setDeliveryErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Order payload ───────────────────────────────────────────────────────────

  const orderPayload = () => ({
    delivery,
    payment_method: paymentMethod,
    vat_number: vatNumber.trim() || undefined,
    items: items.map((item) => ({
      product: {
        id:    item.product.id,
        sku:   item.product.sku   || `ITEM-${item.product.id}`,
        brand: item.product.brand || "N/A",
        name:  item.product.name,
        size:  item.product.size  || "N/A",
        price: item.product.price,
      },
      quantity: item.quantity,
    })),
    ...(fetAdded && {
      fet_addon: {
        product_name: FET_PRODUCT.product_name,
        sku:          FET_PRODUCT.sku,
        unit_price:   FET_PRODUCT.unit_price,
        quantity:     fetQty,
      },
    }),
    ...(appliedPromoCode ? { promo_code: appliedPromoCode, code: appliedPromoCode } : {}),
  });

  const handleSubmit = async () => {
    if (!validateDelivery()) {
      deliveryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    if (vatRequired && !vatValid) {
      setVatError("Please validate your VAT number before proceeding to payment.");
      vatSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    trackCheckoutStarted({
      value:     items.reduce((s, i) => s + i.product.price * i.quantity, 0),
      itemCount: items.reduce((s, i) => s + i.quantity, 0),
    });

    // ── Bank Transfer ────────────────────────────────────────────────────────
    if (paymentMethod === "bank_transfer") {
      try {
        const res = await fetch("/api/checkout/bank-transfer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderPayload()),
        });
        const data = await res.json();
        const orderData = (data?.data ?? {}) as Record<string, unknown>;
        const orderRef  = String(orderData.order_ref ?? orderData.ref ?? "");

        if (!res.ok || data.error) {
          setSubmitError(data.error ?? data.message ?? "Failed to place order. Please try again.");
          setSubmitting(false);
          return;
        }

        clearCart();
        setOrderCreated({ ref: orderRef || "—" });
      } catch {
        setSubmitError("Network error. Please check your connection and try again.");
        setSubmitting(false);
      }
      return;
    }

    // ── Stripe Checkout ──────────────────────────────────────────────────────
    try {
      const res = await fetch("/api/checkout/stripe-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload()),
      });
      const data = await res.json();
      const checkoutData    = data?.data ?? {};
      const checkoutUrl     = checkoutData.checkout_url;
      const checkoutSession = String(checkoutData.checkout_session_id ?? "");
      const orderRef        = String(checkoutData.order_ref ?? "");

      if (!res.ok || data.error || typeof checkoutUrl !== "string") {
        setSubmitError(data.error ?? data.message ?? "Failed to start Stripe Checkout. Please try again.");
        setSubmitting(false);
        return;
      }

      // Always write both keys before redirect so the return page can read
      // them via sessionStorage when order_ref is absent from the Stripe URL.
      sessionStorage.setItem("stripe_checkout_session_id", checkoutSession);
      sessionStorage.setItem("stripe_order_ref", orderRef);

      clearCart();

      window.location.href = checkoutUrl;
    } catch {
      setSubmitError("Network error. Please check your connection and try again.");
      setSubmitting(false);
    }
  };

  // ── Field helpers ───────────────────────────────────────────────────────────

  const set = (key: keyof DeliveryData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setDelivery((prev) => ({ ...prev, [key]: e.target.value }));
      setDeliveryErrors((prev) => ({ ...prev, [key]: undefined }));
    };

  const ic = (key: keyof DeliveryData) => deliveryErrors[key] ? inputErrCls : inputCls;

  const handleApplyPromo = () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    setPromoError(null);
    setAppliedPromoCode(code);
  };

  const handleRemovePromo = () => {
    setAppliedPromoCode("");
    setPromoInput("");
    setPromoError(null);
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="tesla-shell py-6 md:py-10">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1.5 text-[0.82rem] text-[var(--muted)]">
        <Link href="/" className="transition hover:text-[var(--foreground)]">{c.breadcrumbHome}</Link>
        <ChevronRight size={13} className="opacity-50" />
        <Link href="/shop" className="transition hover:text-[var(--foreground)]">{c.breadcrumbShop}</Link>
        <ChevronRight size={13} className="opacity-50" />
        <span className="font-medium text-[var(--foreground)]">{c.breadcrumbCheckout}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:items-start xl:grid-cols-[1fr_440px]">

        {/* ── Left column ── */}
        <div className="flex flex-col gap-5">

          {/* Delivery details */}
          <div ref={deliveryRef}>
            <SectionCard title={c.sectionDelivery}>
              <div className="flex flex-col gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={c.labelName} htmlFor="checkout-name" error={deliveryErrors.name}>
                    <input id="checkout-name" type="text" placeholder={c.placeholderName} value={delivery.name} onChange={set("name")} aria-invalid={!!deliveryErrors.name} className={ic("name")} />
                  </Field>
                  <Field label={c.labelEmail} htmlFor="checkout-email" error={deliveryErrors.email}>
                    <input id="checkout-email" type="email" placeholder={c.placeholderEmail} value={delivery.email} onChange={set("email")} aria-invalid={!!deliveryErrors.email} className={ic("email")} />
                  </Field>
                </div>

                <Field label={c.labelAddress} htmlFor="checkout-address" error={deliveryErrors.address}>
                  <input id="checkout-address" type="text" placeholder={c.placeholderAddress} value={delivery.address} onChange={set("address")} aria-invalid={!!deliveryErrors.address} className={ic("address")} />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={c.labelCity} htmlFor="checkout-city" error={deliveryErrors.city}>
                    <input id="checkout-city" type="text" placeholder={c.placeholderCity} value={delivery.city} onChange={set("city")} aria-invalid={!!deliveryErrors.city} className={ic("city")} />
                  </Field>
                  <Field label={c.labelPostalCode} htmlFor="checkout-postalCode" error={deliveryErrors.postalCode}>
                    <input id="checkout-postalCode" type="text" placeholder={c.placeholderPostalCode} value={delivery.postalCode} onChange={set("postalCode")} aria-invalid={!!deliveryErrors.postalCode} className={ic("postalCode")} />
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={c.labelCountry} htmlFor="checkout-country" error={deliveryErrors.country}>
                    <select id="checkout-country" value={delivery.country} onChange={set("country")} aria-invalid={!!deliveryErrors.country} className={ic("country")}>
                      <option value="">{c.placeholderCountry}</option>
                      {COUNTRIES.map((ctry) => <option key={ctry} value={ctry}>{ctry}</option>)}
                    </select>
                  </Field>
                  <Field label={c.labelPhone} htmlFor="checkout-phone" error={deliveryErrors.phone}>
                    <input id="checkout-phone" type="tel" placeholder={c.placeholderPhone} value={delivery.phone} onChange={set("phone")} aria-invalid={!!deliveryErrors.phone} className={ic("phone")} />
                  </Field>
                </div>
              </div>
            </SectionCard>
          </div>

          {/* VAT — b2b only */}
          {showVatField && (
            <div ref={vatSectionRef}>
              <SectionCard title="Business Details">
                <VatField
                  value={vatNumber}
                  onChange={setVatNumber}
                  required={vatRequired}
                  onValidationChange={(valid) => {
                    setVatValid(valid);
                    if (valid) setVatError(null);
                  }}
                />
                {vatRequired && (
                  <p className="mt-2 flex items-start gap-1.5 text-[0.78rem] text-[var(--muted)]">
                    <Info size={13} strokeWidth={2} className="mt-0.5 shrink-0" />
                    Required for EU intra-community business purchases.
                  </p>
                )}
                {vatRequired && vatError && (
                  <p role="alert" className="mt-2 text-[0.75rem] text-red-500">{vatError}</p>
                )}
                <VatStatusMessage country={delivery.country} vatValid={vatValid} />
              </SectionCard>
            </div>
          )}

          {/* Delivery method */}
          <SectionCard title={c.sectionDeliveryMethod}>
            <div className="flex items-center justify-between rounded-[14px] border-2 border-[var(--primary)] bg-white p-4">
              <div>
                <p className="text-[0.9rem] font-semibold text-[var(--foreground)]">{c.shippingName}</p>
                <p className="mt-0.5 text-[0.82rem] text-[var(--muted)]">{c.shippingDetail}</p>
              </div>
              <p className="text-[0.95rem] font-extrabold text-[var(--primary)]">{c.shippingFree}</p>
            </div>
          </SectionCard>

          {/* FET upsell */}
          {!fetDismissed && (
            <FetUpsellCard
              added={fetAdded}
              qty={fetQty}
              onAdd={() => setFetAdded(true)}
              onChangeQty={setFetQty}
              onRemove={() => setFetAdded(false)}
              onDismiss={() => { setFetDismissed(true); setFetAdded(false); }}
            />
          )}

          {/* Campaign reminder — B2C/guest only, when cart has matching brand */}
          {!showVatField && cartCampaign && items.some((item) =>
            item.product.brand.toLowerCase().trim() === cartCampaign.brand_name.toLowerCase().trim()
          ) && (
            <div className="flex items-start gap-3 rounded-[14px] border border-[#f4511e]/20 bg-[#fff8f6] px-4 py-3.5">
              <Tag size={14} strokeWidth={1.8} className="mt-0.5 shrink-0 text-[#f4511e]" />
              {appliedPromoCode && cartCampaign.promo_code && appliedPromoCode === cartCampaign.promo_code ? (
                <p className="text-[0.85rem] font-semibold text-green-700">
                  {appliedPromoCode} applied
                  {cartCampaign.discount_pct != null && ` — ${cartCampaign.discount_pct}% off`} on {cartCampaign.brand_name} tyres.
                </p>
              ) : cartCampaign.promo_code ? (
                <p className="text-[0.85rem] leading-relaxed text-[#171a20]">
                  Use code{" "}
                  <span className="font-mono font-extrabold tracking-wider">{cartCampaign.promo_code}</span>
                  {cartCampaign.discount_pct != null && ` for ${cartCampaign.discount_pct}% off`} {cartCampaign.brand_name} tyres.
                </p>
              ) : (
                <p className="text-[0.85rem] leading-relaxed text-[#171a20]">
                  <span className="font-semibold">{cartCampaign.brand_name} campaign</span>
                  {cartCampaign.discount_pct != null && ` — ${cartCampaign.discount_pct}% discount`} applies at checkout.
                </p>
              )}
            </div>
          )}

          {/* Payment Method */}
          <SectionCard title="Payment Method">
            <div className="grid gap-3 sm:grid-cols-2">
              {/* Stripe option */}
              <button
                type="button"
                onClick={() => setPaymentMethod("stripe")}
                className={[
                  "flex items-start gap-3 rounded-[14px] border-2 p-4 text-left transition",
                  paymentMethod === "stripe"
                    ? "border-[var(--primary)] bg-white"
                    : "border-black/[0.08] bg-white hover:border-black/[0.14]",
                ].join(" ")}
              >
                <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${paymentMethod === "stripe" ? "bg-[#f4511e]/10" : "bg-black/[0.05]"}`}>
                  <CreditCard size={15} strokeWidth={1.9} className={paymentMethod === "stripe" ? "text-[var(--primary)]" : "text-[var(--muted)]"} />
                </div>
                <div>
                  <p className="text-[0.88rem] font-semibold text-[var(--foreground)]">Pay by Card</p>
                  <p className="mt-0.5 text-[0.76rem] text-[var(--muted)]">Stripe — Visa, Mastercard &amp; more</p>
                </div>
              </button>

              {/* Bank Transfer option */}
              <button
                type="button"
                onClick={() => setPaymentMethod("bank_transfer")}
                className={[
                  "flex items-start gap-3 rounded-[14px] border-2 p-4 text-left transition",
                  paymentMethod === "bank_transfer"
                    ? "border-[var(--primary)] bg-white"
                    : "border-black/[0.08] bg-white hover:border-black/[0.14]",
                ].join(" ")}
              >
                <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${paymentMethod === "bank_transfer" ? "bg-[#f4511e]/10" : "bg-black/[0.05]"}`}>
                  <Landmark size={15} strokeWidth={1.9} className={paymentMethod === "bank_transfer" ? "text-[var(--primary)]" : "text-[var(--muted)]"} />
                </div>
                <div>
                  <p className="text-[0.88rem] font-semibold text-[var(--foreground)]">Direct Bank Transfer</p>
                  <p className="mt-0.5 text-[0.76rem] text-[var(--muted)]">CIF · 50% on confirmation, balance on B/L</p>
                </div>
              </button>
            </div>

            {/* Stripe trust badges */}
            {paymentMethod === "stripe" && (
              <div className="mt-4 flex flex-wrap items-center gap-4 text-[0.75rem] text-[#5c5e62]">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-green-500" />
                  256-bit SSL encryption
                </span>
                <span className="flex items-center gap-1.5">
                  <Lock size={14} className="text-green-500" />
                  PCI DSS compliant via Stripe
                </span>
              </div>
            )}

            {/* Bank details preview */}
            {paymentMethod === "bank_transfer" && (
              <div className="mt-4">
                <BankTransferDetails />
              </div>
            )}
          </SectionCard>

          {/* Error */}
          {submitError && (
            <div className="rounded-[12px] border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-[0.83rem] font-semibold text-red-700">{submitError}</p>
            </div>
          )}

          {/* Pay button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex h-[50px] w-full items-center justify-center gap-2.5 rounded-full bg-[var(--primary)] text-[0.95rem] font-semibold text-white transition hover:bg-[var(--primary-hover)] disabled:opacity-60 sm:h-[54px] sm:text-[1rem]"
          >
            {submitting ? (
              <>
                <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                {paymentMethod === "bank_transfer" ? "Placing order…" : "Redirecting to payment…"}
              </>
            ) : paymentMethod === "bank_transfer" ? (
              <>
                <Landmark size={17} strokeWidth={2.2} />
                Place Order · Bank Transfer
              </>
            ) : (
              <>
                <Lock size={17} strokeWidth={2.2} />
                Pay securely with Stripe
              </>
            )}
          </button>

          <p className="text-center text-[0.78rem] text-[var(--muted)]">
            {c.placeOrderNote}{" "}
            <Link href="/terms" className="underline hover:text-[var(--foreground)]">{c.termsLabel}</Link>{" "}
            {c.placeOrderNoteAnd}{" "}
            <Link href="/contact" className="underline hover:text-[var(--foreground)]">{c.returnPolicyLabel}</Link>.
          </p>
        </div>

        {/* ── Right column ── */}
        <div className="flex flex-col gap-4 lg:sticky lg:top-[96px]">
          <OrderSummary
            deliveryCost={DELIVERY_COST}
            fetAddon={fetAddonProp}
            country={delivery.country}
            vatNumber={vatNumber}
            vatValid={vatValid}
            customerType={customer?.customer_type}
            promoCode={appliedPromoCode}
            onPromoError={setPromoError}
          />

          {/* Promo code input */}
          <div className="overflow-hidden rounded-[18px] bg-[#efefef] px-4 py-4 sm:rounded-[22px] sm:px-5">
            <p className="mb-3 text-[0.85rem] font-semibold text-[var(--foreground)]">Promo code</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={promoInput}
                onChange={(e) => {
                  setPromoInput(e.target.value.toUpperCase());
                  if (promoError) setPromoError(null);
                }}
                onKeyDown={(e) => { if (e.key === "Enter" && !appliedPromoCode) handleApplyPromo(); }}
                placeholder="e.g. RAPID5"
                disabled={!!appliedPromoCode}
                className="h-[44px] flex-1 rounded-full border border-black/[0.08] bg-white px-4 font-mono text-[0.88rem] font-bold uppercase tracking-widest text-[var(--foreground)] outline-none placeholder:font-sans placeholder:normal-case placeholder:tracking-normal placeholder:text-[var(--muted)] transition focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]/10 disabled:cursor-not-allowed disabled:opacity-60"
              />
              {appliedPromoCode ? (
                <button
                  type="button"
                  onClick={handleRemovePromo}
                  className="flex h-[44px] shrink-0 items-center rounded-full border border-black/[0.08] bg-white px-4 text-[0.82rem] font-semibold text-[var(--foreground)] transition hover:bg-[#f0f0f0]"
                >
                  Remove
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleApplyPromo}
                  disabled={!promoInput.trim()}
                  className="flex h-[44px] shrink-0 items-center rounded-full bg-[var(--primary)] px-5 text-[0.82rem] font-semibold text-white transition hover:bg-[var(--primary-hover)] disabled:opacity-40"
                >
                  Apply
                </button>
              )}
            </div>
            {appliedPromoCode && !promoError && (
              <p className="mt-2 flex items-center gap-1.5 text-[0.78rem] font-semibold text-green-600">
                <CheckCircle2 size={12} strokeWidth={2.2} /> {appliedPromoCode} applied
              </p>
            )}
            {promoError && (
              <p role="alert" className="mt-2 text-[0.78rem] text-red-500">{promoError}</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
