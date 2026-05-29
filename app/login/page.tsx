"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, CheckCircle2, Check, MailWarning, RefreshCcw, Clock, XCircle, ShieldOff } from "lucide-react";
import Navbar from "@/components/navbar";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import { forgotPassword, resendVerification } from "@/lib/customer-auth";
import type { Metadata } from "next";

// ─── Input styles ─────────────────────────────────────────────────────────────

const inputCls =
  "w-full rounded-[12px] border border-black/[0.08] bg-white px-4 py-3 text-[0.93rem] text-[var(--foreground)] outline-none placeholder:text-[var(--muted)] transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10";

const inputErrCls =
  "w-full rounded-[12px] border border-red-400 bg-red-50/50 px-4 py-3 text-[0.93rem] text-[var(--foreground)] outline-none placeholder:text-[var(--muted)] transition focus:border-red-500";

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
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-[0.82rem] font-semibold text-[var(--foreground)]">
        {label}
      </label>
      {children}
      {error && <p role="alert" className="mt-1 text-[0.75rem] text-red-500">{error}</p>}
    </div>
  );
}

// ─── Login form ───────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("redirect") ?? searchParams.get("callbackUrl") ?? "";
  const verifiedParam = searchParams.get("verified"); // "true" | "false" | null
  const { login, refreshCustomer } = useCustomerAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [authError, setAuthError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Email verification state (triggered by login attempt with unverified account)
  const [showVerifyMessage, setShowVerifyMessage] = useState(false);
  const [resendingVerify, setResendingVerify] = useState(false);
  const [resendVerifyDone, setResendVerifyDone] = useState(false);

  // Onboarding gate states
  const [onboardingStatus, setOnboardingStatus] = useState<"pending_review" | "rejected" | "blocked" | null>(null);

  // Resend state for ?verified=false banner
  const [reVerifyEmail, setReVerifyEmail] = useState("");
  const [reVerifySending, setReVerifySending] = useState(false);
  const [reVerifyDone, setReVerifyDone] = useState(false);
  const [reVerifyError, setReVerifyError] = useState<string | null>(null);

  const validate = () => {
    const errs: typeof errors = {};
    if (!email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Enter a valid email";
    if (!password) errs.password = "Password is required";
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSubmitting(true);
    setAuthError(null);

    try {
      const data = await login(email, password);

      // Must reset password
      if ((data as any)?.must_reset) {
        router.push(`/forgot-password?email=${encodeURIComponent(email)}`);
        return;
      }

      // Email not verified
      if (data?.email_verified === false) {
        setShowVerifyMessage(true);
        setSubmitting(false);
        return;
      }

      // Populate auth context before navigating so the account page renders with data
      await refreshCustomer();

      // Normal redirect — use full navigation (not router.push) to clear any
      // stale Next.js router-cache entries (e.g. a cached /shop redirect from
      // before the user was logged in), consistent with how logout works.
      const destination = callbackUrl || "/";
      window.location.href = destination;
    } catch (err: unknown) {
      setSubmitting(false);
      const e = err as Record<string, unknown>;
      if (e?.email_verified === false) {
        setShowVerifyMessage(true);
        return;
      }
      if (e?.must_reset) {
        router.push(`/forgot-password?email=${encodeURIComponent(email)}`);
        return;
      }
      // Onboarding gate — backend signals via onboarding_status field
      const os = e?.onboarding_status as string | undefined;
      if (os === "pending_review") { setOnboardingStatus("pending_review"); return; }
      if (os === "rejected")       { setOnboardingStatus("rejected"); return; }
      if (os === "blocked")        { setOnboardingStatus("blocked"); return; }
      // Fallback: detect common pending/blocked messages from backend text
      const msg = ((e?.message as string) ?? "").toLowerCase();
      if (msg.includes("pending") || msg.includes("under review")) { setOnboardingStatus("pending_review"); return; }
      if (msg.includes("rejected") || msg.includes("not approved")) { setOnboardingStatus("rejected"); return; }
      if (msg.includes("blocked") || msg.includes("suspended") || msg.includes("banned")) { setOnboardingStatus("blocked"); return; }

      const retryAfter = typeof e?.retry_after === "number" ? (e.retry_after as number) : null;
      setAuthError(
        retryAfter
          ? `Too many attempts. Please wait ${retryAfter} seconds and try again.`
          : (e?.message as string) ?? "Invalid email or password. Please try again."
      );
    }
  };

  const handleResendVerify = async () => {
    setResendingVerify(true);
    try {
      await forgotPassword(email);
      setResendVerifyDone(true);
    } catch {
      // Ignore
    } finally {
      setResendingVerify(false);
    }
  };

  const handleReVerify = async () => {
    if (!reVerifyEmail.trim()) { setReVerifyError("Please enter your email address."); return; }
    setReVerifySending(true);
    setReVerifyError(null);
    try {
      await resendVerification(reVerifyEmail.trim());
      setReVerifyDone(true);
    } catch (err: unknown) {
      const e = err as Record<string, unknown>;
      setReVerifyError((e?.message as string) ?? "Failed to resend. Please try again.");
    } finally {
      setReVerifySending(false);
    }
  };

  // ── Email verification screen ─────────────────────────────────────────────
  if (showVerifyMessage) {
    return (
      <main className="min-h-screen bg-[#f5f5f5]">
        <Navbar />
        <div className="flex min-h-screen items-center justify-center px-5 pt-[76px] lg:pt-20">
          <div className="w-full max-w-[420px] rounded-[22px] bg-white p-8 text-center shadow-[0_12px_40px_rgba(0,0,0,0.07)]">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-orange-100">
              <MailWarning size={26} strokeWidth={1.6} className="text-[var(--primary)]" />
            </div>
            <h2 className="mt-5 text-xl font-extrabold text-[var(--foreground)]">
              Please verify your email
            </h2>
            <p className="mt-2 text-[0.88rem] leading-6 text-[var(--muted)]">
              We sent a verification link to <strong className="text-[var(--foreground)]">{email}</strong>. Check your inbox and click the link to activate your account.
            </p>

            {resendVerifyDone ? (
              <div className="mt-6 flex items-center justify-center gap-2 text-[0.88rem] text-green-600">
                <CheckCircle2 size={16} /> Verification email resent
              </div>
            ) : (
              <button
                type="button"
                onClick={handleResendVerify}
                disabled={resendingVerify}
                className="mt-6 inline-flex items-center gap-2 text-[0.88rem] font-semibold text-[var(--primary)] transition hover:underline disabled:opacity-60"
              >
                <RefreshCcw size={15} className={resendingVerify ? "animate-spin" : ""} />
                Resend verification email
              </button>
            )}

            <Link
              href="/login"
              onClick={() => setShowVerifyMessage(false)}
              className="mt-4 block text-[0.82rem] text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              Back to login
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ── Pending review screen ─────────────────────────────────────────────────
  if (onboardingStatus === "pending_review") {
    return (
      <main className="min-h-screen bg-[#f5f5f5]">
        <Navbar />
        <div className="flex min-h-screen items-center justify-center px-5 pt-[76px] lg:pt-20">
          <div className="w-full max-w-[420px] rounded-[22px] bg-white p-8 text-center shadow-[0_12px_40px_rgba(0,0,0,0.07)]">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
              <Clock size={26} strokeWidth={1.6} className="text-amber-600" />
            </div>
            <h2 className="mt-5 text-xl font-extrabold text-[var(--foreground)]">
              Access request under review
            </h2>
            <p className="mt-2 text-[0.88rem] leading-6 text-[var(--muted)]">
              Your account application is being reviewed. You will receive an email once your access has been approved.
            </p>
            <p className="mt-4 text-[0.82rem] text-[var(--muted)]">
              Questions?{" "}
              <a href="/contact" className="font-semibold text-[var(--foreground)] hover:text-[var(--primary)]">
                Contact our team
              </a>
            </p>
            <button
              type="button"
              onClick={() => setOnboardingStatus(null)}
              className="mt-5 block text-[0.82rem] text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              Back to login
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ── Rejected screen ───────────────────────────────────────────────────────
  if (onboardingStatus === "rejected") {
    return (
      <main className="min-h-screen bg-[#f5f5f5]">
        <Navbar />
        <div className="flex min-h-screen items-center justify-center px-5 pt-[76px] lg:pt-20">
          <div className="w-full max-w-[420px] rounded-[22px] bg-white p-8 text-center shadow-[0_12px_40px_rgba(0,0,0,0.07)]">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
              <XCircle size={26} strokeWidth={1.6} className="text-red-500" />
            </div>
            <h2 className="mt-5 text-xl font-extrabold text-[var(--foreground)]">
              Account application not approved
            </h2>
            <p className="mt-2 text-[0.88rem] leading-6 text-[var(--muted)]">
              Your account application was not approved. If you believe this is an error or would like to discuss further, please contact our team.
            </p>
            <a
              href="/contact"
              className="mt-6 flex h-[46px] w-full items-center justify-center rounded-full bg-[var(--primary)] text-[0.93rem] font-semibold text-white transition hover:bg-[var(--primary-hover)]"
            >
              Contact our team
            </a>
            <button
              type="button"
              onClick={() => setOnboardingStatus(null)}
              className="mt-4 block w-full text-[0.82rem] text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              Back to login
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ── Blocked screen ────────────────────────────────────────────────────────
  if (onboardingStatus === "blocked") {
    return (
      <main className="min-h-screen bg-[#f5f5f5]">
        <Navbar />
        <div className="flex min-h-screen items-center justify-center px-5 pt-[76px] lg:pt-20">
          <div className="w-full max-w-[420px] rounded-[22px] bg-white p-8 text-center shadow-[0_12px_40px_rgba(0,0,0,0.07)]">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
              <ShieldOff size={26} strokeWidth={1.6} className="text-gray-500" />
            </div>
            <h2 className="mt-5 text-xl font-extrabold text-[var(--foreground)]">
              Account access restricted
            </h2>
            <p className="mt-2 text-[0.88rem] leading-6 text-[var(--muted)]">
              Access to this account has been restricted. Please contact our team if you need assistance.
            </p>
            <a
              href="/contact"
              className="mt-6 flex h-[46px] w-full items-center justify-center rounded-full bg-[var(--primary)] text-[0.93rem] font-semibold text-white transition hover:bg-[var(--primary-hover)]"
            >
              Contact our team
            </a>
            <button
              type="button"
              onClick={() => setOnboardingStatus(null)}
              className="mt-4 block w-full text-[0.82rem] text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              Back to login
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ── Login form ────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#f5f5f5]">
      <Navbar />

      <div className="flex min-h-screen pt-[76px] lg:pt-20">

        {/* Left panel */}
        <div className="relative hidden flex-1 lg:block">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/images/pexels-einfoto-2091159.jpg')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/30" />
          <div className="relative z-10 flex h-full flex-col justify-between p-12 xl:p-16">
            <div>
              <img src="/logo/okelcor-logo.png" alt="Okelcor" style={{ height: "26px", width: "auto", filter: "brightness(0) invert(1)" }} className="block object-contain" />
              <p className="mt-1 text-[8px] font-bold uppercase tracking-[0.28em] text-white/60">Growing Together</p>
            </div>
            <div className="max-w-[440px]">
              <h2 className="text-4xl font-extrabold leading-[1.05] tracking-tight text-white xl:text-5xl">
                Access your Okelcor account
              </h2>
              <p className="mt-4 text-[1rem] leading-7 text-white/75">
                Manage your orders, request quotes, and access your tyre catalogue in one place.
              </p>
              <ul className="mt-8 flex flex-col gap-3.5">
                {["Real-time order tracking", "Wholesale pricing for B2B clients", "Dedicated account manager"].map((point) => (
                  <li key={point} className="flex items-center gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/20">
                      <Check size={13} strokeWidth={2.5} className="text-[var(--primary)]" />
                    </div>
                    <span className="text-[0.9rem] text-white/85">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-[0.78rem] text-white/40">© {new Date().getFullYear()} Okelcor GmbH. All rights reserved.</p>
          </div>
        </div>

        {/* Right panel */}
        <div className="flex w-full flex-col items-center justify-center px-5 py-12 lg:w-[520px] lg:shrink-0 xl:w-[580px]">
          <div className="w-full max-w-[420px]">

            <div className="mb-8 flex flex-col items-center lg:hidden">
              <img src="/logo/okelcor-logo.png" alt="Okelcor" style={{ height: "24px", width: "auto" }} className="block object-contain" />
            </div>

            <div className="mb-7">
              <h1 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)] md:text-3xl">
                Sign in
              </h1>
              <p className="mt-1.5 text-[0.88rem] text-[var(--muted)]">
                Welcome back to Okelcor
              </p>
            </div>

            {/* ── Verified=true banner ────────────────────────────────────── */}
            {verifiedParam === "true" && (
              <div role="status" className="mb-5 flex items-start gap-3 rounded-[12px] border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-[0.85rem] text-emerald-800">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-500" />
                <span>Your email has been verified. You can now log in.</span>
              </div>
            )}

            {/* ── Verified=false banner ───────────────────────────────────── */}
            {verifiedParam === "false" && (
              <div className="mb-5 rounded-[12px] border border-red-200 bg-red-50 px-4 py-4 text-[0.85rem]">
                <p className="font-semibold text-red-700">Verification link is invalid or has expired.</p>
                <p className="mt-1 text-red-600">Enter your email address to receive a new verification link.</p>
                {reVerifyDone ? (
                  <div className="mt-3 flex items-center gap-2 text-[0.83rem] text-emerald-700">
                    <CheckCircle2 size={14} /> Verification email sent — check your inbox.
                  </div>
                ) : (
                  <div className="mt-3 flex flex-col gap-2">
                    {reVerifyError && (
                      <p role="alert" className="text-[0.78rem] text-red-600">{reVerifyError}</p>
                    )}
                    <div className="flex gap-2">
                      <input
                        type="email"
                        placeholder="your@email.com"
                        value={reVerifyEmail}
                        onChange={(e) => { setReVerifyEmail(e.target.value); setReVerifyError(null); }}
                        className="flex-1 rounded-[10px] border border-red-200 bg-white px-3 py-2 text-[0.83rem] text-[var(--foreground)] outline-none placeholder:text-[var(--muted)] focus:border-red-400 focus:ring-2 focus:ring-red-200"
                      />
                      <button
                        type="button"
                        onClick={handleReVerify}
                        disabled={reVerifySending}
                        className="flex shrink-0 items-center gap-1.5 rounded-[10px] bg-red-600 px-3 py-2 text-[0.8rem] font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                      >
                        <RefreshCcw size={13} className={reVerifySending ? "animate-spin" : ""} />
                        {reVerifySending ? "Sending…" : "Resend"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
              {authError && (
                <div role="alert" className="rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-[0.83rem] text-red-600">
                  {authError}
                </div>
              )}

              <Field label="Email" htmlFor="email" error={errors.email}>
                <input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); setAuthError(null); }}
                  className={errors.email ? inputErrCls : inputCls}
                />
              </Field>

              <Field label="Password" htmlFor="password">
                <PasswordInput
                  id="password"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })); setAuthError(null); }}
                  error={errors.password}
                />
              </Field>

              <div className="flex justify-end">
                <Link
                  href={`/forgot-password${email ? `?email=${encodeURIComponent(email)}` : ""}`}
                  className="text-[0.8rem] font-medium text-[var(--muted)] transition hover:text-[var(--primary)]"
                >
                  Forgot password?
                </Link>
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
                    Signing in…
                  </span>
                ) : "Sign In"}
              </button>
            </form>

            <p className="mt-6 text-center text-[0.85rem] text-[var(--muted)]">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-semibold text-[var(--foreground)] hover:text-[var(--primary)]">
                Create account
              </Link>
            </p>

            <p className="mt-3 text-center text-[0.78rem] text-[var(--muted)]">
              Need help?{" "}
              <Link href="/contact" className="font-medium text-[var(--foreground)] hover:text-[var(--primary)]">
                Contact our team
              </Link>
            </p>

          </div>
        </div>
      </div>
    </main>
  );
}
