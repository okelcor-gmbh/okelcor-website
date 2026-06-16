"use client";

import { useState } from "react";
import { X, Loader2, AlertCircle, CheckCircle2, UserPlus } from "lucide-react";
import { COUNTRIES } from "@/lib/countries";

// Keep in step with the access levels rendered in the customers table.
const ACCESS_LEVELS: { value: string; label: string; hint: string }[] = [
  { value: "approved_buyer",  label: "Approved Buyer",  hint: "Full portal: orders, invoices, tracking & documents" },
  { value: "wholesale_buyer", label: "Wholesale Buyer", hint: "Approved buyer + wholesale pricing & catalogue" },
  { value: "quote_only",      label: "Quote Only",      hint: "Can request quotes; no checkout" },
  { value: "inquiry_only",    label: "Inquiry Only",    hint: "Inquiries only; most restricted" },
];

type Props = {
  onClose: () => void;
  onCreated: () => void;
};

type FieldErrors = Record<string, string>;

const labelCls = "mb-1.5 block text-[0.78rem] font-semibold text-[#1a1a1a]";
const inputBase =
  "w-full rounded-xl border bg-[#fafafa] px-3.5 py-2.5 text-[0.85rem] text-[#1a1a1a] outline-none transition placeholder:text-[#aaa] focus:bg-white focus:ring-2 focus:ring-[#E85C1A]/10";
const okBorder = "border-black/[0.1] focus:border-[#E85C1A]";
const errBorder = "border-red-400 focus:border-red-500";

export default function AddCustomerModal({ onClose, onCreated }: Props) {
  const [customerType, setCustomerType] = useState<"b2b" | "b2c">("b2b");
  const [firstName, setFirstName]   = useState("");
  const [lastName, setLastName]     = useState("");
  const [email, setEmail]           = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone]           = useState("");
  const [country, setCountry]       = useState("");
  const [accessLevel, setAccessLevel] = useState("approved_buyer");
  const [sendInvitation, setSendInvitation] = useState(true);
  const [notes, setNotes]           = useState("");

  const [errors, setErrors]       = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // emailSent: true = backend confirmed sent, false = send failed, null = unknown/not requested
  const [done, setDone]           = useState<{ invited: boolean; emailSent: boolean | null } | null>(null);

  const isB2b = customerType === "b2b";

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
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setFormError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_type: customerType,
          first_name: firstName.trim(),
          last_name: lastName.trim() || undefined,
          email: email.trim(),
          company_name: isB2b ? companyName.trim() : (companyName.trim() || undefined),
          phone: phone.trim() || undefined,
          country: country || undefined,
          access_level: accessLevel,
          onboarding_status: "approved",
          send_invitation: sendInvitation,
          notes: notes.trim() || undefined,
          created_via: "admin",
        }),
      });

      // Backend endpoint not deployed yet — degrade gracefully.
      if (res.status === 404 || res.status === 405) {
        setFormError("Customer onboarding isn’t available yet — the backend endpoint is pending deployment.");
        return;
      }

      const json = await res.json().catch(() => ({}));

      if (res.status === 422 && json?.errors && typeof json.errors === "object") {
        // Laravel validation — map { field: [msg] } → { field: msg }
        const mapped: FieldErrors = {};
        for (const [k, v] of Object.entries(json.errors as Record<string, unknown>)) {
          mapped[k] = Array.isArray(v) ? String(v[0]) : String(v);
        }
        setErrors(mapped);
        if (!Object.keys(mapped).length) setFormError(json.message ?? "Please check the form and try again.");
        return;
      }

      if (!res.ok) {
        setFormError(json?.message ?? json?.error ?? `Could not create customer (error ${res.status}).`);
        return;
      }

      // Backend returns the invitation send result in data.invitation_email.
      // Shape isn't guaranteed — accept boolean, string status, or { sent }.
      let emailSent: boolean | null = null;
      if (sendInvitation) {
        const inv = (json?.data as Record<string, unknown> | undefined)?.invitation_email;
        if (typeof inv === "boolean") emailSent = inv;
        else if (typeof inv === "string") emailSent = inv === "sent" || inv === "success";
        else if (inv && typeof inv === "object") {
          const o = inv as Record<string, unknown>;
          emailSent = Boolean(o.sent ?? o.success ?? (o.status === "sent"));
        }
      }

      setDone({ invited: sendInvitation, emailSent });
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const ic = (field: string) => `${inputBase} ${errors[field] ? errBorder : okBorder}`;

  // ── Success state ──────────────────────────────────────────────────────────
  if (done) {
    // Email explicitly failed to send → warn so staff can resend, don't claim success.
    const emailFailed = done.invited && done.emailSent === false;
    return (
      <Shell onClose={onClose}>
        <div className="px-7 py-10 text-center">
          <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${emailFailed ? "bg-amber-100" : "bg-emerald-100"}`}>
            {emailFailed ? <AlertCircle size={28} className="text-amber-600" /> : <CheckCircle2 size={28} className="text-emerald-600" />}
          </div>
          <p className="mt-5 text-[1.05rem] font-extrabold text-[#1a1a1a]">Customer created</p>
          <p className="mx-auto mt-2 max-w-sm text-[0.84rem] leading-relaxed text-[#5c5e62]">
            {!done.invited
              ? "The account was created. You can send an invitation later from the customer’s profile."
              : emailFailed
              ? "The account was created, but the invitation email could not be sent. Open the customer’s profile and use “Resend Invitation.”"
              : "An invitation email with a set-password link has been sent so they can access the portal."}
          </p>
          <button
            type="button"
            onClick={onCreated}
            className="mt-7 h-10 rounded-full bg-[#E85C1A] px-7 text-[0.85rem] font-semibold text-white transition hover:bg-[#d44d10]"
          >
            Done
          </button>
        </div>
      </Shell>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  return (
    <Shell onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="flex items-start gap-3 border-b border-black/[0.06] px-7 py-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E85C1A]">
            <UserPlus size={18} className="text-white" />
          </div>
          <div>
            <p className="text-[1rem] font-extrabold text-[#1a1a1a]">Add Customer</p>
            <p className="mt-0.5 text-[0.8rem] text-[#5c5e62]">
              Onboard a client so they can access invoices, tracking and documents.
            </p>
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
              <label htmlFor="ac-first" className={labelCls}>First Name *</label>
              <input id="ac-first" value={firstName} onChange={(e) => setFirstName(e.target.value)}
                className={ic("first_name")} placeholder="Jane" />
              {errors.first_name && <p className="mt-1 text-[0.72rem] text-red-500">{errors.first_name}</p>}
            </div>
            <div>
              <label htmlFor="ac-last" className={labelCls}>Last Name</label>
              <input id="ac-last" value={lastName} onChange={(e) => setLastName(e.target.value)}
                className={ic("last_name")} placeholder="Doe" />
              {errors.last_name && <p className="mt-1 text-[0.72rem] text-red-500">{errors.last_name}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="ac-email" className={labelCls}>Email *</label>
            <input id="ac-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className={ic("email")} placeholder="jane@company.com" />
            {errors.email && <p className="mt-1 text-[0.72rem] text-red-500">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="ac-company" className={labelCls}>
              Company Name {isB2b && "*"}
            </label>
            <input id="ac-company" value={companyName} onChange={(e) => setCompanyName(e.target.value)}
              className={ic("company_name")} placeholder="Company GmbH" />
            {errors.company_name && <p className="mt-1 text-[0.72rem] text-red-500">{errors.company_name}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="ac-phone" className={labelCls}>Phone</label>
              <input id="ac-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                className={ic("phone")} placeholder="+49 …" />
              {errors.phone && <p className="mt-1 text-[0.72rem] text-red-500">{errors.phone}</p>}
            </div>
            <div>
              <label htmlFor="ac-country" className={labelCls}>Country</label>
              <select id="ac-country" value={country} onChange={(e) => setCountry(e.target.value)} className={ic("country")}>
                <option value="">Select country…</option>
                {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.country && <p className="mt-1 text-[0.72rem] text-red-500">{errors.country}</p>}
            </div>
          </div>

          {/* Access level */}
          <div>
            <label htmlFor="ac-access" className={labelCls}>Portal Access Level</label>
            <select id="ac-access" value={accessLevel} onChange={(e) => setAccessLevel(e.target.value)} className={ic("access_level")}>
              {ACCESS_LEVELS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
            <p className="mt-1 text-[0.72rem] text-[#9ca3af]">
              {ACCESS_LEVELS.find((a) => a.value === accessLevel)?.hint}
            </p>
            {errors.access_level && <p className="mt-1 text-[0.72rem] text-red-500">{errors.access_level}</p>}
          </div>

          {/* Internal notes */}
          <div>
            <label htmlFor="ac-notes" className={labelCls}>Internal Note <span className="font-normal text-[#9ca3af]">(optional)</span></label>
            <textarea id="ac-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              className={`${ic("notes")} resize-none`} placeholder="Context for the team — not shown to the customer." />
          </div>

          {/* Send invitation */}
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-black/[0.08] bg-[#fafafa] px-4 py-3">
            <input type="checkbox" checked={sendInvitation} onChange={(e) => setSendInvitation(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[#E85C1A]" />
            <span>
              <span className="block text-[0.82rem] font-semibold text-[#1a1a1a]">Send invitation email now</span>
              <span className="block text-[0.74rem] text-[#5c5e62]">
                Emails a set-password link so the customer can sign in and access the portal.
              </span>
            </span>
          </label>

          {formError && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5">
              <AlertCircle size={14} className="shrink-0 text-red-500" />
              <p className="text-[0.8rem] text-red-700">{formError}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-black/[0.06] px-7 py-4">
          <button type="button" onClick={onClose}
            className="h-10 rounded-xl border border-black/[0.1] px-5 text-[0.82rem] font-semibold text-[#5c5e62] transition hover:bg-[#f0f2f5]">
            Cancel
          </button>
          <button type="submit" disabled={submitting}
            className="flex h-10 items-center gap-2 rounded-xl bg-[#E85C1A] px-6 text-[0.82rem] font-semibold text-white transition hover:bg-[#d44d10] disabled:opacity-50">
            {submitting ? <><Loader2 size={15} className="animate-spin" /> Creating…</> : <><UserPlus size={15} /> Create Customer</>}
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
