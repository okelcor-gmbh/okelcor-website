"use client";

import { ShieldCheck } from "lucide-react";
import { useLanguage } from "@/context/language-context";

export default function FetVerifiedStrip() {
  const { t } = useLanguage();

  return (
    <section className="w-full bg-[#0d2b1a] py-8 md:py-10">
      <div className="tesla-shell flex flex-col items-center gap-4 sm:flex-row sm:justify-between">

        {/* ISO badge — certification code is not translatable */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#22c55e]/20">
            <ShieldCheck size={15} strokeWidth={2} className="text-[#22c55e]" />
          </div>
          <span className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-[#22c55e]">
            ISO 9001:2015
          </span>
        </div>

        {/* Centre copy */}
        <p className="text-center text-[0.88rem] font-medium leading-6 text-white/70 sm:text-[0.9rem]">
          {t.fetVerified.copy}
        </p>

        {/* Field Tested pill */}
        <div className="flex items-center gap-1.5 rounded-full bg-[#22c55e]/15 px-3.5 py-1.5 ring-1 ring-[#22c55e]/30">
          <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" aria-hidden="true" />
          <span className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-[#22c55e]">
            {t.fetVerified.fieldTested}
          </span>
        </div>

      </div>
    </section>
  );
}
