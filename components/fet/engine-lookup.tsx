"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Loader2, Car, Truck, ChevronRight } from "lucide-react";
import Link from "next/link";

export type FetEngine = {
  id: number;
  category: "cars_suv" | "commercial";
  manufacturer: string;
  model_series: string;
  engine_code?: string | null;
  displacement?: string | null;
  fuel_type: "diesel" | "petrol" | "both";
  fet_model: string;
  notes?: string | null;
};

type CategoryFilter = "all" | "cars_suv" | "commercial";

const FUEL_LABELS: Record<string, string> = {
  diesel:  "Diesel",
  petrol:  "Petrol",
  both:    "Diesel / Petrol",
};

export default function EngineLookup({ compact = false }: { compact?: boolean }) {
  const [search,   setSearch]   = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [engines,  setEngines]  = useState<FetEngine[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [total,    setTotal]    = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      fetchEngines();
    }, 350);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category]);

  async function fetchEngines() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim())       params.set("search",   search.trim());
      if (category !== "all")  params.set("category", category);
      const res  = await fetch(`/api/shop/fet-engines?${params}`);
      const json = await res.json().catch(() => ({ data: [] }));
      setEngines(Array.isArray(json.data) ? json.data : []);
      setTotal(json.meta?.total ?? json.data?.length ?? 0);
    } catch {
      setEngines([]);
    } finally {
      setLoading(false);
    }
  }

  const fetModelColor = (model: string) => {
    if (model.toLowerCase().includes("car") || model.includes("01"))  return "bg-[#dcfce7] text-[#166534]";
    if (model.toLowerCase().includes("van") || model.includes("02"))  return "bg-blue-50 text-blue-700";
    if (model.toLowerCase().includes("truck") || model.includes("03")) return "bg-amber-50 text-amber-700";
    return "bg-purple-50 text-purple-700";
  };

  return (
    <div className={compact ? "" : "rounded-2xl border border-[#e2e8e2] bg-white p-6 shadow-sm"}>
      {!compact && (
        <div className="mb-5">
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.22em] text-[#22c55e]">
            Engine Lookup
          </p>
          <h3 className="mt-0.5 text-[1.1rem] font-extrabold text-[#111111]">
            Is your engine compatible?
          </h3>
          <p className="mt-1 text-[0.82rem] leading-5 text-[#6b7280]">
            Search by manufacturer or engine code to find your recommended FET model.
          </p>
        </div>
      )}

      {/* Search + filter bar */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search manufacturer, model or engine code…"
            className="h-10 w-full rounded-xl border border-[#e2e8e2] bg-[#f9fafb] pl-9 pr-3 text-[0.83rem] text-[#111111] outline-none transition focus:border-[#22c55e] focus:bg-white focus:ring-2 focus:ring-[#22c55e]/15"
          />
          {loading && (
            <Loader2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[#9ca3af]" />
          )}
        </div>

        <div className="flex gap-1.5">
          {(["all", "cars_suv", "commercial"] as CategoryFilter[]).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={[
                "flex h-10 items-center gap-1.5 rounded-xl px-3 text-[0.78rem] font-semibold transition",
                category === cat
                  ? "bg-[#22c55e] text-white shadow-sm"
                  : "border border-[#e2e8e2] bg-white text-[#5c5e62] hover:border-[#22c55e]/40 hover:text-[#111111]",
              ].join(" ")}
            >
              {cat === "all"        && "All"}
              {cat === "cars_suv"   && <><Car size={12} /> Cars & SUV</>}
              {cat === "commercial" && <><Truck size={12} /> Commercial</>}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="mt-4">
        {loading && engines.length === 0 && (
          <div className="flex items-center justify-center py-10 text-[0.83rem] text-[#9ca3af]">
            <Loader2 size={16} className="mr-2 animate-spin" />
            Loading engines…
          </div>
        )}

        {!loading && engines.length === 0 && (
          <div className="rounded-xl border border-dashed border-[#e2e8e2] py-10 text-center">
            {total === 0 && search === "" && category === "all" ? (
              <>
                <p className="text-[0.83rem] font-semibold text-[#5c5e62]">
                  Engine database not yet loaded.
                </p>
                <p className="mt-1 text-[0.77rem] text-[#9ca3af]">
                  Download the PDF guides below for the full compatibility list.
                </p>
              </>
            ) : (
              <>
                <p className="text-[0.83rem] font-semibold text-[#5c5e62]">No results found.</p>
                <p className="mt-1 text-[0.77rem] text-[#9ca3af]">
                  Try a different search or download the PDF for the full list.
                </p>
              </>
            )}
          </div>
        )}

        {engines.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-[#e2e8e2]">
            <table className="w-full min-w-[540px] text-[0.8rem]">
              <thead>
                <tr className="border-b border-[#e2e8e2] bg-[#f9fafb]">
                  {["Manufacturer", "Model / Series", "Engine Code", "Fuel", "FET Model"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-[0.68rem] font-bold uppercase tracking-[0.1em] text-[#9ca3af]">
                      {h}
                    </th>
                  ))}
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {engines.map((e) => (
                  <tr key={e.id} className="border-b border-[#f0f2f5] transition hover:bg-[#f9fafb] last:border-0">
                    <td className="px-4 py-3 font-semibold text-[#111111]">{e.manufacturer}</td>
                    <td className="px-4 py-3 text-[#5c5e62]">{e.model_series}</td>
                    <td className="px-4 py-3 text-[#5c5e62]">
                      {e.engine_code ? (
                        <span className="rounded bg-[#f0f2f5] px-1.5 py-0.5 font-mono text-[0.75rem]">
                          {e.engine_code}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-[#5c5e62]">{FUEL_LABELS[e.fuel_type] ?? e.fuel_type}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-[0.7rem] font-bold ${fetModelColor(e.fet_model)}`}>
                        {e.fet_model}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href="/tyre-supply-quotation"
                        className="flex items-center gap-1 text-[0.75rem] font-semibold text-[#22c55e] hover:underline"
                      >
                        Quote <ChevronRight size={11} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {total !== null && total > engines.length && (
              <p className="border-t border-[#f0f2f5] px-4 py-2.5 text-[0.75rem] text-[#9ca3af]">
                Showing {engines.length} of {total} results — refine your search to narrow down.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
