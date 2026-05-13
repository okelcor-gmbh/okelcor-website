"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

// ── Vehicle presets — mirrors the /fet amortization calculator ────────────────

type VehiclePreset = {
  label: string;
  fetCost: number;
  consumption: number; // L/100 km
  defaultMileage: number;
};

const VEHICLES: VehiclePreset[] = [
  { label: "Passenger Car",   fetCost: 299, consumption: 7,  defaultMileage: 15000  },
  { label: "Van / SUV",       fetCost: 399, consumption: 10, defaultMileage: 30000  },
  { label: "Truck up to 18t", fetCost: 499, consumption: 25, defaultMileage: 80000  },
  { label: "Truck up to 40t", fetCost: 599, consumption: 32, defaultMileage: 100000 },
];

// ── Shared input / label styles (dark theme) ──────────────────────────────────

const inputCls =
  "w-full rounded-[10px] border border-white/10 bg-white/[0.06] px-4 py-3 text-[0.93rem] text-white outline-none placeholder:text-white/30 transition focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20";

const labelCls =
  "mb-1.5 block text-[0.74rem] font-semibold uppercase tracking-wider text-white/45";

// ─────────────────────────────────────────────────────────────────────────────

export default function FetRoiStrip() {
  const [vehicleIdx, setVehicleIdx] = useState(0);
  const [mileage, setMileage]       = useState(VEHICLES[0].defaultMileage.toString());
  const [fuelPrice, setFuelPrice]   = useState("1.65");
  const [savingsPct, setSavingsPct] = useState(10);

  const vehicle = VEHICLES[vehicleIdx];

  const handleVehicleChange = (idx: number) => {
    setVehicleIdx(idx);
    setMileage(VEHICLES[idx].defaultMileage.toString());
  };

  // Same formula as AmortizationCalculator (km mode only for these presets)
  const results = useMemo(() => {
    const km    = parseFloat(mileage)   || 0;
    const price = parseFloat(fuelPrice) || 0;
    const pct   = savingsPct / 100;

    const annualLitres   = (vehicle.consumption / 100) * km;
    const annualFuelCost = annualLitres * price;
    const annualSavings  = annualFuelCost * pct;
    const paybackMonths  = annualSavings > 0 ? (vehicle.fetCost / annualSavings) * 12 : null;

    return { annualSavings, paybackMonths };
  }, [mileage, fuelPrice, savingsPct, vehicle]);

  const fmt = (n: number) =>
    n.toLocaleString("de-DE", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <section className="w-full bg-[#0a0f1e] py-16 md:py-20">
      <div className="tesla-shell grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">

        {/* ── Left — copy ──────────────────────────────────────────────────── */}
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#10b981]/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-[#10b981]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#10b981]" aria-hidden="true" />
            Fuel Echo Tech
          </span>

          <h2 className="mt-4 text-[2rem] font-extrabold leading-tight tracking-tight text-white sm:text-[2.4rem] lg:text-[2.6rem]">
            How much could<br className="hidden sm:block" /> you save?
          </h2>

          <p className="mt-4 max-w-[420px] text-[1rem] leading-7 text-white/55">
            Enter your vehicle details and see your estimated annual fuel savings in seconds.
          </p>

          <Link
            href="/fet"
            className="mt-6 inline-flex items-center gap-1.5 text-[0.9rem] font-semibold text-[#10b981] transition hover:text-white"
          >
            See full details <ArrowRight size={15} strokeWidth={2.2} />
          </Link>
        </div>

        {/* ── Right — calculator ───────────────────────────────────────────── */}
        <div className="rounded-[22px] border border-white/[0.07] bg-white/[0.03] p-6 sm:p-8">

          {/* Vehicle selector */}
          <div className="mb-5">
            <label className={labelCls}>Vehicle Type</label>
            <div className="grid grid-cols-2 gap-2">
              {VEHICLES.map((v, i) => (
                <button
                  key={v.label}
                  type="button"
                  onClick={() => handleVehicleChange(i)}
                  className={[
                    "rounded-[10px] border px-3 py-2.5 text-left text-[0.78rem] font-semibold transition",
                    vehicleIdx === i
                      ? "border-[#10b981] bg-[#10b981]/15 text-[#10b981]"
                      : "border-white/10 text-white/45 hover:border-white/20 hover:text-white/75",
                  ].join(" ")}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          {/* Inputs */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className={labelCls}>Annual km</label>
              <input
                type="number"
                min="0"
                step="1000"
                value={mileage}
                onChange={(e) => setMileage(e.target.value)}
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Fuel price (€/L)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={fuelPrice}
                onChange={(e) => setFuelPrice(e.target.value)}
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>FET device cost</label>
              <input
                type="text"
                readOnly
                value={`€${vehicle.fetCost}`}
                className={`${inputCls} cursor-default opacity-50`}
              />
            </div>
          </div>

          {/* Savings slider */}
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between">
              <label className={`${labelCls} mb-0`}>Expected fuel savings</label>
              <span className="text-[1rem] font-extrabold text-[#10b981]">{savingsPct}%</span>
            </div>
            <input
              type="range"
              min="8"
              max="15"
              step="1"
              value={savingsPct}
              onChange={(e) => setSavingsPct(Number(e.target.value))}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-[#10b981]"
            />
            <div className="mt-1.5 flex justify-between text-[0.7rem] text-white/25">
              <span>Conservative 8%</span>
              <span>Optimistic 15%</span>
            </div>
          </div>

          {/* Live results */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-[14px] border border-[#10b981]/25 bg-[#10b981]/10 p-4 text-center">
              <p className="text-[0.68rem] font-bold uppercase tracking-wider text-[#10b981]/70">
                Annual Savings
              </p>
              <p className="mt-2 text-[1.9rem] font-extrabold leading-none text-[#10b981]">
                €{fmt(results.annualSavings)}
              </p>
              <p className="mt-1.5 text-[0.68rem] text-[#10b981]/55">Per year with FET</p>
            </div>

            <div className="rounded-[14px] border border-white/[0.08] bg-white/[0.04] p-4 text-center">
              <p className="text-[0.68rem] font-bold uppercase tracking-wider text-white/40">
                Payback Period
              </p>
              <p className="mt-2 text-[1.9rem] font-extrabold leading-none text-white">
                {results.paybackMonths !== null
                  ? results.paybackMonths < 12
                    ? `${Math.ceil(results.paybackMonths)} mo`
                    : `${(results.paybackMonths / 12).toFixed(1)} yr`
                  : "—"}
              </p>
              <p className="mt-1.5 text-[0.68rem] text-white/30">Time to break even</p>
            </div>
          </div>

          {/* CTA */}
          <Link
            href="/tyre-supply-quotation"
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[#10b981] py-3.5 text-[0.92rem] font-bold text-white transition hover:bg-[#0d9e6e]"
          >
            Request a Quote <ArrowRight size={15} strokeWidth={2.2} />
          </Link>

          <p className="mt-3 text-center text-[0.68rem] leading-5 text-white/20">
            Estimates based on field and lab test data. Actual savings vary by vehicle condition and driving pattern.
          </p>
        </div>

      </div>
    </section>
  );
}
