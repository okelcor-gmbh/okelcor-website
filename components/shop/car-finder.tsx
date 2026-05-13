"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Car, Ruler, Search, Loader2, AlertCircle, ChevronDown, Zap, ArrowRight, Download, FileText } from "lucide-react";
import EngineLookup from "@/components/fet/engine-lookup";
import { trackTyreSpecSelected } from "@/lib/analytics";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Option       { slug: string; name: string }
interface FinderResult { car: { make: string; model: string; year: number; modification: string } | null; sizes: string[]; message: string; error?: string }

type Props = { onSizeSelect: (size: string) => void };
type Tab   = "car" | "fet";

// ── Shared styles ─────────────────────────────────────────────────────────────

const selectCls =
  "h-11 w-full appearance-none rounded-lg border border-[#e5e7eb] bg-[#fafafa] px-4 pr-9 text-[0.88rem] text-[#171a20] outline-none transition focus:border-[#f4511e] focus:bg-white focus:ring-1 focus:ring-[#f4511e]/20 disabled:cursor-not-allowed disabled:opacity-50";

function SelectWrap({ loading, children }: { loading?: boolean; children: React.ReactNode }) {
  return (
    <div className="relative flex-1 min-w-0">
      {children}
      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
        {loading
          ? <Loader2 size={13} className="animate-spin text-[#9ca3af]" />
          : <ChevronDown size={13} className="text-[#9ca3af]" />}
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CarFinder({ onSizeSelect }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("car");

  // ── Dropdown data ──────────────────────────────────────────────────────────
  const [makes,         setMakes]         = useState<Option[]>([]);
  const [models,        setModels]        = useState<Option[]>([]);
  const [years,         setYears]         = useState<number[]>([]);
  const [modifications, setModifications] = useState<Option[]>([]);

  const [makesLoading,  setMakesLoading]  = useState(false);
  const [makesError,    setMakesError]    = useState(false);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [yearsLoading,  setYearsLoading]  = useState(false);
  const [modsLoading,   setModsLoading]   = useState(false);

  // ── Selections ─────────────────────────────────────────────────────────────
  const [make,         setMake]         = useState("");
  const [model,        setModel]        = useState("");
  const [year,         setYear]         = useState("");
  const [modification, setModification] = useState("");

  // ── Result ────────────────────────────────────────────────────────────────
  const [isLoading,   setIsLoading]   = useState(false);
  const [result,      setResult]      = useState<FinderResult | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const scrollToCatalogue = () =>
    document.getElementById("shop-catalogue")?.scrollIntoView({ behavior: "smooth", block: "start" });

  // ── Step 1: load makes on mount ────────────────────────────────────────────
  useEffect(() => {
    setMakesLoading(true);
    setMakesError(false);
    fetch("/api/shop/makes")
      .then((r) => r.json())
      .then((json: { makes?: Option[]; error?: string }) => {
        if (json.makes) setMakes(json.makes);
        else setMakesError(true);
      })
      .catch(() => setMakesError(true))
      .finally(() => setMakesLoading(false));
  }, []);

  // ── Step 2: load models when make changes ──────────────────────────────────
  const handleMakeChange = (slug: string) => {
    setMake(slug);
    setModel(""); setModels([]);
    setYear(""); setYears([]);
    setModification(""); setModifications([]);
    setResult(null); setHasSearched(false);
    if (!slug) return;
    setModelsLoading(true);
    fetch(`/api/shop/models?make=${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then((json: { models?: Option[] }) => setModels(json.models ?? []))
      .catch(() => setModels([]))
      .finally(() => setModelsLoading(false));
  };

  // ── Step 3: load years when model changes ──────────────────────────────────
  const handleModelChange = (slug: string) => {
    setModel(slug);
    setYear(""); setYears([]);
    setModification(""); setModifications([]);
    setResult(null); setHasSearched(false);
    if (!slug) return;
    setYearsLoading(true);
    fetch(`/api/shop/years?make=${encodeURIComponent(make)}&model=${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then((json: { years?: number[] }) => setYears(json.years ?? []))
      .catch(() => setYears([]))
      .finally(() => setYearsLoading(false));
  };

  // ── Step 4: load modifications when year changes ───────────────────────────
  const handleYearChange = (y: string) => {
    setYear(y);
    setModification(""); setModifications([]);
    setResult(null); setHasSearched(false);
    if (!y) return;
    setModsLoading(true);
    fetch(`/api/shop/modifications?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&year=${encodeURIComponent(y)}`)
      .then((r) => r.json())
      .then((json: { modifications?: Option[] }) => setModifications(json.modifications ?? []))
      .catch(() => setModifications([]))
      .finally(() => setModsLoading(false));
  };

  const handleModificationChange = (slug: string) => {
    setModification(slug);
    setResult(null); setHasSearched(false);
  };

  // ── Step 5: search ─────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!make || !model || !year || !modification) return;
    setIsLoading(true);
    setHasSearched(true);
    setResult(null);
    try {
      const res = await fetch("/api/shop/car-finder", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ make, model, year: Number(year), modification }),
      });
      setResult(await res.json() as FinderResult);
    } catch {
      setResult({ car: null, sizes: [], message: "Could not look up tyre data. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const canSearch  = !!make && !!model && !!year && !!modification && !isLoading;
  const noResults  = result && (result.error || result.sizes.length === 0);
  const tabCls = (tab: Tab) =>
    `flex items-center gap-1.5 px-4 py-3.5 text-[0.81rem] font-semibold transition border-b-2 -mb-px sm:gap-2 sm:px-6 sm:py-4 sm:text-sm ${
      activeTab === tab
        ? tab === "fet"
          ? "border-[#22c55e] text-[#22c55e]"
          : "border-[#f4511e] text-[#f4511e]"
        : "border-transparent text-[#5c5e62] hover:text-[#171a20]"
    }`;

  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="w-full bg-[#f5f5f5] pb-0 pt-8">
      <div className="tesla-shell">
        <div className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-sm">

          {/* Tabs */}
          <div className="flex border-b border-[#f0f0f0]">
            <button type="button" onClick={() => setActiveTab("car")} className={tabCls("car")}>
              <Car size={15} /> Search by Car
            </button>
            <button type="button" onClick={scrollToCatalogue} className="flex items-center gap-1.5 border-b-2 border-transparent px-4 py-3.5 text-[0.81rem] font-semibold text-[#5c5e62] transition hover:text-[#171a20] -mb-px sm:gap-2 sm:px-6 sm:py-4 sm:text-sm">
              <Ruler size={15} /> Search by Size
            </button>
            <button type="button" onClick={() => setActiveTab("fet")} className={tabCls("fet")}>
              <Zap size={15} /> Fuel Eco Tech Shop
            </button>
          </div>

          {/* ── Search by Car ── */}
          {activeTab === "car" && (
            <div className="px-4 py-4 sm:px-5 sm:py-5">

              {makesError && (
                <div className="mb-4 flex items-start gap-2 rounded-xl border border-[#fde8e4] bg-[#fff8f7] px-4 py-3 text-[0.83rem] text-[#c0392b]">
                  <AlertCircle size={15} className="mt-0.5 shrink-0" />
                  Vehicle data unavailable. Please try again later.
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-2.5 sm:gap-3">

                {/* Row 1: Make + Model */}
                <div className="flex flex-col gap-3 sm:flex-row">

                  {/* Make */}
                  <SelectWrap loading={makesLoading}>
                    <select
                      value={make}
                      onChange={(e) => handleMakeChange(e.target.value)}
                      disabled={makesLoading || makesError}
                      className={selectCls}
                      aria-label="Vehicle make"
                    >
                      <option value="">{makesLoading ? "Loading makes…" : "Select make"}</option>
                      {makes.map((m) => <option key={m.slug} value={m.slug}>{m.name}</option>)}
                    </select>
                  </SelectWrap>

                  {/* Model */}
                  <SelectWrap loading={modelsLoading}>
                    <select
                      value={model}
                      onChange={(e) => handleModelChange(e.target.value)}
                      disabled={!make || modelsLoading}
                      className={selectCls}
                      aria-label="Vehicle model"
                    >
                      <option value="">
                        {!make ? "Select make first" : modelsLoading ? "Loading models…" : "Select model"}
                      </option>
                      {models.map((m) => <option key={m.slug} value={m.slug}>{m.name}</option>)}
                    </select>
                  </SelectWrap>
                </div>

                {/* Row 2: Year + Trim */}
                <div className="flex flex-col gap-3 sm:flex-row">

                  {/* Year */}
                  <SelectWrap loading={yearsLoading}>
                    <select
                      value={year}
                      onChange={(e) => handleYearChange(e.target.value)}
                      disabled={!model || yearsLoading}
                      className={selectCls}
                      aria-label="Vehicle year"
                    >
                      <option value="">
                        {!model ? "Select model first" : yearsLoading ? "Loading years…" : "Select year"}
                      </option>
                      {years.map((y) => <option key={y} value={String(y)}>{y}</option>)}
                    </select>
                  </SelectWrap>

                  {/* Modification / Trim */}
                  <SelectWrap loading={modsLoading}>
                    <select
                      value={modification}
                      onChange={(e) => handleModificationChange(e.target.value)}
                      disabled={!year || modsLoading}
                      className={selectCls}
                      aria-label="Vehicle trim"
                    >
                      <option value="">
                        {!year ? "Select year first" : modsLoading ? "Loading trims…" : "Select trim"}
                      </option>
                      {modifications.map((m) => <option key={m.slug} value={m.slug}>{m.name}</option>)}
                    </select>
                  </SelectWrap>
                </div>

                {/* Find Tyres button */}
                <button
                  type="submit"
                  disabled={!canSearch}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#f4511e] px-6 text-[0.88rem] font-semibold text-white transition hover:bg-[#d14f14] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:self-end"
                >
                  {isLoading
                    ? <Loader2 size={15} className="animate-spin" />
                    : <Search size={15} strokeWidth={2.2} />}
                  Find Tyres
                </button>
              </form>

              {/* Loading */}
              {isLoading && (
                <div className="mt-5 flex items-center justify-center py-6">
                  <Loader2 size={24} className="animate-spin text-[#9ca3af]" />
                </div>
              )}

              {/* Results */}
              {!isLoading && hasSearched && result && (
                <div className="mt-4 space-y-3">
                  {noResults ? (
                    <div className="flex items-start gap-2.5 rounded-xl border border-[#fde8e4] bg-[#fff8f7] px-4 py-3 text-[0.85rem] text-[#c0392b]">
                      <AlertCircle size={16} className="mt-0.5 shrink-0" />
                      <span>{result.error ?? "No tyre data found for this vehicle. Try searching by size below."}</span>
                    </div>
                  ) : (
                    <>
                      {result.car && (
                        <div className="rounded-xl border border-[#e5e7eb] bg-[#fafafa] px-4 py-2.5">
                          <p className="text-[0.85rem] font-semibold text-[#171a20]">
                            {result.car.year} {cap(result.car.make)} {cap(result.car.model)}
                          </p>
                          <p className="mt-0.5 text-[0.78rem] text-[#5c5e62]">
                            {modifications.find((m) => m.slug === result.car?.modification)?.name ?? result.car.modification}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="mb-2.5 text-[0.82rem] font-semibold text-[#5c5e62]">
                          {result.message} — click a size to search:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {result.sizes.map((size) => (
                            <button
                              key={size}
                              type="button"
                              onClick={() => { onSizeSelect(size); scrollToCatalogue(); trackTyreSpecSelected({ size }); }}
                              className="rounded-full border border-[#f4511e]/30 bg-[#fff3ee] px-4 py-1.5 text-[0.82rem] font-semibold text-[#f4511e] transition hover:bg-[#f4511e] hover:text-white"
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Fuel Eco Tech Shop ── */}
          {activeTab === "fet" && (
            <div className="px-4 py-6 sm:px-5 sm:py-7">

              {/* Header */}
              <div className="mb-5 flex flex-col gap-1">
                <div className="inline-flex items-center gap-1.5 self-start rounded-full bg-[#dcfce7] px-3 py-1">
                  <Zap size={11} strokeWidth={2.5} className="text-[#16a34a]" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#166534]">Fuel Echo Tech</span>
                </div>
                <h3 className="text-[1rem] font-extrabold text-[#111111]">Choose Your FET Model</h3>
                <p className="text-[0.82rem] leading-5 text-[#5c5e62]">
                  Certified fuel efficiency treatment — fits all diesel &amp; petrol engines. Select your vehicle type below.
                </p>
              </div>

              {/* Product grid */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {([
                  { name: "FET Passenger Car",              desc: "Cars up to 2,000 cc",                 price: "From €249", tag: "Cars & SUV"          },
                  { name: "FET Van & SUV",                  desc: "Vans & SUVs up to 3,500 kg",          price: "From €299", tag: "Cars & SUV"          },
                  { name: "FET Truck (up to 18t)",          desc: "Trucks and heavy vans",               price: "From €449", tag: "Commercial"          },
                  { name: "FET Heavy Machinery (up to 40t)", desc: "Construction, fleet & agriculture", price: "From €649", tag: "Commercial"          },
                ] as const).map(({ name, desc, price, tag }) => (
                  <div key={name} className="flex flex-col rounded-xl border border-[#e2e8e2] bg-[#f9fffe] p-4 transition hover:border-[#22c55e]/40 hover:shadow-sm">
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#dcfce7]">
                        <Zap size={18} strokeWidth={1.8} className="text-[#16a34a]" />
                      </div>
                      <span className="rounded-full bg-[#f0f2f5] px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-[0.1em] text-[#6b7280]">
                        {tag}
                      </span>
                    </div>
                    <p className="text-[0.88rem] font-extrabold leading-snug text-[#111111]">{name}</p>
                    <p className="mt-0.5 text-[0.75rem] text-[#5c5e62]">{desc}</p>
                    <p className="mt-2 text-[1rem] font-extrabold text-[#22c55e]">{price}</p>
                    <Link
                      href="/tyre-supply-quotation"
                      className="mt-auto pt-3 flex items-center justify-center gap-1.5 rounded-lg bg-[#22c55e] px-4 py-2 text-[0.78rem] font-semibold text-white transition hover:bg-[#16a34a]"
                    >
                      Request a Quote <ArrowRight size={12} strokeWidth={2.5} />
                    </Link>
                  </div>
                ))}
              </div>

              {/* Divider */}
              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-[#e2e8e2]" />
                <span className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-[#9ca3af]">Engine Compatibility</span>
                <div className="h-px flex-1 bg-[#e2e8e2]" />
              </div>

              {/* Engine lookup — compact mode */}
              <div className="mb-4">
                <p className="mb-2 text-[0.82rem] text-[#5c5e62]">
                  Search by manufacturer or engine code to confirm compatibility and find your FET model.
                </p>
                <EngineLookup compact />
              </div>

              {/* PDF downloads */}
              <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <a
                  href="/documents/FET-Engine-Overview-Cars-SUV.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-[#e2e8e2] bg-white px-4 py-3 text-[0.8rem] transition hover:border-[#22c55e]/40 hover:bg-[#f9fffe]"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#dcfce7]">
                    <FileText size={15} strokeWidth={1.8} className="text-[#16a34a]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-[#111111]">Cars, SUVs &amp; Sports</p>
                    <p className="text-[0.72rem] text-[#9ca3af]">Full engine compatibility list</p>
                  </div>
                  <Download size={13} className="shrink-0 text-[#9ca3af]" />
                </a>
                <a
                  href="/documents/FET-Engine-Overview-Commercial-Vehicles.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-[#e2e8e2] bg-white px-4 py-3 text-[0.8rem] transition hover:border-[#22c55e]/40 hover:bg-[#f9fffe]"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#dcfce7]">
                    <FileText size={15} strokeWidth={1.8} className="text-[#16a34a]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-[#111111]">Commercial Vehicles (up to 40t)</p>
                    <p className="text-[0.72rem] text-[#9ca3af]">Full engine compatibility list</p>
                  </div>
                  <Download size={13} className="shrink-0 text-[#9ca3af]" />
                </a>
              </div>

              <p className="mt-4 text-center text-[0.75rem] text-[#9ca3af]">
                Not sure which model fits? <Link href="/contact" className="text-[#22c55e] hover:underline">Contact our team</Link> for a free compatibility check.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
