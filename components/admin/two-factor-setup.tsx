"use client";

import { useCallback, useRef, useState } from "react";
import { X, ShieldCheck, QrCode, KeyRound, Copy, Download, CheckCircle2, Loader2, AlertCircle } from "lucide-react";

type Step = "generating" | "scan" | "verify" | "codes";

type SetupData = {
  qr_data_url: string;
  manual_entry: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function downloadRecoveryCodes(codes: string[]) {
  const text = [
    "Okelcor Admin — Recovery Codes",
    "================================",
    "Store these codes somewhere safe. Each code can only be used once.",
    "",
    ...codes,
    "",
    `Generated: ${new Date().toISOString()}`,
  ].join("\n");
  const blob = new Blob([text], { type: "text/plain" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = "okelcor-admin-recovery-codes.txt";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Step components ───────────────────────────────────────────────────────────

function StepScan({
  data,
  onNext,
}: {
  data: SetupData;
  onNext: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(data.manual_entry).catch(() => null);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [data.manual_entry]);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-[0.82rem] font-semibold text-[#1a1a1a]">
          1. Open your authenticator app
        </p>
        <p className="mt-0.5 text-[0.78rem] text-[#5c5e62]">
          Google Authenticator, Authy, 1Password, or any TOTP app.
        </p>
      </div>

      <div>
        <p className="mb-2 text-[0.82rem] font-semibold text-[#1a1a1a]">
          2. Scan the QR code
        </p>
        {data.qr_data_url ? (
          <div className="flex justify-center rounded-xl border border-black/[0.08] bg-white p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.qr_data_url}
              alt="2FA QR code"
              width={200}
              height={200}
              className="rounded"
            />
          </div>
        ) : (
          <div className="flex h-[200px] items-center justify-center rounded-xl border border-black/[0.08] bg-[#f8f8f8]">
            <div className="text-center">
              <QrCode size={32} className="mx-auto mb-2 text-[#9ca3af]" />
              <p className="text-[0.75rem] text-[#9ca3af]">QR code unavailable</p>
            </div>
          </div>
        )}
      </div>

      <div>
        <p className="mb-1.5 text-[0.82rem] font-semibold text-[#1a1a1a]">
          3. Or enter the key manually
        </p>
        <div className="flex items-center gap-2 rounded-xl border border-black/[0.08] bg-[#f8f8f8] px-4 py-3">
          <code className="flex-1 break-all font-mono text-[0.82rem] text-[#1a1a1a]">
            {data.manual_entry}
          </code>
          <button
            type="button"
            onClick={handleCopy}
            className="shrink-0 rounded-lg p-1.5 transition hover:bg-black/5"
            title="Copy secret"
          >
            {copied
              ? <CheckCircle2 size={15} className="text-emerald-500" />
              : <Copy size={15} className="text-[#5c5e62]" />
            }
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={onNext}
        className="flex h-[46px] w-full items-center justify-center rounded-full bg-[#E85C1A] text-[0.9rem] font-semibold text-white transition hover:bg-[#d14f14]"
      >
        Next: Verify code
      </button>
    </div>
  );
}

function StepVerify({
  onSuccess,
  onBack,
}: {
  onSuccess: (codes: string[]) => void;
  onBack: () => void;
}) {
  const [code, setCode]         = useState("");
  const [error, setError]       = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInput = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 6);
    setCode(digits);
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError("Please enter the full 6-digit code.");
      return;
    }
    setVerifying(true);
    setError(null);
    try {
      const res  = await fetch("/api/admin/2fa/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const json = await res.json().catch(() => ({})) as {
        data?: { recovery_codes?: string[] };
        message?: string;
      };

      if (!res.ok) {
        setError(json.message ?? "Invalid code. Please try again.");
        setCode("");
        inputRef.current?.focus();
        return;
      }

      const codes: string[] = json.data?.recovery_codes ?? [];
      onSuccess(codes);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div>
        <p className="text-[0.82rem] text-[#5c5e62]">
          Enter the 6-digit code your authenticator app is currently showing to confirm the setup.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <AlertCircle size={14} className="mt-0.5 shrink-0 text-red-500" />
          <p className="text-[0.82rem] text-red-700">{error}</p>
        </div>
      )}

      <div>
        <label htmlFor="2fa-verify-code" className="mb-1.5 block text-[0.82rem] font-semibold text-[#1a1a1a]">
          Authentication code
        </label>
        <input
          ref={inputRef}
          id="2fa-verify-code"
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
        disabled={verifying || code.length !== 6}
        className="flex h-[46px] w-full items-center justify-center rounded-full bg-[#E85C1A] text-[0.9rem] font-semibold text-white transition hover:bg-[#d14f14] disabled:opacity-60"
      >
        {verifying
          ? <span className="flex items-center gap-2"><Loader2 size={15} className="animate-spin" />Verifying…</span>
          : "Enable 2FA"
        }
      </button>

      <button
        type="button"
        onClick={onBack}
        className="text-center text-[0.82rem] text-[#5c5e62] hover:text-[#1a1a1a] transition"
      >
        ← Back to QR code
      </button>
    </form>
  );
}

function StepCodes({
  codes,
  onDone,
}: {
  codes: string[];
  onDone: () => void;
}) {
  const [confirmed, setConfirmed] = useState(false);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <AlertCircle size={15} className="mt-0.5 shrink-0 text-amber-600" />
        <p className="text-[0.82rem] text-amber-800">
          Save these recovery codes now. They will not be shown again. Each code can be used once if you lose access to your authenticator app.
        </p>
      </div>

      <div className="rounded-xl border border-black/[0.08] bg-[#f8f8f8] p-4">
        <div className="grid grid-cols-2 gap-2">
          {codes.map((c, i) => (
            <code key={i} className="rounded-lg bg-white px-3 py-2 text-center font-mono text-[0.82rem] font-semibold text-[#1a1a1a] shadow-sm">
              {c}
            </code>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => downloadRecoveryCodes(codes)}
        className="flex h-[42px] w-full items-center justify-center gap-2 rounded-full border border-black/[0.10] bg-white text-[0.85rem] font-semibold text-[#1a1a1a] transition hover:bg-[#f5f5f5]"
      >
        <Download size={14} strokeWidth={2} />
        Download codes (.txt)
      </button>

      <label className="flex cursor-pointer items-start gap-2.5">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded accent-[#E85C1A]"
        />
        <span className="text-[0.82rem] text-[#5c5e62]">
          I have saved my recovery codes in a safe place.
        </span>
      </label>

      <button
        type="button"
        onClick={onDone}
        disabled={!confirmed}
        className="flex h-[46px] w-full items-center justify-center gap-2 rounded-full bg-emerald-600 text-[0.9rem] font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
      >
        <CheckCircle2 size={15} strokeWidth={2} />
        Done — 2FA is enabled
      </button>
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────

export default function TwoFactorSetup({
  onClose,
  onEnabled,
}: {
  onClose: () => void;
  onEnabled: () => void;
}) {
  const [step, setStep]           = useState<Step>("generating");
  const [setupData, setSetupData] = useState<SetupData | null>(null);
  const [genError, setGenError]   = useState<string | null>(null);
  const [codes, setCodes]         = useState<string[]>([]);

  // Kick off generation on mount
  const generate = useCallback(async () => {
    setStep("generating");
    setGenError(null);
    try {
      const res  = await fetch("/api/admin/2fa/enable", { method: "POST" });
      const json = await res.json().catch(() => ({})) as {
        data?: { qr_data_url?: string; manual_entry?: string };
        message?: string;
      };
      if (!res.ok) {
        setGenError(json.message ?? "Could not generate 2FA secret. Please try again.");
        return;
      }
      setSetupData({
        qr_data_url:  json.data?.qr_data_url  ?? "",
        manual_entry: json.data?.manual_entry ?? "",
      });
      setStep("scan");
    } catch {
      setGenError("Network error. Please try again.");
    }
  }, []);

  // Trigger generation on first render
  useState(() => { generate(); });

  const STEP_TITLES: Record<Step, string> = {
    generating: "Setting up 2FA…",
    scan:       "Scan QR Code",
    verify:     "Verify Setup",
    codes:      "Recovery Codes",
  };

  const STEP_ICONS: Record<Step, React.ReactNode> = {
    generating: <Loader2 size={20} className="animate-spin text-[#E85C1A]" />,
    scan:       <QrCode size={20} className="text-[#E85C1A]" />,
    verify:     <ShieldCheck size={20} className="text-[#E85C1A]" />,
    codes:      <KeyRound size={20} className="text-[#E85C1A]" />,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-[460px] rounded-2xl bg-white shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/[0.07] px-6 py-4">
          <div className="flex items-center gap-2.5">
            {STEP_ICONS[step]}
            <h2 className="text-[0.95rem] font-bold text-[#1a1a1a]">{STEP_TITLES[step]}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 transition hover:bg-black/5"
          >
            <X size={16} className="text-[#5c5e62]" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex gap-1 border-b border-black/[0.07] px-6 py-3">
          {(["scan", "verify", "codes"] as const).map((s, i) => (
            <div key={s} className="flex flex-1 items-center gap-1">
              <div className={`h-1.5 flex-1 rounded-full transition-colors ${
                step === "generating" ? "bg-[#efefef]"
                : s === "scan"   && ["scan","verify","codes"].includes(step) ? "bg-[#E85C1A]"
                : s === "verify" && ["verify","codes"].includes(step) ? "bg-[#E85C1A]"
                : s === "codes"  && step === "codes" ? "bg-[#E85C1A]"
                : "bg-[#efefef]"
              }`} />
              {i < 2 && <div className="w-1" />}
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="p-6">
          {step === "generating" && (
            <div className="flex flex-col items-center gap-3 py-8">
              {genError ? (
                <>
                  <AlertCircle size={32} className="text-red-500" />
                  <p className="text-center text-[0.85rem] text-red-700">{genError}</p>
                  <button
                    type="button"
                    onClick={generate}
                    className="mt-2 rounded-full bg-[#E85C1A] px-6 py-2 text-[0.85rem] font-semibold text-white transition hover:bg-[#d14f14]"
                  >
                    Try again
                  </button>
                </>
              ) : (
                <>
                  <Loader2 size={32} className="animate-spin text-[#E85C1A]" />
                  <p className="text-[0.85rem] text-[#5c5e62]">Generating secure secret…</p>
                </>
              )}
            </div>
          )}

          {step === "scan" && setupData && (
            <StepScan
              data={setupData}
              onNext={() => setStep("verify")}
            />
          )}

          {step === "verify" && (
            <StepVerify
              onSuccess={(recoveryCodes) => { setCodes(recoveryCodes); setStep("codes"); }}
              onBack={() => setStep("scan")}
            />
          )}

          {step === "codes" && (
            <StepCodes
              codes={codes}
              onDone={() => { onEnabled(); onClose(); }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
