"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { CheckCircle, Download, AlertCircle } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

type DeclarationStatus = "pending" | "signed" | "acknowledged";

interface Props {
  orderRef: string;
  orderCountry?: string | null;
  status?: DeclarationStatus | null;
  signedAt?: string | null;
  signedName?: string | null;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const EU_STATES = [
  { code: "AT", name: "Austria" },
  { code: "BE", name: "Belgium" },
  { code: "BG", name: "Bulgaria" },
  { code: "HR", name: "Croatia" },
  { code: "CY", name: "Cyprus" },
  { code: "CZ", name: "Czech Republic" },
  { code: "DK", name: "Denmark" },
  { code: "EE", name: "Estonia" },
  { code: "FI", name: "Finland" },
  { code: "FR", name: "France" },
  { code: "DE", name: "Germany" },
  { code: "GR", name: "Greece" },
  { code: "HU", name: "Hungary" },
  { code: "IE", name: "Ireland" },
  { code: "IT", name: "Italy" },
  { code: "LV", name: "Latvia" },
  { code: "LT", name: "Lithuania" },
  { code: "LU", name: "Luxembourg" },
  { code: "MT", name: "Malta" },
  { code: "NL", name: "Netherlands" },
  { code: "PL", name: "Poland" },
  { code: "PT", name: "Portugal" },
  { code: "RO", name: "Romania" },
  { code: "SK", name: "Slovakia" },
  { code: "SI", name: "Slovenia" },
  { code: "ES", name: "Spain" },
  { code: "SE", name: "Sweden" },
];

const MONTHS = [
  { v: "01", l: "January" },
  { v: "02", l: "February" },
  { v: "03", l: "March" },
  { v: "04", l: "April" },
  { v: "05", l: "May" },
  { v: "06", l: "June" },
  { v: "07", l: "July" },
  { v: "08", l: "August" },
  { v: "09", l: "September" },
  { v: "10", l: "October" },
  { v: "11", l: "November" },
  { v: "12", l: "December" },
];

function getYears(): number[] {
  const y = new Date().getFullYear();
  return [y, y - 1, y - 2];
}

function findStateCode(country?: string | null): string {
  if (!country) return "";
  const upper = country.toUpperCase();
  const byCode = EU_STATES.find(s => s.code === upper);
  if (byCode) return byCode.code;
  const byName = EU_STATES.find(s => s.name.toUpperCase() === upper);
  return byName?.code ?? "";
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch { return iso; }
}

// ── Small helpers ──────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-[0.72rem] font-bold uppercase tracking-[0.15em] text-[var(--primary)]">
      {children}
    </p>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
      {children}
    </p>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-[0.75rem] text-red-600">{msg}</p>;
}

// ── Download helper ────────────────────────────────────────────────────────────

async function triggerDownload(orderRef: string, setLoading: (v: boolean) => void) {
  setLoading(true);
  try {
    const res = await fetch(`/api/account/orders/${orderRef}/declaration/download`);
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `EU-Entry-Certificate-${orderRef}.pdf`;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch {
    // silently fail — user can retry
  } finally {
    setLoading(false);
  }
}

// ── Download button (shared) ───────────────────────────────────────────────────

function DownloadButton({ orderRef }: { orderRef: string }) {
  const [loading, setLoading] = useState(false);
  return (
    <button
      type="button"
      onClick={() => triggerDownload(orderRef, setLoading)}
      disabled={loading}
      className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-green-300 bg-white px-3.5 py-1.5 text-[0.78rem] font-semibold text-green-700 transition hover:bg-green-100 disabled:opacity-60"
    >
      <Download size={13} strokeWidth={2.2} />
      {loading ? "Downloading…" : "Download Certificate"}
    </button>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function EntryCertificateCard({
  orderRef,
  orderCountry,
  status,
  signedAt,
  signedName,
}: Props) {
  const [localStatus, setLocalStatus] = useState<DeclarationStatus | null>(status ?? null);
  const [localSignedAt, setLocalSignedAt] = useState<string | null>(signedAt ?? null);
  const [localSignedName, setLocalSignedName] = useState<string | null>(signedName ?? null);

  // ── Form state ──────────────────────────────────────────────────────────────

  const [form, setForm] = useState({
    receivedMonth: "",
    receivedYear: String(new Date().getFullYear()),
    memberState: findStateCode(orderCountry),
    placeOfEntry: "",
    ownTransport: false,
    transportMonth: "",
    transportYear: String(new Date().getFullYear()),
    repName: "",
    repTitle: "",
    signedName: "",
    acceptedTerms: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");
  const [signatureDrawn, setSignatureDrawn] = useState(false);

  // ── Canvas signature pad ────────────────────────────────────────────────────

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hasSignatureRef = useRef(false);

  useEffect(() => {
    if (localStatus === "signed" || localStatus === "acknowledged") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    let drawing = false;

    const onDown = (e: PointerEvent) => {
      drawing = true;
      canvas.setPointerCapture(e.pointerId);
      const r = canvas.getBoundingClientRect();
      ctx.beginPath();
      ctx.moveTo(e.clientX - r.left, e.clientY - r.top);
      e.preventDefault();
    };

    const onMove = (e: PointerEvent) => {
      if (!drawing) return;
      const r = canvas.getBoundingClientRect();
      ctx.lineTo(e.clientX - r.left, e.clientY - r.top);
      ctx.stroke();
      if (!hasSignatureRef.current) {
        hasSignatureRef.current = true;
        setSignatureDrawn(true);
      }
      e.preventDefault();
    };

    const onUp = () => { drawing = false; };

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);

    return () => {
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
    };
  }, [localStatus]);

  const clearSignature = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasSignatureRef.current = false;
    setSignatureDrawn(false);
  }, []);

  // ── Validation ──────────────────────────────────────────────────────────────

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (!form.receivedMonth) errs.receivedMonth = "Select month";
    if (!form.memberState) errs.memberState = "Select EU member state";
    if (!form.placeOfEntry.trim()) errs.placeOfEntry = "Enter place of entry";
    if (form.ownTransport) {
      if (!form.transportMonth) errs.transportMonth = "Select month";
    }
    if (!form.repName.trim()) errs.repName = "Enter representative name";
    if (!form.signedName.trim()) {
      errs.signedName = "Enter your name";
    } else if (form.signedName.trim() !== form.signedName.trim().toUpperCase()) {
      errs.signedName = "Name must be in CAPITALS";
    }
    if (!hasSignatureRef.current) errs.signature = "Signature is required";
    if (!form.acceptedTerms) errs.acceptedTerms = "You must accept the declaration";
    return errs;
  }

  // ── Submit ──────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setSubmitting(true);
    setApiError("");

    const signatureData = canvasRef.current?.toDataURL("image/png") ?? "";
    const payload = {
      month_received: `${form.receivedMonth}/${form.receivedYear}`,
      member_state: form.memberState,
      place_of_entry: form.placeOfEntry.trim(),
      own_transport: form.ownTransport,
      month_transport_ended: form.ownTransport
        ? `${form.transportMonth}/${form.transportYear}`
        : null,
      representative_name: form.repName.trim(),
      representative_title: form.repTitle.trim() || null,
      signed_name: form.signedName.trim(),
      signature_data: signatureData,
      accepted_terms: true,
    };

    try {
      const res = await fetch(`/api/account/orders/${orderRef}/declaration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let msg = "Failed to submit. Please try again.";
        try {
          const data = await res.json() as { message?: string };
          if (data.message) msg = data.message;
        } catch { /* ignore parse error */ }
        setApiError(msg);
        setSubmitting(false);
        return;
      }

      setLocalSignedAt(new Date().toISOString());
      setLocalSignedName(form.signedName.trim());
      setLocalStatus("signed");
    } catch {
      setApiError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  // ── Acknowledged state ──────────────────────────────────────────────────────

  if (localStatus === "acknowledged") {
    return (
      <div className="rounded-[18px] border border-green-200 bg-green-50 p-4 sm:rounded-[22px] sm:p-6 lg:p-8">
        <div className="flex items-start gap-3">
          <CheckCircle size={20} className="mt-0.5 shrink-0 text-green-600" strokeWidth={2} />
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-green-700 sm:text-[11px]">
              EU Entry Certificate — Confirmed
            </p>
            <p className="mt-1 text-[0.88rem] font-semibold text-green-800">
              Okelcor has acknowledged your signed Gelangensbestätigung. This declaration is complete.
            </p>
            {localSignedAt && (
              <p className="mt-0.5 text-[0.78rem] text-green-600">
                Signed {fmtDate(localSignedAt)}{localSignedName ? ` · ${localSignedName}` : ""}
              </p>
            )}
            <DownloadButton orderRef={orderRef} />
          </div>
        </div>
      </div>
    );
  }

  // ── Signed state ────────────────────────────────────────────────────────────

  if (localStatus === "signed") {
    return (
      <div className="rounded-[18px] border border-green-200 bg-green-50 p-4 sm:rounded-[22px] sm:p-6 lg:p-8">
        <div className="flex items-start gap-3">
          <CheckCircle size={20} className="mt-0.5 shrink-0 text-green-500" strokeWidth={2} />
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-green-700 sm:text-[11px]">
              EU Entry Certificate — Submitted
            </p>
            <p className="mt-1 text-[0.88rem] font-semibold text-green-800">
              Your declaration has been received and is awaiting acknowledgement from Okelcor.
            </p>
            {localSignedAt && (
              <p className="mt-0.5 text-[0.78rem] text-green-600">
                Submitted {fmtDate(localSignedAt)}{localSignedName ? ` by ${localSignedName}` : ""}
              </p>
            )}
            <DownloadButton orderRef={orderRef} />
          </div>
        </div>
      </div>
    );
  }

  // ── Pending state: full form ────────────────────────────────────────────────

  const years = getYears();
  const selectCls =
    "w-full appearance-none rounded-[12px] border border-black/[0.12] bg-white px-3 py-2.5 text-[0.88rem] text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20";
  const inputCls =
    "w-full rounded-[12px] border border-black/[0.12] bg-white px-3 py-2.5 text-[0.88rem] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20";

  return (
    <div className="rounded-[18px] border border-amber-200 bg-amber-50 sm:rounded-[22px]">

      {/* Header */}
      <div className="px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:pt-8">
        <div className="flex items-start gap-2.5">
          <AlertCircle size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-amber-600 sm:mt-1" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-700 sm:text-[11px]">
              Action Required — EU Entry Certificate
            </p>
            <p className="mt-0.5 text-[0.82rem] leading-relaxed text-amber-800">
              As a reverse-charge B2B delivery to the EU, this order requires a signed
              Gelangensbestätigung (§17a UStDV) confirming that the goods have entered your country.
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate>
        <div className="flex flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">

          {/* Section 1 — Goods Receipt */}
          <div>
            <SectionTitle>Goods Receipt</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2">

              {/* Month / Year received */}
              <div>
                <FieldLabel>Month Goods Received</FieldLabel>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <select
                      value={form.receivedMonth}
                      onChange={e => setForm(p => ({ ...p, receivedMonth: e.target.value }))}
                      className={`${selectCls}${errors.receivedMonth ? " border-red-400" : ""}`}
                    >
                      <option value="">Month</option>
                      {MONTHS.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
                    </select>
                    <FieldError msg={errors.receivedMonth} />
                  </div>
                  <div>
                    <select
                      value={form.receivedYear}
                      onChange={e => setForm(p => ({ ...p, receivedYear: e.target.value }))}
                      className={selectCls}
                    >
                      {years.map(y => <option key={y} value={String(y)}>{y}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* EU Member State */}
              <div>
                <FieldLabel>EU Member State of Delivery</FieldLabel>
                <select
                  value={form.memberState}
                  onChange={e => setForm(p => ({ ...p, memberState: e.target.value }))}
                  className={`${selectCls}${errors.memberState ? " border-red-400" : ""}`}
                >
                  <option value="">Select country</option>
                  {EU_STATES.map(s => (
                    <option key={s.code} value={s.code}>{s.name} ({s.code})</option>
                  ))}
                </select>
                <FieldError msg={errors.memberState} />
              </div>

              {/* Place of entry */}
              <div className="sm:col-span-2">
                <FieldLabel>Place of Entry / Customs Office</FieldLabel>
                <input
                  type="text"
                  value={form.placeOfEntry}
                  onChange={e => setForm(p => ({ ...p, placeOfEntry: e.target.value }))}
                  placeholder="e.g. Port of Rotterdam, Amsterdam Airport"
                  className={`${inputCls}${errors.placeOfEntry ? " border-red-400" : ""}`}
                />
                <FieldError msg={errors.placeOfEntry} />
              </div>

              {/* Own transport */}
              <div className="sm:col-span-2">
                <label className="flex cursor-pointer items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={form.ownTransport}
                    onChange={e => setForm(p => ({ ...p, ownTransport: e.target.checked }))}
                    className="h-4 w-4 rounded accent-[var(--primary)]"
                  />
                  <span className="text-[0.85rem] text-[var(--foreground)]">
                    Goods transported on own account (own vehicle)
                  </span>
                </label>
              </div>

              {/* Conditional: month transport ended */}
              {form.ownTransport && (
                <div>
                  <FieldLabel>Month Transport Ended</FieldLabel>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <select
                        value={form.transportMonth}
                        onChange={e => setForm(p => ({ ...p, transportMonth: e.target.value }))}
                        className={`${selectCls}${errors.transportMonth ? " border-red-400" : ""}`}
                      >
                        <option value="">Month</option>
                        {MONTHS.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
                      </select>
                      <FieldError msg={errors.transportMonth} />
                    </div>
                    <div>
                      <select
                        value={form.transportYear}
                        onChange={e => setForm(p => ({ ...p, transportYear: e.target.value }))}
                        className={selectCls}
                      >
                        {years.map(y => <option key={y} value={String(y)}>{y}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Section 2 — Authorised Representative */}
          <div>
            <SectionTitle>Authorised Representative</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel>Full Name</FieldLabel>
                <input
                  type="text"
                  value={form.repName}
                  onChange={e => setForm(p => ({ ...p, repName: e.target.value }))}
                  placeholder="Name of person completing this form"
                  className={`${inputCls}${errors.repName ? " border-red-400" : ""}`}
                />
                <FieldError msg={errors.repName} />
              </div>
              <div>
                <FieldLabel>Title / Position (optional)</FieldLabel>
                <input
                  type="text"
                  value={form.repTitle}
                  onChange={e => setForm(p => ({ ...p, repTitle: e.target.value }))}
                  placeholder="e.g. Purchasing Manager"
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          {/* Section 3 — Signature */}
          <div>
            <SectionTitle>Signature</SectionTitle>

            {/* Signed name in CAPITALS */}
            <div className="mb-4">
              <FieldLabel>Print Full Name in Capitals</FieldLabel>
              <input
                type="text"
                value={form.signedName}
                onChange={e => setForm(p => ({ ...p, signedName: e.target.value.toUpperCase() }))}
                placeholder="FULL NAME IN CAPITALS"
                className={`${inputCls} font-mono tracking-wider${errors.signedName ? " border-red-400" : ""}`}
              />
              <FieldError msg={errors.signedName} />
            </div>

            {/* Canvas signature pad */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <FieldLabel>Signature</FieldLabel>
                <button
                  type="button"
                  onClick={clearSignature}
                  className="text-[0.72rem] font-semibold text-[var(--muted)] underline-offset-2 hover:text-[var(--foreground)] hover:underline"
                >
                  Clear
                </button>
              </div>
              <div className={`overflow-hidden rounded-[12px] border bg-white${errors.signature && !signatureDrawn ? " border-red-400" : " border-black/[0.12]"}`}>
                <canvas
                  ref={canvasRef}
                  className="block h-[140px] w-full cursor-crosshair"
                  style={{ touchAction: "none" }}
                />
                <div className="border-t border-black/[0.06] bg-[#fafafa] px-3 py-1.5">
                  <p className="text-[0.68rem] text-[var(--muted)]">
                    Draw your signature using mouse, touchscreen, or stylus
                  </p>
                </div>
              </div>
              {errors.signature && !signatureDrawn && (
                <p className="mt-1 text-[0.75rem] text-red-600">{errors.signature}</p>
              )}
            </div>
          </div>

          {/* Legal declaration checkbox */}
          <div className="rounded-[12px] border border-amber-200 bg-white/60 p-4">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={form.acceptedTerms}
                onChange={e => setForm(p => ({ ...p, acceptedTerms: e.target.checked }))}
                className="mt-0.5 h-4 w-4 shrink-0 rounded accent-[var(--primary)]"
              />
              <span className="text-[0.8rem] leading-relaxed text-[var(--foreground)]">
                I hereby confirm and declare that the goods described in the above-mentioned
                invoice / delivery note have arrived at their destination in an EU member state.
                I understand that this declaration is a legally binding document under §17a UStDV
                (German Turnover Tax Execution Ordinance) and that any false statement may result
                in criminal liability.
              </span>
            </label>
            <FieldError msg={errors.acceptedTerms} />
          </div>

          {/* API error */}
          {apiError && (
            <div className="rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-[0.83rem] text-red-700">
              {apiError}
            </div>
          )}

          {/* Submit */}
          <div>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-[46px] items-center justify-center rounded-full bg-[var(--primary)] px-8 text-[0.9rem] font-semibold text-white transition hover:bg-[var(--primary-hover)] disabled:opacity-60 sm:w-auto"
            >
              {submitting ? "Submitting…" : "Submit EU Entry Certificate"}
            </button>
          </div>

        </div>
      </form>
    </div>
  );
}
