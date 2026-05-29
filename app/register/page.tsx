"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, CheckCircle2, XCircle, AlertTriangle, Loader2, Clock, Building2 } from "lucide-react";
import Navbar from "@/components/navbar";
import { registerCustomer } from "@/lib/customer-auth";

// ─── Input styles ─────────────────────────────────────────────────────────────

const inputCls =
  "w-full rounded-[12px] border border-black/[0.08] bg-white px-4 py-3 text-[0.93rem] text-[var(--foreground)] outline-none placeholder:text-[var(--muted)] transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10";

const inputErrCls =
  "w-full rounded-[12px] border border-red-400 bg-red-50/50 px-4 py-3 text-[0.93rem] text-[var(--foreground)] outline-none placeholder:text-[var(--muted)] transition";

const selectCls =
  "w-full rounded-[12px] border border-black/[0.08] bg-white px-4 py-3 text-[0.93rem] text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10 appearance-none";

// ─── Countries ────────────────────────────────────────────────────────────────

const COUNTRIES = [
  "Germany", "United Kingdom", "France", "Netherlands", "Belgium", "Austria",
  "Switzerland", "Poland", "Czech Republic", "Hungary", "Romania", "Bulgaria",
  "Spain", "Portugal", "Italy", "Greece", "Turkey", "Ukraine", "Russia",
  "United Arab Emirates", "Saudi Arabia", "Qatar", "Kuwait", "Bahrain", "Oman",
  "Nigeria", "Ghana", "Kenya", "South Africa", "Egypt", "Morocco", "Algeria",
  "United States", "Canada", "Australia", "Other",
];

const INDUSTRIES = [
  "Fleet Operator",
  "Tyre Distributor",
  "Garage / Workshop",
  "Construction",
  "Agriculture",
  "Other",
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function PasswordInput({
  id,
  placeholder,
  value,
  onChange,
  error,
}: {
  id?: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          aria-invalid={!!error}
          className={`${error ? inputErrCls : inputCls} pr-11`}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] transition hover:text-[var(--foreground)]"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
      {error && <p role="alert" className="mt-1 text-[0.75rem] text-red-500">{error}</p>}
    </div>
  );
}

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
      <label className="mb-1.5 block text-[0.82rem] font-semibold text-[var(--foreground)]">
        {label}
        {required && <span className="ml-0.5 text-[var(--primary)]">*</span>}
      </label>
      {children}
      {error && <p role="alert" className="mt-1 text-[0.75rem] text-red-500">{error}</p>}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type CustomerType = "b2c" | "b2b";

type FormState = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  confirm_password: string;
  phone: string;
  country: string;
  company_name: string;
  vat_number: string;
  industry: string;
  terms: boolean;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

export default function RegisterPage() {
  const [customerType, setCustomerType] = useState<CustomerType>("b2b");
  const [form, setForm] = useState<FormState>({
    first_name: "", last_name: "", email: "", password: "", confirm_password: "",
    phone: "", country: "", company_name: "", vat_number: "", industry: "", terms: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [pendingReview, setPendingReview] = useState(false);
  const [vatStatus, setVatStatus] = useState<"idle" | "loading" | "valid" | "invalid" | "unavailable">("idle");

  const set = (key: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value = e.target.type === "checkbox"
        ? (e.target as HTMLInputElement).checked
        : e.target.value;
      setForm((prev) => ({ ...prev, [key]: value }));
      if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
      if (key === "vat_number") setVatStatus("idle");
      setApiError(null);
    };

  const validate = (): FormErrors => {
    const errs: FormErrors = {};
    if (!form.first_name.trim()) errs.first_name = "First name is required";
    if (!form.last_name.trim()) errs.last_name = "Last name is required";
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Enter a valid email";
    if (!form.password) errs.password = "Password is required";
    else if (form.password.length < 8) errs.password = "Password must be at least 8 characters";
    if (!form.confirm_password) errs.confirm_password = "Please confirm your password";
    else if (form.password !== form.confirm_password) errs.confirm_password = "Passwords do not match";
    if (customerType === "b2b") {
      if (!form.company_name.trim()) errs.company_name = "Company name is required";
      if (!form.country.trim()) errs.country = "Country is required for business accounts";
      if (!form.phone.trim()) errs.phone = "Phone is required for business accounts";
    }
    if (!form.terms) errs.terms = "You must accept the terms & conditions";
    return errs;
  };

  const handleVatValidate = async () => {
    if (!form.vat_number.trim()) return;
    setVatStatus("loading");
    try {
      const res = await fetch("/api/vat/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vat_number: form.vat_number.trim() }),
      });
      if (!res.ok) {
        setVatStatus("unavailable");
        return;
      }
      const data = await res.json();
      setVatStatus(data.data?.valid === true ? "valid" : "invalid");
    } catch {
      setVatStatus("unavailable");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSubmitting(true);
    setApiError(null);

    try {
      const result = await registerCustomer({
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        password: form.password,
        password_confirmation: form.confirm_password,
        phone: form.phone || undefined,
        country: form.country || undefined,
        customer_type: customerType,
        company_name: customerType === "b2b" ? form.company_name : undefined,
        vat_number: customerType === "b2b" && form.vat_number ? form.vat_number : undefined,
        industry: customerType === "b2b" && form.industry ? form.industry : undefined,
      });

      // Detect if backend put this account into pending_review
      const status =
        (result as Record<string, unknown>)?.onboarding_status ??
        ((result as Record<string, unknown>)?.data as Record<string, unknown>)?.onboarding_status;
      if (status === "pending_review") {
        setPendingReview(true);
      }
      setSubmitted(true);
    } catch (err: unknown) {
      const e = err as Record<string, unknown>;
      const retryAfter = typeof e?.retry_after === "number" ? (e.retry_after as number) : null;
      setApiError(
        retryAfter
          ? `Too many attempts. Please wait ${retryAfter} seconds and try again.`
          : (e?.message as string) ?? "Registration failed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ── Pending review screen ─────────────────────────────────────────────────
  if (submitted && pendingReview) {
    return (
      <main className="min-h-screen bg-[#f5f5f5]">
        <Navbar />
        <div className="flex min-h-screen items-center justify-center px-5 pt-[76px] lg:pt-20">
          <div className="w-full max-w-[460px] rounded-[22px] bg-white p-10 text-center shadow-[0_12px_40px_rgba(0,0,0,0.07)]">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
              <Clock size={26} strokeWidth={1.6} className="text-amber-600" />
            </div>
            <h2 className="mt-5 text-xl font-extrabold text-[var(--foreground)]">
              Request received
            </h2>
            <p className="mt-2 text-[0.9rem] leading-6 text-[var(--muted)]">
              Your access request has been submitted. Our team reviews all B2B account applications and will contact you at{" "}
              <strong className="text-[var(--foreground)]">{form.email}</strong> once your account is approved.
            </p>
            <div className="mt-6 rounded-[14px] border border-amber-200 bg-amber-50 px-4 py-3 text-left">
              <p className="text-[0.82rem] font-semibold text-amber-800">What happens next?</p>
              <ul className="mt-2 space-y-1.5 text-[0.8rem] text-amber-700">
                <li>1. Our team reviews your business information</li>
                <li>2. You receive an approval email (typically within 1 business day)</li>
                <li>3. You set your password and gain full access</li>
              </ul>
            </div>
            <p className="mt-5 text-[0.82rem] text-[var(--muted)]">
              Have questions?{" "}
              <Link href="/contact" className="font-semibold text-[var(--foreground)] hover:text-[var(--primary)]">
                Contact our team
              </Link>
            </p>
          </div>
        </div>
      </main>
    );
  }

  // ── Account created (direct activation) screen ────────────────────────────
  if (submitted) {
    return (
      <main className="min-h-screen bg-[#f5f5f5]">
        <Navbar />
        <div className="flex min-h-screen items-center justify-center px-5 pt-[76px] lg:pt-20">
          <div className="w-full max-w-[440px] rounded-[22px] bg-white p-10 text-center shadow-[0_12px_40px_rgba(0,0,0,0.07)]">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 size={28} strokeWidth={1.5} className="text-green-500" />
            </div>
            <h2 className="mt-5 text-xl font-extrabold text-[var(--foreground)]">
              Account created!
            </h2>
            <p className="mt-2 text-[0.9rem] leading-6 text-[var(--muted)]">
              Please check your email to verify your account. Once verified, you can sign in and start browsing.
            </p>
            <button
              type="button"
              onClick={async () => {
                try {
                  const { forgotPassword: sendVerify } = await import("@/lib/customer-auth");
                  await sendVerify(form.email);
                } catch { /* ignore */ }
              }}
              className="mt-5 text-[0.82rem] font-medium text-[var(--primary)] hover:underline"
            >
              Resend verification email
            </button>
            <Link
              href="/login"
              className="mt-4 flex h-[50px] w-full items-center justify-center rounded-full bg-[var(--primary)] text-[0.95rem] font-semibold text-white transition hover:bg-[var(--primary-hover)]"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ── Registration form ─────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#f5f5f5]">
      <Navbar />

      <div className="flex min-h-screen items-start justify-center px-5 py-12 pt-[100px] lg:pt-[108px]">
        <div className="w-full max-w-[540px]">

          <div className="mb-7">
            <h1 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)] md:text-3xl">
              Request Access to Okelcor
            </h1>
            <p className="mt-1.5 text-[0.88rem] text-[var(--muted)]">
              B2B wholesale and export platform for tyre distributors, fleet operators, and dealers.
            </p>
          </div>

          {/* B2B platform notice */}
          <div className="mb-6 flex items-start gap-3 rounded-[14px] border border-blue-200 bg-blue-50 px-4 py-3.5">
            <Building2 size={16} strokeWidth={1.8} className="mt-0.5 shrink-0 text-blue-600" />
            <div>
              <p className="text-[0.82rem] font-semibold text-blue-800">B2B access only</p>
              <p className="mt-0.5 text-[0.8rem] leading-5 text-blue-700">
                Okelcor serves wholesale buyers, exporters, tyre dealers, and fleet operators.
                Business accounts are reviewed before activation. Approved customers gain access to wholesale pricing and the full catalogue.
              </p>
            </div>
          </div>

          {/* Account type toggle */}
          <div className="mb-7 flex rounded-[14px] bg-[#efefef] p-1">
            {(["b2b", "b2c"] as CustomerType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setCustomerType(type)}
                className={`flex-1 rounded-[11px] py-2.5 text-[0.88rem] font-semibold transition ${
                  customerType === type
                    ? "bg-[var(--primary)] text-white shadow-sm"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                {type === "b2b" ? "Business" : "Individual"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            {apiError && (
              <div role="alert" className="rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-[0.83rem] text-red-600">
                {apiError}
              </div>
            )}

            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="First Name" required error={errors.first_name}>
                <input type="text" placeholder="John" value={form.first_name} onChange={set("first_name")} className={errors.first_name ? inputErrCls : inputCls} />
              </Field>
              <Field label="Last Name" required error={errors.last_name}>
                <input type="text" placeholder="Smith" value={form.last_name} onChange={set("last_name")} className={errors.last_name ? inputErrCls : inputCls} />
              </Field>
            </div>

            <Field label="Email" required error={errors.email}>
              <input type="email" placeholder="you@company.com" value={form.email} onChange={set("email")} className={errors.email ? inputErrCls : inputCls} />
            </Field>

            <Field label="Password" required>
              <PasswordInput
                placeholder="At least 8 characters"
                value={form.password}
                onChange={set("password") as (e: React.ChangeEvent<HTMLInputElement>) => void}
                error={errors.password}
              />
            </Field>

            <Field label="Confirm Password" required>
              <PasswordInput
                placeholder="Repeat your password"
                value={form.confirm_password}
                onChange={set("confirm_password") as (e: React.ChangeEvent<HTMLInputElement>) => void}
                error={errors.confirm_password}
              />
            </Field>

            <Field label={customerType === "b2b" ? "Phone" : "Phone"} required={customerType === "b2b"} error={errors.phone}>
              <input type="tel" placeholder="+49 123 456 789" value={form.phone} onChange={set("phone")} className={errors.phone ? inputErrCls : inputCls} />
            </Field>

            <Field label="Country" required={customerType === "b2b"} error={errors.country}>
              <div className="relative">
                <select value={form.country} onChange={set("country")} className={errors.country ? `${inputErrCls} appearance-none` : selectCls}>
                  <option value="">Select country…</option>
                  {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--muted)]">▾</span>
              </div>
            </Field>

            {/* B2B fields */}
            {customerType === "b2b" && (
              <>
                <div className="border-t border-black/[0.06] pt-3">
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--primary)]">Business Details</p>
                </div>

                <Field label="Company Name" required error={errors.company_name}>
                  <input type="text" placeholder="Your Company Ltd." value={form.company_name} onChange={set("company_name")} className={errors.company_name ? inputErrCls : inputCls} />
                </Field>

                <Field label="VAT Number" error={errors.vat_number}>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="DE123456789"
                      value={form.vat_number}
                      onChange={set("vat_number")}
                      className={inputCls}
                    />
                    <button
                      type="button"
                      onClick={handleVatValidate}
                      disabled={vatStatus === "loading" || !form.vat_number.trim()}
                      className="shrink-0 rounded-[12px] border border-black/[0.08] bg-white px-4 text-[0.82rem] font-semibold text-[var(--foreground)] transition hover:bg-[#f0f0f0] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {vatStatus === "loading" ? <Loader2 size={14} className="animate-spin" /> : "Validate"}
                    </button>
                  </div>
                  <p className="mt-1 text-[0.73rem] text-[var(--muted)]">
                    Include country code — e.g. DE123456789, GB123456789, FR12345678901
                  </p>
                  {vatStatus === "valid" && (
                    <p className="mt-1 flex items-center gap-1.5 text-[0.75rem] font-medium text-green-600">
                      <CheckCircle2 size={13} strokeWidth={2} /> VAT number verified
                    </p>
                  )}
                  {vatStatus === "invalid" && (
                    <p className="mt-1 flex items-center gap-1.5 text-[0.75rem] font-medium text-red-500">
                      <XCircle size={13} strokeWidth={2} /> VAT number could not be validated. Please check the number and country code.
                    </p>
                  )}
                  {vatStatus === "unavailable" && (
                    <p className="mt-1 flex items-center gap-1.5 text-[0.75rem] font-medium text-amber-600">
                      <AlertTriangle size={13} strokeWidth={2} /> Validation unavailable — you can still proceed.
                    </p>
                  )}
                </Field>

                <Field label="Industry" error={errors.industry}>
                  <div className="relative">
                    <select value={form.industry} onChange={set("industry")} className={selectCls}>
                      <option value="">Select industry…</option>
                      {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
                    </select>
                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--muted)]">▾</span>
                  </div>
                </Field>
              </>
            )}

            {/* Terms */}
            <div>
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={form.terms}
                  onChange={set("terms")}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-black/20 text-[var(--primary)] accent-[var(--primary)]"
                />
                <span className="text-[0.82rem] leading-5 text-[var(--muted)]">
                  I agree to the{" "}
                  <Link href="/terms" className="font-medium text-[var(--foreground)] hover:text-[var(--primary)]">Terms & Conditions</Link>
                  {" "}and{" "}
                  <Link href="/privacy" className="font-medium text-[var(--foreground)] hover:text-[var(--primary)]">Privacy Policy</Link>
                </span>
              </label>
              {errors.terms && <p role="alert" className="mt-1 text-[0.75rem] text-red-500">{errors.terms}</p>}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex h-[50px] w-full items-center justify-center rounded-full bg-[var(--primary)] text-[0.95rem] font-semibold text-white transition hover:bg-[var(--primary-hover)] disabled:opacity-60"
            >
              {submitting ? (
                <span className="flex items-center gap-2.5">
                  <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Submitting…
                </span>
              ) : "Request Access"}
            </button>
          </form>

          <p className="mt-6 text-center text-[0.85rem] text-[var(--muted)]">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-[var(--foreground)] hover:text-[var(--primary)]">
              Sign in
            </Link>
          </p>

        </div>
      </div>
    </main>
  );
}
