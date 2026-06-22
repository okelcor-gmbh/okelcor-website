"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { trackEvent } from "@/lib/analytics";
import { checkInquiryQuality } from "@/lib/inquiry-quality";
import { COUNTRIES } from "@/lib/countries";

// ── Field options ───────────────────────────────────────────────────────────────

const INTEREST_OPTIONS = [
  { value: "PCR", label: "PCR (Passenger Car)" },
  { value: "TBR", label: "TBR (Truck & Bus)" },
  { value: "OTR", label: "OTR (Off-the-Road)" },
  { value: "Value", label: "Budget / Value Brands" },
  { value: "Mixed", label: "Mixed" },
] as const;

const VOLUME_OPTIONS = [
  { value: "less-than-1", label: "Less than 1 Container" },
  { value: "1-to-5", label: "1 - 5 Containers" },
  { value: "5-plus", label: "5+ Containers" },
] as const;

// ── Attribution capture ─────────────────────────────────────────────────────────

type Attribution = Record<string, string>;

const UTM_KEYS = [
  "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
  "gclid", "fbclid",
];

function captureAttribution(): Attribution {
  const attr: Attribution = { landing_page: "/tyre-wholesaler" };
  if (typeof window === "undefined") return attr;
  const params = new URLSearchParams(window.location.search);
  for (const key of UTM_KEYS) {
    const v = params.get(key);
    if (v) attr[key] = v;
  }
  if (document.referrer) attr.referrer = document.referrer;
  return attr;
}

// ── Styles ──────────────────────────────────────────────────────────────────────

const FIELD =
  "w-full rounded-lg border border-black/[0.12] bg-white px-4 py-3 text-[0.95rem] text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15";
const FIELD_ERR =
  "w-full rounded-lg border border-red-400 bg-red-50/40 px-4 py-3 text-[0.95rem] text-[var(--foreground)] outline-none transition focus:border-red-500";
const LABEL = "mb-2 block text-[0.85rem] font-medium text-[var(--foreground)]";

// ── Types ───────────────────────────────────────────────────────────────────────

type Form = {
  name: string;
  company: string;
  email: string;
  country: string;
  interest: string;
  volume: string;
  notes: string;
};

type Errors = Partial<Record<keyof Form, string>>;

const EMPTY: Form = {
  name: "", company: "", email: "", country: "", interest: "", volume: "", notes: "",
};

export default function WholesalerLeadForm() {
  const router = useRouter();
  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const attribution = useRef<Attribution>({ landing_page: "/tyre-wholesaler" });

  useEffect(() => {
    attribution.current = captureAttribution();
  }, []);

  const set =
    (key: keyof Form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
      if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
    };

  const cls = (key: keyof Form) => (errors[key] ? FIELD_ERR : FIELD);

  const validate = (): Errors => {
    const errs: Errors = {};
    if (!form.name.trim()) errs.name = "Please enter your full name.";
    if (!form.company.trim()) errs.company = "Please enter your company name.";
    if (!form.email.trim()) errs.email = "Please enter your email address.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Please enter a valid email address.";
    if (!form.country) errs.country = "Please select your country.";
    if (!form.interest) errs.interest = "Please select your primary tyre interest.";
    if (!form.notes.trim()) errs.notes = "Please describe your requirements.";
    else {
      // CRM-2: client-side inquiry quality check (mirrors the backend filter).
      const quality = checkInquiryQuality(form.notes);
      if (quality.blocked) errs.notes = quality.reason ?? "Please provide a clear business inquiry.";
    }
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      const first = (Object.keys(errs) as (keyof Form)[])[0];
      document.getElementById(`wf-${first}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    trackEvent("tyre_wholesaler_quote_submit_attempt", { primary_tyre_interest: form.interest });

    try {
      // Dedicated CRM endpoint — wants raw interest/volume + flat attribution.
      // The backend maps these into the quote-request / lead pipeline (lead_source,
      // lead_metadata) and runs CRM-2 quality filtering server-side.
      const res = await fetch("/api/leads/tyre-wholesaler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          company: form.company,
          email: form.email,
          country: form.country,
          interest: form.interest,
          volume: form.volume || undefined,
          notes: form.notes,
          // Flat attribution → backend folds these into lead_metadata.
          ...attribution.current,
        }),
      });

      const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;

      if (!res.ok) {
        // CRM-2: backend rejected a low-quality inquiry — surface on the notes field.
        if (json.code === "low_quality_inquiry") {
          const reason =
            (json.message as string) ??
            "Please provide a clear business inquiry with tyre type, quantity, and destination.";
          setErrors((prev) => ({ ...prev, notes: reason }));
          document.getElementById("wf-notes")?.scrollIntoView({ behavior: "smooth", block: "center" });
          trackEvent("tyre_wholesaler_quote_submit_error", { reason: "low_quality_inquiry" });
          return;
        }
        throw new Error((json.message as string) || "Something went wrong. Please try again.");
      }

      trackEvent("tyre_wholesaler_quote_submit_success", {
        primary_tyre_interest: form.interest,
        estimated_monthly_volume: form.volume || undefined,
        country: form.country,
      });
      router.push("/tyre-wholesaler/thank-you");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setSubmitError(message);
      trackEvent("tyre_wholesaler_quote_submit_error", { reason: "request_failed" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-xl">
      <div className="p-7 md:p-10">
        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          {/* Name + Company */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div id="wf-name">
              <label htmlFor="name" className={LABEL}>Full Name</label>
              <input id="name" name="name" type="text" value={form.name} onChange={set("name")}
                aria-invalid={!!errors.name} className={cls("name")} />
              {errors.name && <p role="alert" className="mt-1 text-[0.78rem] text-red-500">{errors.name}</p>}
            </div>
            <div id="wf-company">
              <label htmlFor="company" className={LABEL}>Company Name</label>
              <input id="company" name="company" type="text" value={form.company} onChange={set("company")}
                aria-invalid={!!errors.company} className={cls("company")} />
              {errors.company && <p role="alert" className="mt-1 text-[0.78rem] text-red-500">{errors.company}</p>}
            </div>
          </div>

          {/* Email + Country */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div id="wf-email">
              <label htmlFor="email" className={LABEL}>Email Address</label>
              <input id="email" name="email" type="email" value={form.email} onChange={set("email")}
                aria-invalid={!!errors.email} className={cls("email")} />
              {errors.email && <p role="alert" className="mt-1 text-[0.78rem] text-red-500">{errors.email}</p>}
            </div>
            <div id="wf-country">
              <label htmlFor="country" className={LABEL}>Country</label>
              <select id="country" name="country" value={form.country} onChange={set("country")}
                aria-invalid={!!errors.country} className={`${cls("country")} bg-white`}>
                <option value="" disabled>Select country…</option>
                {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.country && <p role="alert" className="mt-1 text-[0.78rem] text-red-500">{errors.country}</p>}
            </div>
          </div>

          {/* Interest + Volume */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div id="wf-interest">
              <label htmlFor="interest" className={LABEL}>Primary Tyre Interest</label>
              <select id="interest" name="interest" value={form.interest} onChange={set("interest")}
                aria-invalid={!!errors.interest} className={`${cls("interest")} bg-white`}>
                <option value="" disabled>Select category…</option>
                {INTEREST_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              {errors.interest && <p role="alert" className="mt-1 text-[0.78rem] text-red-500">{errors.interest}</p>}
            </div>
            <div id="wf-volume">
              <label htmlFor="volume" className={LABEL}>Estimated Monthly Volume</label>
              <select id="volume" name="volume" value={form.volume} onChange={set("volume")} className={`${FIELD} bg-white`}>
                <option value="">Select volume…</option>
                {VOLUME_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div id="wf-notes">
            <label htmlFor="quote-notes" className={LABEL}>Quote Notes</label>
            <textarea id="quote-notes" name="notes" rows={5} value={form.notes} onChange={set("notes")}
              placeholder="Describe your requirements in detail — tyre specs, intended use, volume, any other relevant information…"
              aria-invalid={!!errors.notes} className={`${cls("notes")} resize-none`} />
            {errors.notes && <p role="alert" className="mt-1 text-[0.78rem] text-red-500">{errors.notes}</p>}
          </div>

          {submitError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[0.88rem] text-red-700">
              {submitError}
            </div>
          )}

          <button type="submit" disabled={submitting}
            className="flex h-[54px] w-full items-center justify-center rounded-lg bg-[var(--primary)] text-[1rem] font-bold text-white shadow-lg transition-colors hover:bg-[var(--primary-hover)] disabled:opacity-60">
            {submitting ? (
              <span className="flex items-center gap-2.5">
                <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Sending Inquiry…
              </span>
            ) : "Submit Wholesale Inquiry"}
          </button>
        </form>
      </div>
    </div>
  );
}
