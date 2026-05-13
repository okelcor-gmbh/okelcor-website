"use client";

import Link from "next/link";
import { Mail, Phone, MapPin, Clock, CheckCircle2, ShieldCheck, Globe } from "lucide-react";
import { useLanguage } from "@/context/language-context";
import { COMPANY_EMAIL, COMPANY_PHONE } from "@/lib/constants";

const STEP_NUMS = ["01", "02", "03"];
const WHY_ICONS = [Clock, CheckCircle2, Globe, ShieldCheck];

export default function QuoteSummary() {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col gap-5">

      {/* What happens next */}
      <div className="rounded-[22px] bg-[#efefef] p-7 md:p-8">
        <p className="text-[13px] font-bold uppercase tracking-[0.28em] text-[var(--primary)]">
          {t.quote.summary.stepsEyebrow}
        </p>
        <h3 className="mt-2 text-xl font-extrabold tracking-tight text-[var(--foreground)]">
          {t.quote.summary.stepsHeading}
        </h3>

        <div className="mt-6 flex flex-col gap-5">
          {t.quote.summary.steps.map((step, i) => (
            <div key={i} className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/10">
                <span className="text-[0.7rem] font-extrabold text-[var(--primary)]">{STEP_NUMS[i]}</span>
              </div>
              <div>
                <p className="text-[0.9rem] font-semibold text-[var(--foreground)]">{step.title}</p>
                <p className="mt-0.5 text-[0.83rem] leading-5 text-[var(--muted)]">{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Why Okelcor */}
      <div className="rounded-[22px] bg-[#efefef] p-7 md:p-8">
        <p className="text-[13px] font-bold uppercase tracking-[0.28em] text-[var(--primary)]">
          {t.quote.summary.whyEyebrow}
        </p>
        <h3 className="mt-2 text-xl font-extrabold tracking-tight text-[var(--foreground)]">
          {t.quote.summary.whyHeading}
        </h3>
        <ul className="mt-5 flex flex-col gap-3.5">
          {t.quote.summary.whyItems.map((text, i) => {
            const Icon = WHY_ICONS[i];
            return (
            <li key={text} className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white">
                <Icon size={14} strokeWidth={1.8} className="text-[var(--primary)]" />
              </div>
              <span className="text-[0.88rem] text-[var(--muted)]">{text}</span>
            </li>
            );
          })}
        </ul>
      </div>

      {/* Contact fallback */}
      <div className="rounded-[22px] bg-[var(--primary)] p-7 md:p-8">
        <p className="text-[13px] font-bold uppercase tracking-[0.28em] text-white/70">
          {t.quote.summary.contactEyebrow}
        </p>
        <h3 className="mt-2 text-xl font-extrabold text-white">
          {t.quote.summary.contactHeading}
        </h3>
        <div className="mt-5 flex flex-col gap-3.5">
          {[
            { Icon: Mail,    value: COMPANY_EMAIL },
            { Icon: Phone,   value: COMPANY_PHONE },
            { Icon: MapPin,  value: "Munich, Germany" },
          ].map(({ Icon, value }) => (
            <div key={value} className="flex items-center gap-3">
              <Icon size={14} strokeWidth={1.8} className="shrink-0 text-white/70" />
              <span className="text-[0.88rem] font-medium text-white/90">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Internal SEO link */}
      <div className="rounded-[22px] bg-[#efefef] px-7 py-4">
        <Link
          href="/about"
          className="flex items-center gap-2 text-[0.85rem] font-semibold text-[var(--primary)] hover:underline"
        >
          <Globe size={14} strokeWidth={1.8} />
          International logistics support
        </Link>
      </div>

    </div>
  );
}
