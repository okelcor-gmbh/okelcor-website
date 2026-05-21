"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, MailWarning, RefreshCcw } from "lucide-react";
import Navbar from "@/components/navbar";
import { forgotPassword } from "@/lib/customer-auth";
import { useCustomerAuth } from "@/context/CustomerAuthContext";

const inputCls =
  "w-full rounded-[12px] border border-black/[0.08] bg-white px-4 py-3 text-[0.93rem] text-[var(--foreground)] outline-none placeholder:text-[var(--muted)] transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const isVerified = searchParams.get("verified") === "true";
  const { customer } = useCustomerAuth();

  const [email, setEmail] = useState(customer?.email ?? "");
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResend = async () => {
    if (!email.trim()) { setError("Please enter your email address"); return; }
    setResending(true);
    setError(null);
    try {
      await forgotPassword(email);
      setResent(true);
    } catch (err: unknown) {
      const e = err as Record<string, unknown>;
      const retryAfter = typeof e?.retry_after === "number" ? (e.retry_after as number) : null;
      setError(
        retryAfter
          ? `Too many attempts. Please wait ${retryAfter} seconds and try again.`
          : (e?.message as string) ?? "Failed to resend. Please try again."
      );
    } finally {
      setResending(false);
    }
  };

  if (isVerified) {
    return (
      <main className="min-h-screen bg-[#f5f5f5]">
        <Navbar />
        <div className="flex min-h-screen items-center justify-center px-5 pt-[76px] lg:pt-20">
          <div className="w-full max-w-[420px] rounded-[22px] bg-white p-8 text-center shadow-[0_12px_40px_rgba(0,0,0,0.07)]">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 size={26} strokeWidth={1.5} className="text-green-500" />
            </div>
            <h2 className="mt-5 text-xl font-extrabold text-[var(--foreground)]">
              Email verified!
            </h2>
            <p className="mt-2 text-[0.88rem] leading-6 text-[var(--muted)]">
              Your email address has been verified. You can now access your account.
            </p>
            <Link
              href="/login"
              className="mt-6 flex h-[50px] w-full items-center justify-center rounded-full bg-[var(--primary)] text-[0.95rem] font-semibold text-white transition hover:bg-[var(--primary-hover)]"
            >
              Sign In
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f5f5]">
      <Navbar />

      <div className="flex min-h-screen items-center justify-center px-5 pt-[76px] lg:pt-20">
        <div className="w-full max-w-[420px]">
          <div className="rounded-[22px] bg-white p-8 text-center shadow-[0_12px_40px_rgba(0,0,0,0.07)]">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-orange-100">
              <MailWarning size={26} strokeWidth={1.6} className="text-[var(--primary)]" />
            </div>
            <h1 className="mt-5 text-xl font-extrabold text-[var(--foreground)]">
              Verify your email address
            </h1>
            <p className="mt-2 text-[0.88rem] leading-6 text-[var(--muted)]">
              Check your inbox for a verification link. If you didn&apos;t receive it, we can send a new one.
            </p>

            {resent ? (
              <div className="mt-6 flex items-center justify-center gap-2 text-[0.88rem] text-green-600">
                <CheckCircle2 size={16} /> Verification email sent
              </div>
            ) : (
              <div className="mt-6 flex flex-col gap-3">
                {error && (
                  <p role="alert" className="text-[0.82rem] text-red-500">{error}</p>
                )}
                {!customer?.email && (
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(null); }}
                    className={inputCls}
                  />
                )}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="flex h-[46px] w-full items-center justify-center gap-2 rounded-full bg-[var(--primary)] text-[0.9rem] font-semibold text-white transition hover:bg-[var(--primary-hover)] disabled:opacity-60"
                >
                  <RefreshCcw size={15} className={resending ? "animate-spin" : ""} />
                  {resending ? "Sending…" : "Resend Verification Email"}
                </button>
              </div>
            )}

            <Link
              href="/login"
              className="mt-4 block text-[0.82rem] text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
