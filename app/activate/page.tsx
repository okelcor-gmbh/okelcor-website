"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";
import Navbar from "@/components/navbar";
import { resetPassword } from "@/lib/customer-auth";

const inputCls =
  "w-full rounded-[12px] border border-black/[0.08] bg-white px-4 py-3 text-[0.93rem] text-[var(--foreground)] outline-none placeholder:text-[var(--muted)] transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10";

const inputErrCls =
  "w-full rounded-[12px] border border-red-400 bg-red-50/50 px-4 py-3 text-[0.93rem] text-[var(--foreground)] outline-none placeholder:text-[var(--muted)] transition";

// ─── Password strength ────────────────────────────────────────────────────────

function passwordStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const levels = [
    { label: "Weak",   color: "bg-red-400" },
    { label: "Fair",   color: "bg-orange-400" },
    { label: "Good",   color: "bg-yellow-400" },
    { label: "Strong", color: "bg-green-500" },
  ];
  return { score, ...levels[score - 1] ?? levels[0] };
}

function PasswordInput({
  placeholder, value, onChange, error,
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

// ─── Inner (reads search params) ──────────────────────────────────────────────

function ActivateInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const strength = passwordStrength(password);

  const validate = () => {
    const errs: typeof errors = {};
    if (!password) errs.password = "Password is required";
    else if (password.length < 8) errs.password = "Password must be at least 8 characters";
    if (!confirm) errs.confirm = "Please confirm your password";
    else if (password !== confirm) errs.confirm = "Passwords do not match";
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSubmitting(true);
    setApiError(null);

    try {
      // Activation reuses the reset-password endpoint (token + email + password).
      await resetPassword(token, email, password, confirm);
      setDone(true);
    } catch (err: unknown) {
      const e = err as Record<string, unknown>;
      setApiError((e?.message as string) ?? "Activation failed. This link may have expired.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <Card>
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 size={26} strokeWidth={1.5} className="text-green-500" />
          </div>
          <h2 className="mt-5 text-xl font-extrabold text-[var(--foreground)]">Account activated!</h2>
          <p className="mt-2 text-[0.88rem] leading-6 text-[var(--muted)]">
            Your password is set. Sign in to access your portal — orders, invoices, tracking, and documents.
          </p>
          <Link
            href="/login"
            className="mt-6 flex h-[50px] w-full items-center justify-center rounded-full bg-[var(--primary)] text-[0.95rem] font-semibold text-white transition hover:bg-[var(--primary-hover)]"
          >
            Go to Login
          </Link>
        </div>
      </Card>
    );
  }

  if (!token) {
    return (
      <Card>
        <div className="text-center">
          <p className="text-[0.9rem] text-[var(--muted)]">This activation link is invalid or has expired.</p>
          <p className="mt-2 text-[0.83rem] text-[var(--muted)]">
            Please contact your Okelcor account manager to request a new invitation.
          </p>
          <Link href="/login" className="mt-4 block text-[0.88rem] font-semibold text-[var(--primary)] hover:underline">
            Go to Login
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <p className="text-[13px] font-bold uppercase tracking-[0.28em] text-[var(--primary)]">Welcome to Okelcor</p>
      <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[var(--foreground)]">Activate your account</h1>
      <p className="mt-1.5 text-[0.88rem] leading-6 text-[var(--muted)]">
        Set a password to access your portal{email ? ` for ${email}` : ""}.
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-4">
        {apiError && (
          <div role="alert" className="rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-[0.83rem] text-red-600">
            {apiError}
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-[0.82rem] font-semibold text-[var(--foreground)]">New Password</label>
          <PasswordInput
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })); }}
            error={errors.password}
          />
          {password && (
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

        <div>
          <label className="mb-1.5 block text-[0.82rem] font-semibold text-[var(--foreground)]">Confirm Password</label>
          <PasswordInput
            placeholder="Repeat your password"
            value={confirm}
            onChange={(e) => { setConfirm(e.target.value); setErrors((p) => ({ ...p, confirm: undefined })); }}
            error={errors.confirm}
          />
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
              Activating…
            </span>
          ) : "Activate Account"}
        </button>
      </form>
    </Card>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#f5f5f5]">
      <Navbar />
      <div className="flex min-h-screen items-center justify-center px-5 pt-[76px] lg:pt-20">
        <div className="w-full max-w-[420px]">
          <div className="rounded-[22px] bg-white p-8 shadow-[0_12px_40px_rgba(0,0,0,0.07)]">
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ActivatePage() {
  return (
    <Suspense fallback={null}>
      <ActivateInner />
    </Suspense>
  );
}
