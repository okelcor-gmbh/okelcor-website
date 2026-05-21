import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, Package, MapPin, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { getCustomerFromCookie } from "@/lib/get-customer";
import { formatDate, type Order } from "../../page";

// ─── Types ────────────────────────────────────────────────────────────────────

type TrackingEvent = {
  id?: number;
  event_date?: string | null;
  status_label: string;
  location?: string | null;
  description?: string | null;
};

type TrackingData = {
  status?: string | null;
  estimated_delivery?: string | null;
  events?: TrackingEvent[];
};

type TrackState =
  | { kind: "no_tracking" }
  | { kind: "not_active"; identifier: string }
  | { kind: "rate_limited" }
  | { kind: "error" }
  | { kind: "ok"; data: TrackingData };

// ─── Data fetching ─────────────────────────────────────────────────────────────

async function fetchOrder(ref: string, token: string): Promise<Order | null> {
  const API_URL =
    process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:8000/api/v1";
  try {
    const res = await fetch(`${API_URL}/auth/orders/${ref}`, {
      cache: "no-store",
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? null;
  } catch {
    return null;
  }
}

async function fetchTracking(identifier: string): Promise<TrackState> {
  const API_URL =
    process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:8000/api/v1";
  try {
    const res = await fetch(`${API_URL}/tracking/${encodeURIComponent(identifier)}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (res.status === 404) return { kind: "not_active", identifier };
    if (res.status === 429) return { kind: "rate_limited" };
    if (!res.ok) return { kind: "error" };
    const json = await res.json();
    return { kind: "ok", data: json.data ?? json };
  } catch {
    return { kind: "error" };
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TrackingContent({ state }: { state: TrackState }) {
  if (state.kind === "no_tracking") {
    return (
      <div className="flex items-start gap-3.5 rounded-[18px] bg-[#efefef] p-5 sm:rounded-[22px] sm:p-6">
        <Package
          size={20}
          strokeWidth={1.7}
          className="mt-0.5 shrink-0 text-[var(--muted)]"
        />
        <div>
          <p className="text-[0.9rem] font-semibold text-[var(--foreground)]">
            Tracking available once your order ships
          </p>
          <p className="mt-1 text-[0.83rem] text-[var(--muted)]">
            Okelcor will update your shipment details when your order is dispatched.
          </p>
        </div>
      </div>
    );
  }

  if (state.kind === "not_active") {
    return (
      <div className="flex items-start gap-3.5 rounded-[18px] bg-[#efefef] p-5 sm:rounded-[22px] sm:p-6">
        <Clock
          size={20}
          strokeWidth={1.7}
          className="mt-0.5 shrink-0 text-[var(--muted)]"
        />
        <div>
          <p className="text-[0.9rem] font-semibold text-[var(--foreground)]">
            Carrier tracking not yet active
          </p>
          <p className="mt-1 text-[0.83rem] text-[var(--muted)]">
            Your shipment reference{" "}
            <span className="font-mono font-semibold text-[var(--foreground)]">
              {state.identifier}
            </span>{" "}
            has been registered but the carrier has not yet updated its tracking
            system. Please check back in a few hours.
          </p>
        </div>
      </div>
    );
  }

  if (state.kind === "rate_limited") {
    return (
      <div className="flex items-start gap-3.5 rounded-[18px] border border-amber-200 bg-amber-50 p-5 sm:rounded-[22px] sm:p-6">
        <AlertCircle
          size={20}
          strokeWidth={1.7}
          className="mt-0.5 shrink-0 text-amber-600"
        />
        <div>
          <p className="text-[0.9rem] font-semibold text-amber-800">
            Too many requests
          </p>
          <p className="mt-1 text-[0.83rem] text-amber-700">
            Tracking is temporarily unavailable due to rate limiting. Please
            wait a moment and refresh the page.
          </p>
        </div>
      </div>
    );
  }

  if (state.kind === "error") {
    return (
      <div className="flex items-start gap-3.5 rounded-[18px] bg-[#efefef] p-5 sm:rounded-[22px] sm:p-6">
        <AlertCircle
          size={20}
          strokeWidth={1.7}
          className="mt-0.5 shrink-0 text-[var(--muted)]"
        />
        <p className="text-[0.85rem] text-[var(--muted)]">
          Tracking information is temporarily unavailable. Please try again
          shortly.
        </p>
      </div>
    );
  }

  // kind === "ok"
  const { data } = state;
  const events = data.events ?? [];
  const sorted = [...events].sort((a, b) =>
    (a.event_date ?? "").localeCompare(b.event_date ?? "")
  );

  if (sorted.length === 0) {
    return (
      <div className="flex items-start gap-3.5 rounded-[18px] bg-[#efefef] p-5 sm:rounded-[22px] sm:p-6">
        <Package
          size={20}
          strokeWidth={1.7}
          className="mt-0.5 shrink-0 text-[var(--muted)]"
        />
        <p className="text-[0.85rem] text-[var(--muted)]">
          No tracking events recorded yet. Check back once your shipment is in
          transit.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[18px] bg-[#efefef] sm:rounded-[22px]">
      {/* Header */}
      <div className="border-b border-black/[0.06] px-5 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-wrap items-center gap-2.5">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--primary)] sm:text-[11px]">
            Tracking Events
          </p>
          {data.status && (
            <span className="rounded-full bg-[var(--primary)]/10 px-3 py-1 text-[0.76rem] font-semibold text-[var(--primary)]">
              {data.status}
            </span>
          )}
        </div>
        {data.estimated_delivery && (
          <p className="mt-1.5 text-[0.82rem] text-[var(--muted)]">
            Est. delivery:{" "}
            <span className="font-semibold text-[var(--foreground)]">
              {formatDate(data.estimated_delivery)}
            </span>
          </p>
        )}
      </div>

      {/* Timeline */}
      <ol className="flex flex-col">
        {sorted.map((ev, i) => {
          const isLatest = i === sorted.length - 1;
          return (
            <li
              key={ev.id ?? i}
              className={`flex items-start gap-3.5 px-5 py-4 sm:px-6 sm:py-5 ${
                i > 0 ? "border-t border-black/[0.05]" : ""
              }`}
            >
              {/* Dot + vertical connector */}
              <div className="flex shrink-0 flex-col items-center self-stretch">
                <span
                  className={`mt-[5px] h-3 w-3 rounded-full border-2 ${
                    isLatest
                      ? "border-[var(--primary)] bg-[var(--primary)]"
                      : "border-black/20 bg-black/10"
                  }`}
                />
                {!isLatest && (
                  <div className="mt-1.5 w-[2px] flex-1 bg-black/[0.08]" />
                )}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1 pb-1">
                <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
                  <span
                    className={`text-[0.87rem] font-bold ${
                      isLatest
                        ? "text-[var(--primary)]"
                        : "text-[var(--foreground)]"
                    }`}
                  >
                    {ev.status_label}
                  </span>
                  {ev.event_date && (
                    <span className="text-[0.76rem] text-[var(--muted)]">
                      {formatDate(ev.event_date)}
                    </span>
                  )}
                </div>
                {ev.location && (
                  <div className="mt-1 flex items-center gap-1.5">
                    <MapPin
                      size={12}
                      strokeWidth={1.8}
                      className="shrink-0 text-[var(--muted)]"
                    />
                    <span className="text-[0.79rem] text-[var(--muted)]">
                      {ev.location}
                    </span>
                  </div>
                )}
                {ev.description && (
                  <p className="mt-1 text-[0.82rem] text-[var(--muted)]">
                    {ev.description}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Props = { params: Promise<{ ref: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ref } = await params;
  return { title: `Track Order ${ref}` };
}

export default async function TrackPage({ params }: Props) {
  const { ref } = await params;
  const customer = await getCustomerFromCookie();
  if (!customer) redirect(`/login?redirect=/account/orders/${ref}/track`);

  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const token = cookieStore.get("customer_token")?.value;
  if (!token) redirect(`/login?redirect=/account/orders/${ref}/track`);

  const order = await fetchOrder(ref, token);
  if (!order) notFound();

  const identifier = order.tracking_number ?? order.container_number ?? null;
  const trackState: TrackState = identifier
    ? await fetchTracking(identifier)
    : { kind: "no_tracking" };

  return (
    <main className="min-h-screen bg-[#f5f5f5]">
      <Navbar />

      <div className="tesla-shell pb-16 pt-[88px] sm:pt-[96px]">

        {/* Breadcrumb */}
        <nav className="mb-4 flex items-center gap-1.5 text-[0.8rem] text-[var(--muted)] sm:mb-6 sm:text-[0.82rem]">
          <Link href="/" className="transition hover:text-[var(--foreground)]">
            Home
          </Link>
          <span className="opacity-40">/</span>
          <Link
            href="/account/orders"
            className="transition hover:text-[var(--foreground)]"
          >
            My Orders
          </Link>
          <span className="opacity-40">/</span>
          <Link
            href={`/account/orders/${ref}`}
            className="transition hover:text-[var(--foreground)]"
          >
            {ref}
          </Link>
          <span className="opacity-40">/</span>
          <span className="font-medium text-[var(--foreground)]">Track</span>
        </nav>

        {/* Back button */}
        <Link
          href={`/account/orders/${ref}`}
          className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-black/[0.08] bg-white px-4 py-2 text-[0.82rem] font-semibold text-[var(--foreground)] transition hover:bg-[#f0f0f0] sm:mb-6 sm:text-[0.85rem]"
        >
          <ChevronLeft size={15} strokeWidth={2.2} /> Order Details
        </Link>

        <div className="flex flex-col gap-4 sm:gap-5">

          {/* Order / tracking header */}
          <div className="rounded-[18px] bg-[#efefef] p-4 sm:rounded-[22px] sm:p-6 lg:p-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--primary)] sm:text-[11px]">
              Shipment Tracking
            </p>
            <p className="mt-1 font-mono text-[1.1rem] font-extrabold tracking-wide text-[var(--foreground)] sm:text-[1.25rem]">
              {ref}
            </p>
            {identifier && (
              <p className="mt-1 text-[0.8rem] text-[var(--muted)] sm:text-[0.85rem]">
                Reference:{" "}
                <span className="font-mono font-semibold text-[var(--foreground)]">
                  {identifier}
                </span>
              </p>
            )}
          </div>

          {/* Delivered confirmation banner */}
          {order.status === "delivered" && (
            <div className="flex items-start gap-3.5 rounded-[18px] border border-green-200 bg-green-50 px-5 py-4 sm:rounded-[22px] sm:px-6 sm:py-5">
              <CheckCircle2
                size={22}
                strokeWidth={1.8}
                className="mt-0.5 shrink-0 text-green-600"
              />
              <div>
                <p className="text-[0.9rem] font-bold text-green-800">
                  Your order has been delivered.
                </p>
                <p className="mt-0.5 text-[0.82rem] text-green-700">
                  If you have any issues with your delivery, please contact Okelcor support.
                </p>
              </div>
            </div>
          )}

          {/* Tracking content */}
          <TrackingContent state={trackState} />

        </div>
      </div>

      <Footer />
    </main>
  );
}
