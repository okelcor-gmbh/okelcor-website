"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Loader2 } from "lucide-react";

type VatStatus = "idle" | "loading" | "valid" | "invalid" | "unavailable";

const inputCls =
  "flex-1 rounded-[12px] border border-black/[0.08] bg-white px-4 py-3.5 text-[0.93rem] text-[var(--foreground)] outline-none placeholder:text-[var(--muted)] transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10";

export default function VatField({
  value,
  onChange,
  onValidationChange,
  required = false,
}: {
  value: string;
  onChange: (v: string) => void;
  onValidationChange?: (valid: boolean) => void;
  required?: boolean;
}) {
  const [status, setStatus] = useState<VatStatus>("idle");

  const handleValidate = async () => {
    if (!value.trim()) return;
    setStatus("loading");
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
      const res = await fetch(`${API_URL}/vat/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vat_number: value.trim() }),
      });
      if (res.status === 503 || res.status === 502 || res.status === 504) {
        setStatus("unavailable");
        onValidationChange?.(false);
        return;
      }
      const data = await res.json();
      const valid = data.data?.valid === true;
      setStatus(valid ? "valid" : "invalid");
      onValidationChange?.(valid);
    } catch {
      setStatus("unavailable");
      onValidationChange?.(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    if (status !== "idle") {
      setStatus("idle");
      onValidationChange?.(false);
    }
  };

  return (
    <div>
      <label className="mb-1.5 block text-[0.82rem] font-semibold text-[var(--foreground)]">
        VAT Number
        {required ? (
          <span className="ml-0.5 text-[var(--primary)]">*</span>
        ) : (
          <span className="ml-1.5 text-[0.75rem] font-normal text-[var(--muted)]">(optional)</span>
        )}
      </label>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="e.g. DE123456789"
          value={value}
          onChange={handleChange}
          className={inputCls}
        />
        <button
          type="button"
          onClick={handleValidate}
          disabled={!value.trim() || status === "loading"}
          className="flex h-[52px] min-w-[90px] items-center justify-center rounded-[12px] border border-black/[0.08] bg-white px-4 text-[0.85rem] font-semibold text-[var(--foreground)] transition hover:bg-[#f0f0f0] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "loading" ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            "Validate"
          )}
        </button>
      </div>

      {status === "valid" && (
        <p className="mt-1.5 flex items-center gap-1.5 text-[0.78rem] font-medium text-green-600">
          <CheckCircle2 size={14} strokeWidth={2} />
          Valid EU VAT number
        </p>
      )}
      {status === "invalid" && (
        <p className="mt-1.5 flex items-center gap-1.5 text-[0.78rem] font-medium text-red-500">
          <XCircle size={14} strokeWidth={2} />
          VAT number not found in EU registry
        </p>
      )}
      {status === "unavailable" && (
        <p className="mt-1.5 flex items-center gap-1.5 text-[0.78rem] font-medium text-amber-600">
          <AlertTriangle size={14} strokeWidth={2} />
          Validation unavailable, you can still proceed
        </p>
      )}
    </div>
  );
}
