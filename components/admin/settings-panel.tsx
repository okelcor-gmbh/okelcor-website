"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { updateSettingsBulk } from "@/app/admin/settings/actions";
import type { AdminSetting } from "@/lib/admin-api";

// ── Static settings schema ────────────────────────────────────────────────────
// Fields are always shown regardless of what the API returns.
// API values override the defaults when present.

type FieldDef = {
  key:      string;
  label:    string;
  type:     "text" | "email" | "tel" | "number" | "url" | "password" | "toggle" | "textarea";
  default:  string;
  span?:    boolean;   // true → full row width
  hint?:    string;    // placeholder text
  note?:    string;    // small helper note below the field
};

type GroupDef = {
  group:  string;
  label:  string;
  fields: FieldDef[];
};

const SCHEMA: GroupDef[] = [
  {
    group: "company",
    label: "Company Information",
    fields: [
      { key: "company_name",    label: "Company Name",      type: "text",     default: "Okelcor GmbH" },
      { key: "company_email",   label: "Contact Email",     type: "email",    default: "support@okelcor.com" },
      { key: "company_phone",   label: "Phone Number",      type: "tel",      default: "+49 (0) 89 / 545 583 60" },
      { key: "company_fax",     label: "Fax Number",        type: "tel",      default: "+49 (0) 89 / 545 583 33" },
      {
        key: "company_address", label: "Full Address",      type: "textarea", default: "Landsberger Str. 155, 80687 Munich, Germany",
        span: true,
      },
    ],
  },
  {
    group: "payment",
    label: "Payment Methods (Legacy)",
    fields: [
      {
        key: "adyen_enabled", label: "Adyen (legacy inactive) - Card / Apple Pay / Google Pay / Klarna",
        type: "toggle", default: "false",
        note: "Legacy/inactive until Okelcor account/API credentials are approved. Active checkout uses Stripe Checkout.",
      },
      {
        key: "paypal_enabled", label: "PayPal",
        type: "toggle", default: "false",
      },
      {
        key: "klarna_enabled", label: "Klarna (legacy inactive) - Buy Now, Pay Later",
        type: "toggle", default: "false",
        note: "Legacy/inactive as part of the Adyen setup until account/API credentials are approved.",
      },
      {
        key: "adyen_client_key", label: "Adyen Client Key (legacy inactive)",
        type: "text", default: "", span: true, hint: "test_XXXX… or live_XXXX…",
        note: "Retained for later approval. Stripe Checkout is the active payment route.",
      },
      {
        key: "paypal_client_id", label: "PayPal Client ID",
        type: "text", default: "", span: true, hint: "Client ID from developer.paypal.com",
      },
    ],
  },
  {
    group: "shop",
    label: "Shop & Commerce",
    fields: [
      { key: "vat_rate",                label: "VAT Rate (%)",              type: "number", default: "19" },
      { key: "default_currency",        label: "Currency Code",             type: "text",   default: "EUR",  hint: "EUR, USD, GBP…" },
      { key: "free_shipping_threshold", label: "Free Shipping Above (€)",   type: "number", default: "0",   hint: "0 = always free" },
      { key: "order_prefix",            label: "Order Reference Prefix",    type: "text",   default: "OKL", hint: "e.g. OKL → OKL-00123" },
    ],
  },
  {
    group: "site",
    label: "Site Configuration",
    fields: [
      {
        key: "maintenance_mode", label: "Maintenance Mode",
        type: "toggle", default: "false",
        note: "When enabled, the backend can return a 503 to block public traffic.",
      },
      {
        key: "site_tagline", label: "Site Tagline",
        type: "text", default: "Growing Together", span: true,
      },
      {
        key: "google_analytics_id", label: "Google Analytics ID",
        type: "text", default: "", hint: "G-XXXXXXXXXX",
      },
      {
        key: "contact_email", label: "Contact Form Recipient",
        type: "email", default: "support@okelcor.com",
      },
      {
        key: "quote_email", label: "Quote Request Recipient",
        type: "email", default: "support@okelcor.com",
      },
    ],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function mergeWithSchema(apiSettings: AdminSetting[]): Record<string, string> {
  // Start with schema defaults
  const values: Record<string, string> = {};
  for (const group of SCHEMA) {
    for (const field of group.fields) {
      values[field.key] = field.default;
    }
  }
  // Override with API values
  for (const s of apiSettings) {
    values[s.key] = s.value;
  }
  return values;
}

// ── Toggle field ──────────────────────────────────────────────────────────────

function ToggleField({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: string;
  onChange: (key: string, val: string) => void;
}) {
  const on = value === "true" || value === "1";
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-black/[0.07] bg-[#fafafa] px-4 py-3">
      <div className="flex items-center justify-between gap-4">
        <p className="text-[0.875rem] font-semibold text-[#1a1a1a]">{field.label}</p>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          onClick={() => onChange(field.key, on ? "false" : "true")}
          className={[
            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",
            on ? "bg-[#f4511e]" : "bg-gray-200",
          ].join(" ")}
        >
          <span
            className={[
              "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200",
              on ? "translate-x-5" : "translate-x-0",
            ].join(" ")}
          />
        </button>
      </div>
      {field.note && (
        <p className="text-[0.73rem] leading-relaxed text-[#5c5e62]">{field.note}</p>
      )}
    </div>
  );
}

// ── Password field (show/hide) ────────────────────────────────────────────────

function PasswordField({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: string;
  onChange: (key: string, val: string) => void;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        placeholder={field.hint ?? ""}
        onChange={(e) => onChange(field.key, e.target.value)}
        className="h-10 w-full rounded-xl border border-black/[0.09] bg-white pl-3.5 pr-10 text-[0.875rem] text-[#1a1a1a] outline-none placeholder:text-[#aaa] transition focus:border-[#f4511e] focus:ring-2 focus:ring-[#f4511e]/10"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5c5e62] transition hover:text-[#1a1a1a]"
        aria-label={show ? "Hide value" : "Show value"}
      >
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  );
}

// ── Generic field ─────────────────────────────────────────────────────────────

function SettingField({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: string;
  onChange: (key: string, val: string) => void;
}) {
  if (field.type === "toggle") {
    return <ToggleField field={field} value={value} onChange={onChange} />;
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[0.78rem] font-semibold uppercase tracking-[0.1em] text-[#5c5e62]">
        {field.label}
      </label>

      {field.type === "textarea" ? (
        <textarea
          value={value}
          placeholder={field.hint ?? ""}
          onChange={(e) => onChange(field.key, e.target.value)}
          rows={3}
          className="w-full resize-none rounded-xl border border-black/[0.09] bg-white px-3.5 py-2.5 text-[0.875rem] text-[#1a1a1a] outline-none placeholder:text-[#aaa] transition focus:border-[#f4511e] focus:ring-2 focus:ring-[#f4511e]/10"
        />
      ) : field.type === "password" ? (
        <PasswordField field={field} value={value} onChange={onChange} />
      ) : (
        <input
          type={field.type}
          value={value}
          placeholder={field.hint ?? ""}
          onChange={(e) => onChange(field.key, e.target.value)}
          className="h-10 w-full rounded-xl border border-black/[0.09] bg-white px-3.5 text-[0.875rem] text-[#1a1a1a] outline-none placeholder:text-[#aaa] transition focus:border-[#f4511e] focus:ring-2 focus:ring-[#f4511e]/10"
        />
      )}

      {field.note && (
        <p className="text-[0.73rem] leading-relaxed text-[#5c5e62]">{field.note}</p>
      )}
    </div>
  );
}

// ── Settings group card ───────────────────────────────────────────────────────

function SettingsGroup({
  def,
  values,
  onChange,
}: {
  def: GroupDef;
  values: Record<string, string>;
  onChange: (key: string, val: string) => void;
}) {
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [, startTransition]   = useTransition();

  const handleSave = () => {
    setSaving(true);
    setSaved(false);
    setError(null);
    const updates = def.fields.map((f) => ({ key: f.key, value: values[f.key] ?? f.default }));
    startTransition(async () => {
      const result = await updateSettingsBulk(updates);
      if (result.error) {
        setError(result.error);
        setSaving(false);
      } else {
        setSaved(true);
        setSaving(false);
        setTimeout(() => setSaved(false), 3000);
      }
    });
  };

  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-sm">
      {/* Header */}
      <div className="border-b border-black/[0.06] px-6 py-4">
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[#f4511e]">
          {def.label}
        </p>
      </div>

      {/* Fields */}
      <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
        {def.fields.map((field) => (
          <div key={field.key} className={field.span ? "sm:col-span-2" : ""}>
            <SettingField field={field} value={values[field.key] ?? field.default} onChange={onChange} />
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/[0.06] px-6 py-4">
        <div className="min-h-[18px]">
          {error && (
            <div className="flex items-center gap-2 text-[0.8rem] text-red-600">
              <AlertCircle size={13} className="shrink-0" />
              {error}
            </div>
          )}
          {saved && !error && (
            <div className="flex items-center gap-2 text-[0.8rem] text-emerald-600">
              <CheckCircle2 size={13} className="shrink-0" />
              Saved successfully.
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="h-9 rounded-full bg-[#f4511e] px-5 text-[0.8rem] font-semibold text-white transition hover:bg-[#df4618] disabled:opacity-50"
        >
          {saving ? "Saving…" : `Save ${def.label}`}
        </button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function SettingsPanel({ settings }: { settings: AdminSetting[] }) {
  const [values, setValues] = useState<Record<string, string>>(
    () => mergeWithSchema(settings)
  );

  const handleChange = (key: string, val: string) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  };

  return (
    <div className="flex flex-col gap-6">
      {SCHEMA.map((def) => (
        <SettingsGroup
          key={def.group}
          def={def}
          values={values}
          onChange={handleChange}
        />
      ))}
    </div>
  );
}
