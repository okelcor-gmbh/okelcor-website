"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronRight, Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { useCustomerAuth } from "@/context/CustomerAuthContext";

// ─── Styles ───────────────────────────────────────────────────────────────────

const inputCls =
  "w-full rounded-[12px] border border-black/[0.08] bg-white px-4 py-3 text-[0.93rem] text-[var(--foreground)] outline-none placeholder:text-[var(--muted)] transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10";

const inputErrCls =
  "w-full rounded-[12px] border border-red-400 bg-red-50/50 px-4 py-3 text-[0.93rem] text-[var(--foreground)] outline-none transition";

const inputReadonlyCls =
  "w-full rounded-[12px] border border-black/[0.05] bg-[#f5f5f5] px-4 py-3 text-[0.93rem] text-[var(--muted)] cursor-not-allowed";

const selectCls =
  "w-full rounded-[12px] border border-black/[0.08] bg-white px-4 py-3 text-[0.93rem] text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10 appearance-none";

// ─── Countries ────────────────────────────────────────────────────────────────

const COUNTRIES = [
  "Germany", "United Kingdom", "France", "Netherlands", "Belgium", "Austria",
  "Switzerland", "Poland", "Czech Republic", "Hungary", "Romania", "Bulgaria",
  "Spain", "Portugal", "Italy", "Greece", "Turkey", "Ukraine",
  "United Arab Emirates", "Saudi Arabia", "Qatar", "Kuwait", "Bahrain", "Oman",
  "Nigeria", "Ghana", "Kenya", "South Africa", "Egypt", "Morocco",
  "United States", "Canada", "Australia", "Other",
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[0.82rem] font-semibold text-[var(--foreground)]">
        {label}
      </label>
      {children}
      {error && <p role="alert" className="mt-1 text-[0.75rem] text-red-500">{error}</p>}
    </div>
  );
}

function PasswordInput({
  placeholder,
  value,
  onChange,
  error,
}: {
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
          type={show ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
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

function passwordStrength(pw: string) {
  if (!pw) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const levels = [
    { label: "Weak", color: "bg-red-400" },
    { label: "Fair", color: "bg-orange-400" },
    { label: "Good", color: "bg-yellow-400" },
    { label: "Strong", color: "bg-green-500" },
  ];
  return { score, ...(levels[score - 1] ?? levels[0]) };
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, type }: { message: string; type: "success" | "error" }) {
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-[14px] px-5 py-3.5 text-[0.88rem] font-semibold text-white shadow-[0_8px_30px_rgba(0,0,0,0.15)] transition ${
        type === "success" ? "bg-green-600" : "bg-red-500"
      }`}
    >
      {type === "success"
        ? <CheckCircle2 size={16} strokeWidth={2} />
        : <XCircle size={16} strokeWidth={2} />}
      {message}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { customer, refreshCustomer, isLoading } = useCustomerAuth();

  // ── Personal info form ────────────────────────────────────────────────────
  const [info, setInfo] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    country: "",
  });
  const [infoErrors, setInfoErrors] = useState<Partial<typeof info>>({});
  const [savingInfo, setSavingInfo] = useState(false);

  // ── Password form ─────────────────────────────────────────────────────────
  const [pw, setPw] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [pwErrors, setPwErrors] = useState<Partial<typeof pw>>({});
  const [savingPw, setSavingPw] = useState(false);

  // ── Toast ─────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Populate form when customer loads
  useEffect(() => {
    if (customer) {
      setInfo({
        first_name: customer.first_name ?? "",
        last_name: customer.last_name ?? "",
        phone: customer.phone ?? "",
        country: customer.country ?? "",
      });
    }
  }, [customer]);

  // ── Save personal info ────────────────────────────────────────────────────
  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof infoErrors = {};
    if (!info.first_name.trim()) errs.first_name = "First name is required";
    if (!info.last_name.trim()) errs.last_name = "Last name is required";
    if (Object.keys(errs).length > 0) { setInfoErrors(errs); return; }

    setSavingInfo(true);
    try {
      const res = await fetch("/api/auth/customer/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(info),
      });
      if (!res.ok) {
        const data = await res.json();
        showToast(data.message ?? "Failed to save changes.", "error");
      } else {
        await refreshCustomer();
        showToast("Profile updated successfully.", "success");
      }
    } catch {
      showToast("Something went wrong. Please try again.", "error");
    } finally {
      setSavingInfo(false);
    }
  };

  // ── Change password ───────────────────────────────────────────────────────
  const handleChangePw = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof pwErrors = {};
    if (!pw.current_password) errs.current_password = "Current password is required";
    if (!pw.new_password) errs.new_password = "New password is required";
    else if (pw.new_password.length < 8) errs.new_password = "Password must be at least 8 characters";
    if (!pw.confirm_password) errs.confirm_password = "Please confirm your new password";
    else if (pw.new_password !== pw.confirm_password) errs.confirm_password = "Passwords do not match";
    if (Object.keys(errs).length > 0) { setPwErrors(errs); return; }

    setSavingPw(true);
    try {
      const res = await fetch("/api/auth/customer/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_password: pw.current_password,
          password: pw.new_password,
          password_confirmation: pw.confirm_password,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        showToast(data.message ?? "Failed to update password.", "error");
      } else {
        setPw({ current_password: "", new_password: "", confirm_password: "" });
        showToast("Password updated successfully.", "success");
      }
    } catch {
      showToast("Something went wrong. Please try again.", "error");
    } finally {
      setSavingPw(false);
    }
  };

  const strength = passwordStrength(pw.new_password);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#f5f5f5]">
        <Navbar />
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f5f5]">
      <Navbar />

      <div className="tesla-shell pb-16 pt-[96px]">

        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-1.5 text-[0.82rem] text-[var(--muted)]">
          <Link href="/account" className="transition hover:text-[var(--foreground)]">My Account</Link>
          <ChevronRight size={13} className="opacity-50" />
          <span className="font-medium text-[var(--foreground)]">Profile Settings</span>
        </nav>

        <h1 className="mb-8 text-2xl font-extrabold tracking-tight text-[var(--foreground)]">
          Profile Settings
        </h1>

        <div className="flex max-w-[640px] flex-col gap-6">

          {/* ── Personal Information ── */}
          <div className="rounded-[22px] bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] sm:p-8">
            <h2 className="mb-6 text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--primary)]">
              Personal Information
            </h2>

            <form onSubmit={handleSaveInfo} noValidate className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="First Name" error={infoErrors.first_name}>
                  <input
                    type="text"
                    placeholder="John"
                    value={info.first_name}
                    onChange={(e) => { setInfo((p) => ({ ...p, first_name: e.target.value })); setInfoErrors((p) => ({ ...p, first_name: undefined })); }}
                    className={infoErrors.first_name ? inputErrCls : inputCls}
                  />
                </Field>
                <Field label="Last Name" error={infoErrors.last_name}>
                  <input
                    type="text"
                    placeholder="Smith"
                    value={info.last_name}
                    onChange={(e) => { setInfo((p) => ({ ...p, last_name: e.target.value })); setInfoErrors((p) => ({ ...p, last_name: undefined })); }}
                    className={infoErrors.last_name ? inputErrCls : inputCls}
                  />
                </Field>
              </div>

              <Field label="Email address">
                <input
                  type="email"
                  value={customer?.email ?? ""}
                  readOnly
                  className={inputReadonlyCls}
                />
                <p className="mt-1.5 text-[0.75rem] text-[var(--muted)]">
                  Contact{" "}
                  <Link href="/contact" className="font-medium text-[var(--foreground)] hover:text-[var(--primary)]">
                    support
                  </Link>{" "}
                  to change your email address.
                </p>
              </Field>

              <Field label="Phone number" error={infoErrors.phone}>
                <input
                  type="tel"
                  placeholder="+49 123 456 789"
                  value={info.phone}
                  onChange={(e) => setInfo((p) => ({ ...p, phone: e.target.value }))}
                  className={inputCls}
                />
              </Field>

              <Field label="Country">
                <div className="relative">
                  <select
                    value={info.country}
                    onChange={(e) => setInfo((p) => ({ ...p, country: e.target.value }))}
                    className={selectCls}
                  >
                    <option value="">Select country…</option>
                    {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--muted)]">▾</span>
                </div>
              </Field>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={savingInfo}
                  className="flex h-11 items-center justify-center rounded-full bg-[var(--primary)] px-8 text-[0.9rem] font-semibold text-white transition hover:bg-[var(--primary-hover)] disabled:opacity-60"
                >
                  {savingInfo ? (
                    <span className="flex items-center gap-2">
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Saving…
                    </span>
                  ) : "Save Changes"}
                </button>
              </div>
            </form>
          </div>

          {/* ── Change Password ── */}
          <div className="rounded-[22px] bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] sm:p-8">
            <h2 className="mb-6 text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--primary)]">
              Change Password
            </h2>

            <form onSubmit={handleChangePw} noValidate className="flex flex-col gap-4">
              <Field label="Current Password" error={pwErrors.current_password}>
                <PasswordInput
                  placeholder="Your current password"
                  value={pw.current_password}
                  onChange={(e) => { setPw((p) => ({ ...p, current_password: e.target.value })); setPwErrors((p) => ({ ...p, current_password: undefined })); }}
                  error={pwErrors.current_password}
                />
              </Field>

              <div>
                <label className="mb-1.5 block text-[0.82rem] font-semibold text-[var(--foreground)]">
                  New Password
                </label>
                <PasswordInput
                  placeholder="At least 8 characters"
                  value={pw.new_password}
                  onChange={(e) => { setPw((p) => ({ ...p, new_password: e.target.value })); setPwErrors((p) => ({ ...p, new_password: undefined })); }}
                  error={pwErrors.new_password}
                />
                {pw.new_password && (
                  <div className="mt-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= strength.score ? strength.color : "bg-black/10"}`} />
                      ))}
                    </div>
                    {strength.label && (
                      <p className="mt-1 text-[0.72rem] text-[var(--muted)]">
                        Password strength: <span className="font-semibold">{strength.label}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>

              <Field label="Confirm New Password" error={pwErrors.confirm_password}>
                <PasswordInput
                  placeholder="Repeat new password"
                  value={pw.confirm_password}
                  onChange={(e) => { setPw((p) => ({ ...p, confirm_password: e.target.value })); setPwErrors((p) => ({ ...p, confirm_password: undefined })); }}
                  error={pwErrors.confirm_password}
                />
              </Field>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={savingPw}
                  className="flex h-11 items-center justify-center rounded-full bg-[var(--primary)] px-8 text-[0.9rem] font-semibold text-white transition hover:bg-[var(--primary-hover)] disabled:opacity-60"
                >
                  {savingPw ? (
                    <span className="flex items-center gap-2">
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Updating…
                    </span>
                  ) : "Update Password"}
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} />}
      <Footer />
    </main>
  );
}
