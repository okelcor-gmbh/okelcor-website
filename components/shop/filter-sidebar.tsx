"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useLanguage } from "@/context/language-context";

export type FilterState = {
  types: string[];
  brands: string[];
  seasons: string[];
};

type Props = {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  /** Dynamic brand list from the API — falls back to the hardcoded list if not provided */
  brands?: string[];
};

const TYPES = ["PCR", "TBR", "Used", "OTR"];
const FALLBACK_BRANDS = [
  "Michelin", "Bridgestone", "Continental", "Pirelli",
  "Goodyear", "Dunlop", "Hankook", "Yokohama", "Nexen",
];
const SEASONS = ["Summer", "Winter", "All Season"];

type SectionConfig = {
  key: string;
  title: string;
  items: string[];
  filterKey: keyof FilterState;
};

export default function FilterSidebar({ filters, onChange, brands }: Props) {
  const { t } = useLanguage();
  const brandList = brands?.length ? brands : FALLBACK_BRANDS;
  const SECTIONS: SectionConfig[] = [
    { key: "types",   title: t.shop.filter.tyreType, items: TYPES,     filterKey: "types" },
    { key: "brands",  title: t.shop.filter.brand,    items: brandList, filterKey: "brands" },
    { key: "seasons", title: t.shop.filter.season,   items: SEASONS,   filterKey: "seasons" },
  ];
  const [open, setOpen] = useState<Record<string, boolean>>({
    types: true,
    brands: true,
    seasons: true,
  });

  const toggleSection = (key: string) =>
    setOpen((prev) => ({ ...prev, [key]: !prev[key] }));

  const toggleFilter = (filterKey: keyof FilterState, value: string) => {
    const current = filters[filterKey];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onChange({ ...filters, [filterKey]: updated });
  };

  const clearAll = () => onChange({ types: [], brands: [], seasons: [] });

  const hasFilters =
    filters.types.length > 0 ||
    filters.brands.length > 0 ||
    filters.seasons.length > 0;

  return (
    <div className="rounded-[22px] bg-[#efefef] p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-[1rem] font-extrabold text-[var(--foreground)]">
          {t.shop.catalogue.filtersHeading}
        </h2>
        {hasFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="text-[0.82rem] font-semibold text-[var(--primary)] transition hover:text-[var(--primary-hover)]"
          >
            {t.shop.catalogue.clearAll}
          </button>
        )}
      </div>

      {SECTIONS.map((section) => (
        <div key={section.key} className="mt-4 border-t border-black/[0.07] pt-4">
          <button
            type="button"
            onClick={() => toggleSection(section.key)}
            className="flex w-full items-center justify-between"
          >
            <span className="text-[0.93rem] font-semibold text-[var(--foreground)]">
              {section.title}
            </span>
            <ChevronDown
              size={15}
              className={`shrink-0 text-[var(--muted)] transition-transform duration-200 ${open[section.key] ? "rotate-180" : ""}`}
            />
          </button>

          {open[section.key] && (
            <div className="mt-3 flex flex-col gap-2.5">
              {section.items.map((item) => (
                <label key={item} className="flex cursor-pointer items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={filters[section.filterKey].includes(item)}
                    onChange={() => toggleFilter(section.filterKey, item)}
                    className="h-[15px] w-[15px] cursor-pointer rounded"
                    style={{ accentColor: "#f4511e" }}
                  />
                  <span className="text-[0.88rem] text-[var(--muted)]">{item}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
