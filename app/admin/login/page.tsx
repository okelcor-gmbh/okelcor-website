"use client";

import { useRef, useState, useTransition } from "react";
import { loginAdmin, submitAdminTwoFactor } from "@/app/admin/actions";

// ── Spinner shared between both views ─────────────────────────────────────────

function Spinner() {
  return (
    <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

function ErrorAlert({ message }: { message: string }) {
  return (
    <div role="alert" className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
      <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      </svg>
      <p className="text-[0.83rem] text-red-700">{message}</p>
    </div>
  );
}

// ── Password form ──────────────────────────────────────────────────────────────

function PasswordForm({
  onTwoFaRequired,
}: {
  onTwoFaRequired: (sessionToken: string) => void;
}) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await loginAdmin(email, password);
      if (!result) return; // redirect happened
      if ("requires_2fa" in result) {
        onTwoFaRequired(result.session_token);
        return;
      }
      if (result.error) setError(result.error);
    });
  };

  return (
    <div className="rounded-2xl bg-white p-8 shadow-2xl shadow-black/40">
      {error && <ErrorAlert message={error} />}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <div>
          <label htmlFor="admin-email" className="mb-1.5 block text-[0.82rem] font-semibold text-[#1a1a1a]">
            Email address
          </label>
          <input
            id="admin-email"
            type="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@okelcor.com"
            className="w-full rounded-xl border border-black/[0.10] bg-[#f5f5f5] px-4 py-3 text-[0.93rem] text-[#1a1a1a] outline-none placeholder:text-[#aaa] transition focus:border-[#E85C1A] focus:bg-white focus:ring-2 focus:ring-[#E85C1A]/15"
          />
        </div>

        <div>
          <label htmlFor="admin-password" className="mb-1.5 block text-[0.82rem] font-semibold text-[#1a1a1a]">
            Password
          </label>
          <input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-xl border border-black/[0.10] bg-[#f5f5f5] px-4 py-3 text-[0.93rem] text-[#1a1a1a] outline-none placeholder:text-[#aaa] transition focus:border-[#E85C1A] focus:bg-white focus:ring-2 focus:ring-[#E85C1A]/15"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="mt-1 flex h-[52px] w-full items-center justify-center rounded-full bg-[#E85C1A] text-[0.95rem] font-semibold text-white transition hover:bg-[#d14f14] disabled:opacity-60"
        >
          {isPending ? (
            <span className="flex items-center gap-2"><Spinner />Signing in…</span>
          ) : "Sign in"}
        </button>
      </form>
    </div>
  );
}

// ── 2FA challenge ──────────────────────────────────────────────────────────────

function TwoFactorChallenge({
  sessionToken,
  onBack,
}: {
  sessionToken: string;
  onBack: () => void;
}) {
  const [code, setCode]   = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInput = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 6);
    setCode(digits);
    if (error) setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError("Please enter the 6-digit code from your authenticator app.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await submitAdminTwoFactor(sessionToken, code);
      if (!result) return; // redirect happened
      if (result.error) {
        setError(result.error);
        setCode("");
        inputRef.current?.focus();
      }
    });
  };

  return (
    <div className="rounded-2xl bg-white p-8 shadow-2xl shadow-black/40">
      <div className="mb-5 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#E85C1A]/10">
          <svg className="h-6 w-6 text-[#E85C1A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
        </div>
        <h2 className="text-[1.05rem] font-extrabold text-[#1a1a1a]">Two-Factor Authentication</h2>
        <p className="mt-1 text-[0.82rem] text-[#5c5e62]">
          Enter the 6-digit code from your authenticator app.
        </p>
      </div>

      {error && <ErrorAlert message={error} />}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <div>
          <label htmlFor="totp-code" className="mb-1.5 block text-[0.82rem] font-semibold text-[#1a1a1a]">
            Authentication code
          </label>
          <input
            ref={inputRef}
            id="totp-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            value={code}
            onChange={(e) => handleInput(e.target.value)}
            placeholder="000000"
            maxLength={6}
            className="w-full rounded-xl border border-black/[0.10] bg-[#f5f5f5] px-4 py-3 text-center text-[1.4rem] font-bold tracking-[0.35em] text-[#1a1a1a] outline-none placeholder:text-[#ccc] placeholder:tracking-normal transition focus:border-[#E85C1A] focus:bg-white focus:ring-2 focus:ring-[#E85C1A]/15"
          />
        </div>

        <button
          type="submit"
          disabled={isPending || code.length !== 6}
          className="flex h-[52px] w-full items-center justify-center rounded-full bg-[#E85C1A] text-[0.95rem] font-semibold text-white transition hover:bg-[#d14f14] disabled:opacity-60"
        >
          {isPending ? (
            <span className="flex items-center gap-2"><Spinner />Verifying…</span>
          ) : "Verify"}
        </button>

        <button
          type="button"
          onClick={onBack}
          className="text-center text-[0.82rem] text-[#5c5e62] hover:text-[#1a1a1a] transition"
        >
          ← Back to sign in
        </button>
      </form>

      <p className="mt-4 text-center text-[0.75rem] text-[#9ca3af]">
        Lost access to your app? Use a recovery code instead.
      </p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminLoginPage() {
  const [twoFaSessionToken, setTwoFaTempToken] = useState<string | null>(null);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#111111] p-4">
      <div className="w-full max-w-[400px]">

        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E85C1A]">
            <span className="text-xl font-extrabold tracking-tight text-white">OK</span>
          </div>
          <div>
            <p className="text-[1.4rem] font-extrabold text-white">Okelcor Admin</p>
            <p className="mt-0.5 text-[0.83rem] text-white/40">
              {twoFaSessionToken ? "Verify your identity" : "Sign in to manage your content"}
            </p>
          </div>
        </div>

        {twoFaSessionToken ? (
          <TwoFactorChallenge
            sessionToken={twoFaSessionToken}
            onBack={() => setTwoFaTempToken(null)}
          />
        ) : (
          <PasswordForm onTwoFaRequired={setTwoFaTempToken} />
        )}

        <p className="mt-6 text-center text-[0.75rem] text-white/25">
          Okelcor GmbH · Admin Panel
        </p>
      </div>
    </div>
  );
}
