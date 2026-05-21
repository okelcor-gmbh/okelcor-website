"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import Navbar from "@/components/navbar";
import { forgotPassword } from "@/lib/customer-auth";

const inputCls =
  "w-full rounded-[12px] border border-black/[0.08] bg-white px-4 py-3 text-[0.93rem] text-[var(--foreground)] outline-none placeholder:text-[var(--muted)] transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10";

export default function ForgotPasswordPage() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError("Please enter your email address"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Enter a valid email address"); return; }

    setSubmitting(true);
    setError(null);

    try {
      await forgotPassword(email);
      setSubmitted(true);
    } catch (err: unknown) {
      const e = err as Record<string, unknown>;
      const retryAfter = typeof e?.retry_after === "number" ? (e.retry_after as number) : null;
      setError(
        retryAfter
          ? `Too many attempts. Please wait ${retryAfter} seconds and try again.`
          : (e?.message as string) ?? "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f5f5f5]">
      <Navbar />

      <div className="flex min-h-screen items-center justify-center px-5 pt-[76px] lg:pt-20">
        <div className="w-full max-w-[420px]">

          {submitted ? (
            <div className="rounded-[22px] bg-white p-8 text-center shadow-[0_12px_40px_rgba(0,0,0,0.07)]">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 size={26} strokeWidth={1.5} className="text-green-500" />
              </div>
              <h2 className="mt-5 text-xl font-extrabold text-[var(--foreground)]">
                Check your email
              </h2>
              <p className="mt-2 text-[0.88rem] leading-6 text-[var(--muted)]">
                We sent a password reset link to <strong className="text-[var(--foreground)]">{email}</strong>. Check your inbox and follow the instructions.
              </p>
              <p className="mt-4 text-[0.82rem] text-[var(--muted)]">
                Didn&apos;t receive it?{" "}
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="font-medium text-[var(--primary)] hover:underline"
                >
                  Try again
                </button>
              </p>
              <Link
                href="/login"
                className="mt-5 flex items-center justify-center gap-2 text-[0.85rem] font-semibold text-[var(--muted)] transition hover:text-[var(--foreground)]"
              >
                <ArrowLeft size={15} strokeWidth={2} /> Back to login
              </Link>
            </div>
          ) : (
            <div className="rounded-[22px] bg-white p-8 shadow-[0_12px_40px_rgba(0,0,0,0.07)]">
              <h1 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]">
                Forgot password?
              </h1>
              <p className="mt-1.5 text-[0.88rem] text-[var(--muted)]">
                Enter your email and we&apos;ll send you a reset link.
              </p>

              <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-4">
                {error && (
                  <div role="alert" className="rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-[0.83rem] text-red-600">
                    {error}
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block text-[0.82rem] font-semibold text-[var(--foreground)]">
                    Email address
                  </label>
                  <input
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(null); }}
                    className={inputCls}
                    autoFocus
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
                      Sending…
                    </span>
                  ) : "Send Reset Link"}
                </button>
              </form>

              <Link
                href="/login"
                className="mt-5 flex items-center justify-center gap-2 text-[0.85rem] font-semibold text-[var(--muted)] transition hover:text-[var(--foreground)]"
              >
                <ArrowLeft size={15} strokeWidth={2} /> Back to login
              </Link>
            </div>
          )}

        </div>
      </div>
    </main>
  );
}
