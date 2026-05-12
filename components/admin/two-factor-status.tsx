"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ShieldCheck, ShieldOff, AlertCircle, Loader2, Download, CheckCircle2, RefreshCw } from "lucide-react";
import TwoFactorSetup from "@/components/admin/two-factor-setup";

type TwoFaStatus = "loading" | "enabled" | "disabled" | "unavailable";

type StatusData = {
  enabled: boolean;
  recovery_codes_count?: number;
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

// ── Disable section ───────────────────────────────────────────────────────────

function DisableSection({ onDisabled }: { onDisabled: () => void }) {
  const [password, setPassword]   = useState("");
  const [error, setError]         = useState<string | null>(null);
  const [disabling, setDisabling] = useState(false);
  const [expanded, setExpanded]   = useState(false);

  const handleDisable = async () => {
    if (!password.trim()) { setError("Please enter your account password."); return; }
    setDisabling(true);
    setError(null);
    try {
      const res  = await fetch("/api/admin/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const json = await res.json().catch(() => ({})) as { message?: string };
      if (!res.ok) { setError(json.message ?? "Disable failed. Check your password and try again."); return; }
      onDisabled();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setDisabling(false);
    }
  };

  const handleCancel = () => { setExpanded(false); setError(null); setPassword(""); };

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="rounded-full border border-red-200 px-4 py-2 text-[0.8rem] font-semibold text-red-600 transition hover:border-red-400 hover:bg-red-50"
      >
        Disable 2FA
      </button>
    );
  }

  return (
    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
      <p className="mb-1 text-[0.82rem] font-semibold text-red-800">Disable Two-Factor Authentication</p>
      <p className="mb-3 text-[0.78rem] text-red-700">Enter your account password to confirm.</p>

      {error && (
        <div className="mb-3 flex items-start gap-2 rounded-lg border border-red-300 bg-white px-3 py-2">
          <AlertCircle size={13} className="mt-0.5 shrink-0 text-red-500" />
          <p className="text-[0.78rem] text-red-700">{error}</p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <input
          id="disable-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); if (error) setError(null); }}
          placeholder="Your password"
          className="rounded-xl border border-black/[0.10] bg-white px-4 py-2.5 text-[0.875rem] text-[#1a1a1a] outline-none placeholder:text-[#bbb] transition focus:border-red-400 focus:ring-2 focus:ring-red-200"
        />
        <button
          type="button"
          onClick={handleDisable}
          disabled={disabling || !password.trim()}
          className="flex h-[42px] items-center gap-1.5 rounded-full bg-red-600 px-5 text-[0.82rem] font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
        >
          {disabling ? <><Loader2 size={13} className="animate-spin" />Disabling…</> : "Confirm disable"}
        </button>
        <button type="button" onClick={handleCancel} className="text-[0.8rem] text-[#5c5e62] hover:text-[#1a1a1a] transition">
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Regenerate section ────────────────────────────────────────────────────────

function RegenerateSection() {
  const [password, setPassword]  = useState("");
  const [error, setError]        = useState<string | null>(null);
  const [regenerating, setRegen] = useState(false);
  const [newCodes, setNewCodes]  = useState<string[] | null>(null);
  const [expanded, setExpanded]  = useState(false);

  const handleRegenerate = async () => {
    if (!password.trim()) { setError("Please enter your account password."); return; }
    setRegen(true);
    setError(null);
    try {
      const res  = await fetch("/api/admin/2fa/recovery-codes/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const json = await res.json().catch(() => ({})) as {
        data?: { recovery_codes?: string[] };
        message?: string;
      };
      if (!res.ok) { setError(json.message ?? "Failed. Check your password and try again."); return; }
      setNewCodes(json.data?.recovery_codes ?? []);
      setPassword("");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setRegen(false);
    }
  };

  const handleCancel = () => { setExpanded(false); setError(null); setPassword(""); };

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="flex items-center gap-1.5 rounded-full border border-black/[0.10] px-4 py-2 text-[0.8rem] font-semibold text-[#5c5e62] transition hover:border-black/20 hover:text-[#1a1a1a]"
      >
        <RefreshCw size={13} strokeWidth={2} />
        Regenerate recovery codes
      </button>
    );
  }

  if (newCodes) {
    return (
      <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <div className="mb-3 flex items-center gap-2">
          <CheckCircle2 size={15} className="text-emerald-600" />
          <p className="text-[0.82rem] font-semibold text-emerald-800">New recovery codes generated</p>
        </div>
        <p className="mb-3 text-[0.78rem] text-emerald-700">
          Your old codes have been invalidated. Save these immediately.
        </p>
        <div className="mb-3 grid grid-cols-2 gap-2 rounded-xl border border-emerald-200 bg-white p-3">
          {newCodes.map((c, i) => (
            <code key={i} className="rounded-lg bg-[#f8f8f8] px-3 py-1.5 text-center font-mono text-[0.78rem] font-semibold text-[#1a1a1a]">{c}</code>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => downloadRecoveryCodes(newCodes)}
            className="flex items-center gap-1.5 rounded-full border border-emerald-300 px-4 py-2 text-[0.8rem] font-semibold text-emerald-700 transition hover:bg-emerald-100"
          >
            <Download size={13} strokeWidth={2} />
            Download codes
          </button>
          <button
            type="button"
            onClick={() => { setNewCodes(null); setExpanded(false); }}
            className="text-[0.8rem] text-[#5c5e62] hover:text-[#1a1a1a] transition"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
      <p className="mb-1 text-[0.82rem] font-semibold text-amber-800">Regenerate recovery codes</p>
      <p className="mb-3 text-[0.78rem] text-amber-700">
        This will invalidate all existing recovery codes. Enter your account password to confirm.
      </p>

      {error && (
        <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-300 bg-white px-3 py-2">
          <AlertCircle size={13} className="mt-0.5 shrink-0 text-amber-600" />
          <p className="text-[0.78rem] text-amber-800">{error}</p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <input
          id="regen-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); if (error) setError(null); }}
          placeholder="Your password"
          className="rounded-xl border border-black/[0.10] bg-white px-4 py-2.5 text-[0.875rem] text-[#1a1a1a] outline-none placeholder:text-[#bbb] transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
        />
        <button
          type="button"
          onClick={handleRegenerate}
          disabled={regenerating || !password.trim()}
          className="flex h-[42px] items-center gap-1.5 rounded-full bg-amber-600 px-5 text-[0.82rem] font-semibold text-white transition hover:bg-amber-700 disabled:opacity-60"
        >
          {regenerating ? <><Loader2 size={13} className="animate-spin" />Regenerating…</> : "Regenerate"}
        </button>
        <button type="button" onClick={handleCancel} className="text-[0.8rem] text-[#5c5e62] hover:text-[#1a1a1a] transition">
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function TwoFactorStatus() {
  const [status, setStatus]         = useState<TwoFaStatus>("loading");
  const [statusData, setStatusData] = useState<StatusData | null>(null);
  const [showSetup, setShowSetup]   = useState(false);
  const hasFetched = useRef(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res  = await fetch("/api/admin/2fa/status");
      const json = await res.json().catch(() => ({})) as {
        _unavailable?: boolean;
        data?: StatusData;
        message?: string;
      };

      if (!res.ok || json._unavailable) {
        setStatus("unavailable");
        return;
      }

      const data = json.data ?? (json as unknown as StatusData);
      setStatusData(data);
      setStatus(data.enabled ? "enabled" : "disabled");
    } catch {
      setStatus("unavailable");
    }
  }, []);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchStatus();
  }, [fetchStatus]);

  return (
    <>
      <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#E85C1A]">
            Two-Factor Authentication
          </p>
          {status === "enabled" && (
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-[0.72rem] font-bold text-emerald-700">
              <ShieldCheck size={12} strokeWidth={2.5} />
              Enabled
            </span>
          )}
          {status === "disabled" && (
            <span className="flex items-center gap-1.5 rounded-full bg-[#efefef] px-3 py-1 text-[0.72rem] font-bold text-[#5c5e62]">
              <ShieldOff size={12} strokeWidth={2.5} />
              Not enabled
            </span>
          )}
        </div>

        {status === "loading" && (
          <div className="flex items-center gap-2 text-[0.83rem] text-[#5c5e62]">
            <Loader2 size={14} className="animate-spin" />
            Checking 2FA status…
          </div>
        )}

        {status === "unavailable" && (
          <p className="text-[0.83rem] text-[#9ca3af]">
            2FA management is not yet available — backend endpoint pending.
          </p>
        )}

        {status === "disabled" && (
          <div>
            <p className="mb-4 text-[0.83rem] text-[#5c5e62]">
              Add an extra layer of security to your account. After enabling, you will need your authenticator app each time you sign in.
            </p>
            <button
              type="button"
              onClick={() => setShowSetup(true)}
              className="flex items-center gap-2 rounded-full bg-[#E85C1A] px-5 py-2.5 text-[0.85rem] font-semibold text-white transition hover:bg-[#d14f14]"
            >
              <ShieldCheck size={14} strokeWidth={2} />
              Enable 2FA
            </button>
          </div>
        )}

        {status === "enabled" && (
          <div>
            <p className="mb-4 text-[0.83rem] text-[#5c5e62]">
              Two-factor authentication is active on your account.
              {statusData?.recovery_codes_count != null && (
                <> You have <strong className="text-[#1a1a1a]">{statusData.recovery_codes_count}</strong> recovery code{statusData.recovery_codes_count !== 1 ? "s" : ""} remaining.</>
              )}
            </p>
            <div className="flex flex-wrap gap-3">
              <RegenerateSection />
              <DisableSection onDisabled={() => { setStatus("disabled"); setStatusData(null); }} />
            </div>
          </div>
        )}
      </div>

      {showSetup && (
        <TwoFactorSetup
          onClose={() => setShowSetup(false)}
          onEnabled={() => { setStatus("enabled"); fetchStatus(); }}
        />
      )}
    </>
  );
}
