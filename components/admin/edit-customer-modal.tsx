"use client";

import { useState } from "react";
import { X, Loader2, AlertCircle, Edit3 } from "lucide-react";
import { COUNTRIES } from "@/lib/countries";

type EditableCustomer = {
  id: number;
  first_name: string;
  last_name?: string;
  email: string;
  company_name?: string;
  customer_type: "b2b" | "b2c";
  vat_number?: string | null;
  vat_verified?: boolean;
  industry?: string | null;
  phone?: string;
  country?: string;
  admin_notes?: string;
};

type Props = {
  customer: EditableCustomer;
  onClose: () => void;
  /** Called after a successful save with the fields that changed (server response data if present) and the backend message. */
  onSaved: (patch: Record<string, unknown>, message?: string) => void;
};

type FieldErrors = Record<string, string>;

const labelCls = "mb-1.5 block text-[0.78rem] font-semibold text-[#1a1a1a]";
const inputBase =
  "w-full rounded-xl border bg-[#fafafa] px-3.5 py-2.5 text-[0.85rem] text-[#1a1a1a] outline-none transition placeholder:text-[#aaa] focus:bg-white focus:ring-2 focus:ring-[#E85C1A]/10";
const okBorder = "border-black/[0.1] focus:border-[#E85C1A]";
const errBorder = "border-red-400 focus:border-red-500";

export default function EditCustomerModal({ customer, onClose, onSaved }: Props) {
  const orig = {
    first_name:   customer.first_name ?? "",
    last_name:    customer.last_name ?? "",
    email:        customer.email ?? "",
    company_name: customer.company_name ?? "",
    customer_type: customer.customer_type,
    vat_number:   customer.vat_number ?? "",
    industry:     customer.industry ?? "",
    phone:        customer.phone ?? "",
    country:      customer.country ?? "",
    admin_notes:  customer.admin_notes ?? "",
  };

  const [firstName, setFirstName]     = useState(orig.first_name);
  const [lastName, setLastName]       = useState(orig.last_name);
  const [email, setEmail]             = useState(orig.email);
  const [companyName, setCompanyName] = useState(orig.company_name);
  const [customerType, setCustomerType] = useState<"b2b" | "b2c">(orig.customer_type);
  const [vatNumber, setVatNumber]     = useState(orig.vat_number);
  const [vatConfirmed, setVatConfirmed] = useState(false);
  const [industry, setIndustry]       = useState(orig.industry);
  const [phone, setPhone]             = useState(orig.phone);
  const [country, setCountry]         = useState(orig.country);
  const [notes, setNotes]             = useState(orig.admin_notes);

  const [errors, setErrors]       = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isB2b = customerType === "b2b";
  const vatChanged = vatNumber.trim() !== orig.vat_number.trim();

  function buildDiff(): Record<string, unknown> {
    const diff: Record<string, unknown> = {};
    const pairs: [string, string, string][] = [
      ["first_name",   firstName.trim(),   orig.first_name],
      ["last_name",    lastName.trim(),    orig.last_name],
      ["email",        email.trim(),       orig.email],
      ["company_name", companyName.trim(), orig.company_name],
      ["industry",     industry.trim(),    orig.industry],
      ["phone",        phone.trim(),       orig.phone],
      ["country",      country,            orig.country],
      ["admin_notes",  notes,              orig.admin_notes],
    ];
    for (const [key, value, original] of pairs) {
      if (value !== original) diff[key] = value;
    }
    if (customerType !== orig.customer_type) diff.customer_type = customerType;
    if (vatChanged) {
      diff.vat_number = vatNumber.trim();
      if (vatConfirmed) diff.vat_verified = true;
      // If not confirmed, vat_verified is omitted on purpose — the backend
      // resets it to false for a manually-typed correction.
    }
    return diff;
  }

  function validate(): FieldErrors {
    const e: FieldErrors = {};
    if (!firstName.trim()) e.first_name = "First name is required.";
    if (!email.trim()) e.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Enter a valid email address.";
    if (isB2b && !companyName.trim()) e.company_name = "Company name is required for B2B customers.";
    return e;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const v = validate();
    if (Object.keys(v).length) { setErrors(v); return; }
    setErrors({});
    setFormError(null);

    const diff = buildDiff();
    if (Object.keys(diff).length === 0) { onClose(); return; }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/customers/${customer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(diff),
      });

      if (res.status === 404 || res.status === 405) {
        setFormError("Editing isn't available yet — the backend endpoint is pending deployment.");
        return;
      }

      const json = await res.json().catch(() => ({}));

      if (res.status === 422 && json?.errors && typeof json.errors === "object") {
        const mapped: FieldErrors = {};
        for (const [k, val] of Object.entries(json.errors as Record<string, unknown>)) {
          mapped[k] = Array.isArray(val) ? String(val[0]) : String(val);
        }
        setErrors(mapped);
        if (!Object.keys(mapped).length) setFormError(json.message ?? "Please check the form and try again.");
        return;
      }

      if (!res.ok) {
        setFormError(json?.message ?? json?.error ?? `Could not save changes (error ${res.status}).`);
        return;
      }

      const data = (json?.data ?? diff) as Record<string, unknown>;
      onSaved(data, json?.message);
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const ic = (field: string) => `${inputBase} ${errors[field] ? errBorder : okBorder}`;

  return (
    <Shell onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="flex items-start gap-3 border-b border-black/[0.06] px-7 py-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E85C1A]">
            <Edit3 size={18} className="text-white" />
          </div>
          <div>
            <p className="text-[1rem] font-extrabold text-[#1a1a1a]">Edit Customer</p>
            <p className="mt-0.5 text-[0.8rem] text-[#5c5e62]">Correct account details. Every save is logged to the customer&apos;s timeline.</p>
          </div>
        </div>

        <div className="max-h-[60vh] space-y-4 overflow-y-auto px-7 py-6">
          {/* Customer type */}
          <div>
            <span className={labelCls}>Customer Type</span>
            <div className="flex gap-2">
              {(["b2b", "b2c"] as const).map((tp) => (
                <button
                  key={tp}
                  type="button"
                  onClick={() => setCustomerType(tp)}
                  className={`flex-1 rounded-xl border-2 py-2 text-[0.82rem] font-semibold uppercase transition ${
                    customerType === tp
                      ? "border-[#E85C1A] bg-[#E85C1A] text-white"
                      : "border-black/[0.1] bg-white text-[#5c5e62] hover:border-[#E85C1A]/40"
                  }`}
                >
                  {tp}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="ec-first" className={labelCls}>First Name *</label>
              <input id="ec-first" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={ic("first_name")} />
              {errors.first_name && <p className="mt-1 text-[0.72rem] text-red-500">{errors.first_name}</p>}
            </div>
            <div>
              <label htmlFor="ec-last" className={labelCls}>Last Name</label>
              <input id="ec-last" value={lastName} onChange={(e) => setLastName(e.target.value)} className={ic("last_name")} />
              {errors.last_name && <p className="mt-1 text-[0.72rem] text-red-500">{errors.last_name}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="ec-email" className={labelCls}>Email *</label>
            <input id="ec-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={ic("email")} />
            {errors.email && <p className="mt-1 text-[0.72rem] text-red-500">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="ec-company" className={labelCls}>Company Name {isB2b && "*"}</label>
            <input id="ec-company" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={ic("company_name")} />
            {errors.company_name && <p className="mt-1 text-[0.72rem] text-red-500">{errors.company_name}</p>}
          </div>

          {/* VAT number */}
          <div>
            <label htmlFor="ec-vat" className={labelCls}>VAT Number</label>
            <div className="flex items-center gap-2">
              <input id="ec-vat" value={vatNumber} onChange={(e) => setVatNumber(e.target.value)} className={ic("vat_number")} placeholder="DE123456789" />
              {!vatChanged && customer.vat_verified && (
                <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-1 text-[0.68rem] font-bold text-emerald-700">Verified</span>
              )}
            </div>
            {errors.vat_number && <p className="mt-1 text-[0.72rem] text-red-500">{errors.vat_number}</p>}
            {vatChanged && (
              <label className="mt-2 flex cursor-pointer items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5">
                <input type="checkbox" checked={vatConfirmed} onChange={(e) => setVatConfirmed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[#E85C1A]" />
                <span className="text-[0.78rem] text-amber-800">
                  I&apos;ve confirmed this VAT number. <span className="font-normal">Otherwise the verified badge resets — changing the number without checking this marks it unverified again.</span>
                </span>
              </label>
            )}
          </div>

          <div>
            <label htmlFor="ec-industry" className={labelCls}>Industry</label>
            <input id="ec-industry" value={industry} onChange={(e) => setIndustry(e.target.value)} className={ic("industry")} placeholder="Automotive parts" />
            {errors.industry && <p className="mt-1 text-[0.72rem] text-red-500">{errors.industry}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="ec-phone" className={labelCls}>Phone</label>
              <input id="ec-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={ic("phone")} />
              {errors.phone && <p className="mt-1 text-[0.72rem] text-red-500">{errors.phone}</p>}
            </div>
            <div>
              <label htmlFor="ec-country" className={labelCls}>Country</label>
              <select id="ec-country" value={country} onChange={(e) => setCountry(e.target.value)} className={ic("country")}>
                <option value="">Select country…</option>
                {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.country && <p className="mt-1 text-[0.72rem] text-red-500">{errors.country}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="ec-notes" className={labelCls}>Internal Admin Notes</label>
            <textarea id="ec-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
              className={`${ic("admin_notes")} resize-none`} placeholder="Not visible to the customer…" />
          </div>

          {formError && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5">
              <AlertCircle size={14} className="shrink-0 text-red-500" />
              <p className="text-[0.8rem] text-red-700">{formError}</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-black/[0.06] px-7 py-4">
          <button type="button" onClick={onClose}
            className="h-10 rounded-xl border border-black/[0.1] px-5 text-[0.82rem] font-semibold text-[#5c5e62] transition hover:bg-[#f0f2f5]">
            Cancel
          </button>
          <button type="submit" disabled={submitting}
            className="flex h-10 items-center gap-2 rounded-xl bg-[#E85C1A] px-6 text-[0.82rem] font-semibold text-white transition hover:bg-[#d44d10] disabled:opacity-50">
            {submitting ? <><Loader2 size={15} className="animate-spin" /> Saving…</> : <>Save Changes</>}
          </button>
        </div>
      </form>
    </Shell>
  );
}

function Shell({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <button type="button" onClick={onClose} aria-label="Close"
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full text-[#9ca3af] transition hover:bg-[#f0f2f5] hover:text-[#1a1a1a]">
          <X size={16} />
        </button>
        {children}
      </div>
    </div>
  );
}
