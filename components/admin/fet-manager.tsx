"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Pencil, Trash2, Check, X, Car, Truck,
  Search, ChevronDown, ChevronUp, FileText, Download,
} from "lucide-react";
import type { AdminFetEngine } from "@/lib/admin-api";
import {
  createEngineModel,
  updateEngineModel,
  deleteEngineModel,
} from "@/app/admin/fet/actions";

// ── Types ──────────────────────────────────────────────────────────────────────

type EngineForm = {
  category:     "cars_suv" | "commercial";
  manufacturer: string;
  model_series: string;
  engine_code:  string;
  displacement: string;
  fuel_type:    "diesel" | "petrol" | "both";
  fet_model:    string;
  notes:        string;
};

const EMPTY_FORM: EngineForm = {
  category:     "cars_suv",
  manufacturer: "",
  model_series: "",
  engine_code:  "",
  displacement: "",
  fuel_type:    "diesel",
  fet_model:    "",
  notes:        "",
};

const FET_MODELS = [
  "FET Passenger Car",
  "FET Van & SUV",
  "FET Truck (up to 18t)",
  "FET Heavy Machinery (up to 40t)",
];

const FUEL_LABELS: Record<string, string> = {
  diesel: "Diesel",
  petrol: "Petrol",
  both:   "Diesel / Petrol",
};

function engineToForm(e: AdminFetEngine): EngineForm {
  return {
    category:     e.category,
    manufacturer: e.manufacturer,
    model_series: e.model_series,
    engine_code:  e.engine_code ?? "",
    displacement: e.displacement ?? "",
    fuel_type:    e.fuel_type,
    fet_model:    e.fet_model,
    notes:        e.notes ?? "",
  };
}

// ── Input styles ──────────────────────────────────────────────────────────────

const inputCls = "w-full rounded-xl border border-black/[0.12] px-3.5 py-2.5 text-[0.875rem] text-[#1a1a1a] outline-none transition focus:border-[#f4511e] focus:ring-2 focus:ring-[#f4511e]/15";
const labelCls = "mb-1 block text-[0.75rem] font-semibold text-[#5c5e62]";

// ── Engine form panel ─────────────────────────────────────────────────────────

function EngineForm({
  editing,
  form,
  onChange,
  onSave,
  onCancel,
  isBusy,
  error,
}: {
  editing: AdminFetEngine | null;
  form: EngineForm;
  onChange: (f: EngineForm) => void;
  onSave: () => void;
  onCancel: () => void;
  isBusy: boolean;
  error: string | null;
}) {
  const set = (k: keyof EngineForm, v: string) => onChange({ ...form, [k]: v });

  return (
    <div className="mb-6 rounded-2xl border border-black/[0.08] bg-white p-6">
      <h3 className="mb-4 text-[0.9rem] font-bold text-[#1a1a1a]">
        {editing ? "Edit Engine Model" : "Add Engine Model"}
      </h3>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Category */}
        <div>
          <label className={labelCls}>Category <span className="text-red-500">*</span></label>
          <select value={form.category} onChange={(e) => set("category", e.target.value)} className={inputCls}>
            <option value="cars_suv">Cars, SUVs &amp; Sports Cars</option>
            <option value="commercial">Commercial Vehicles (up to 40t)</option>
          </select>
        </div>

        {/* Fuel type */}
        <div>
          <label className={labelCls}>Fuel Type <span className="text-red-500">*</span></label>
          <select value={form.fuel_type} onChange={(e) => set("fuel_type", e.target.value)} className={inputCls}>
            <option value="diesel">Diesel</option>
            <option value="petrol">Petrol</option>
            <option value="both">Diesel / Petrol</option>
          </select>
        </div>

        {/* Manufacturer */}
        <div>
          <label className={labelCls}>Manufacturer <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={form.manufacturer}
            onChange={(e) => set("manufacturer", e.target.value)}
            placeholder="e.g. BMW, Mercedes-Benz, MAN"
            className={inputCls}
          />
        </div>

        {/* Model series */}
        <div>
          <label className={labelCls}>Model / Series <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={form.model_series}
            onChange={(e) => set("model_series", e.target.value)}
            placeholder="e.g. 3 Series, E-Class, Actros"
            className={inputCls}
          />
        </div>

        {/* Engine code */}
        <div>
          <label className={labelCls}>Engine Code</label>
          <input
            type="text"
            value={form.engine_code}
            onChange={(e) => set("engine_code", e.target.value)}
            placeholder="e.g. N47, OM651, D20"
            className={inputCls}
          />
        </div>

        {/* Displacement */}
        <div>
          <label className={labelCls}>Displacement</label>
          <input
            type="text"
            value={form.displacement}
            onChange={(e) => set("displacement", e.target.value)}
            placeholder="e.g. 2.0L, 3.0L"
            className={inputCls}
          />
        </div>

        {/* FET Model */}
        <div>
          <label className={labelCls}>FET Model <span className="text-red-500">*</span></label>
          <select value={form.fet_model} onChange={(e) => set("fet_model", e.target.value)} className={inputCls}>
            <option value="">Select FET model…</option>
            {FET_MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        {/* Notes */}
        <div>
          <label className={labelCls}>Notes</label>
          <input
            type="text"
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="e.g. connection 8mm"
            className={inputCls}
          />
        </div>
      </div>

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-[0.8rem] text-red-600">{error}</p>
      )}

      <div className="mt-5 flex gap-3">
        <button
          type="button"
          onClick={onSave}
          disabled={isBusy || !form.manufacturer.trim() || !form.model_series.trim() || !form.fet_model}
          className="flex items-center gap-2 rounded-xl bg-[#f4511e] px-5 py-2.5 text-[0.875rem] font-semibold text-white transition hover:bg-[#d94f14] disabled:opacity-50"
        >
          <Check size={15} />
          {isBusy ? "Saving…" : editing ? "Save Changes" : "Add Engine"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isBusy}
          className="flex items-center gap-2 rounded-xl border border-black/[0.12] px-5 py-2.5 text-[0.875rem] font-semibold text-[#5c5e62] transition hover:bg-[#f0f2f5]"
        >
          <X size={15} />
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Engine row ────────────────────────────────────────────────────────────────

function EngineRow({
  engine,
  onEdit,
  onDeleted,
}: {
  engine: AdminFetEngine;
  onEdit: () => void;
  onDeleted: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPending, startTransition]      = useTransition();
  const [error, setError]                 = useState<string | null>(null);

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const result = await deleteEngineModel(engine.id);
      if (result.error) setError(result.error);
      else onDeleted();
    });
  };

  return (
    <tr className="border-b border-[#f0f2f5] transition hover:bg-[#fafafa] last:border-0">
      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.68rem] font-bold uppercase tracking-[0.1em] ${
          engine.category === "cars_suv"
            ? "bg-blue-50 text-blue-700"
            : "bg-amber-50 text-amber-700"
        }`}>
          {engine.category === "cars_suv"
            ? <><Car size={9} /> Cars/SUV</>
            : <><Truck size={9} /> Commercial</>}
        </span>
      </td>
      <td className="px-4 py-3 font-semibold text-[#1a1a1a]">{engine.manufacturer}</td>
      <td className="px-4 py-3 text-[#5c5e62]">{engine.model_series}</td>
      <td className="px-4 py-3">
        {engine.engine_code
          ? <span className="rounded bg-[#f0f2f5] px-1.5 py-0.5 font-mono text-[0.75rem] text-[#5c5e62]">{engine.engine_code}</span>
          : <span className="text-[#9ca3af]">—</span>}
      </td>
      <td className="px-4 py-3 text-[0.8rem] text-[#5c5e62]">{FUEL_LABELS[engine.fuel_type]}</td>
      <td className="px-4 py-3">
        <span className="rounded-full bg-[#dcfce7] px-2.5 py-0.5 text-[0.72rem] font-bold text-[#166534]">
          {engine.fet_model}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            title="Edit"
            onClick={onEdit}
            disabled={isPending}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/[0.08] bg-white text-[#5c5e62] transition hover:bg-[#f0f2f5]"
          >
            <Pencil size={13} />
          </button>
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <button type="button" onClick={handleDelete} disabled={isPending}
                className="flex h-8 items-center gap-1 rounded-lg bg-red-600 px-2.5 text-[0.75rem] font-semibold text-white transition hover:bg-red-700">
                <Trash2 size={12} /> Delete
              </button>
              <button type="button" onClick={() => setConfirmDelete(false)} disabled={isPending}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/[0.08] bg-white">
                <X size={13} className="text-[#5c5e62]" />
              </button>
            </div>
          ) : (
            <button type="button" title="Delete" onClick={() => setConfirmDelete(true)} disabled={isPending}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/[0.08] bg-white text-[#5c5e62] transition hover:bg-red-50 hover:text-red-600">
              <Trash2 size={13} />
            </button>
          )}
        </div>
        {error && <p className="mt-1 text-[0.72rem] text-red-600">{error}</p>}
      </td>
    </tr>
  );
}

// ── Main manager ──────────────────────────────────────────────────────────────

export default function FetManager({
  engines: initial,
  total,
}: {
  engines: AdminFetEngine[];
  total: number;
}) {
  const router = useRouter();
  const [formOpen, setFormOpen]         = useState(false);
  const [editingEngine, setEditingEngine] = useState<AdminFetEngine | null>(null);
  const [form, setForm]                 = useState<EngineForm>(EMPTY_FORM);
  const [formError, setFormError]       = useState<string | null>(null);
  const [isPending, startTransition]    = useTransition();
  const [filterCat, setFilterCat]       = useState<"all" | "cars_suv" | "commercial">("all");
  const [search, setSearch]             = useState("");

  const refresh = () => router.refresh();

  const openCreate = () => {
    setEditingEngine(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setFormOpen(true);
  };

  const openEdit = (e: AdminFetEngine) => {
    setEditingEngine(e);
    setForm(engineToForm(e));
    setFormError(null);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingEngine(null);
    setForm(EMPTY_FORM);
    setFormError(null);
  };

  const handleSave = () => {
    if (!form.manufacturer.trim() || !form.model_series.trim() || !form.fet_model) {
      setFormError("Manufacturer, model series and FET model are required.");
      return;
    }
    setFormError(null);
    const payload = {
      category:     form.category,
      manufacturer: form.manufacturer.trim(),
      model_series: form.model_series.trim(),
      engine_code:  form.engine_code.trim() || undefined,
      displacement: form.displacement.trim() || undefined,
      fuel_type:    form.fuel_type,
      fet_model:    form.fet_model,
      notes:        form.notes.trim() || undefined,
    };
    startTransition(async () => {
      if (editingEngine) {
        const result = await updateEngineModel(editingEngine.id, payload);
        if (result.error) { setFormError(result.error); return; }
      } else {
        const result = await createEngineModel(payload);
        if (result.error) { setFormError(result.error); return; }
      }
      closeForm();
      refresh();
    });
  };

  const filtered = initial.filter((e) => {
    if (filterCat !== "all" && e.category !== filterCat) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        e.manufacturer.toLowerCase().includes(q) ||
        e.model_series.toLowerCase().includes(q) ||
        (e.engine_code ?? "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {(["all", "cars_suv", "commercial"] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilterCat(cat)}
              className={[
                "flex h-9 items-center gap-1.5 rounded-xl px-3.5 text-[0.8rem] font-semibold transition",
                filterCat === cat
                  ? "bg-[#f4511e] text-white"
                  : "border border-black/[0.1] bg-white text-[#5c5e62] hover:bg-[#f0f2f5]",
              ].join(" ")}
            >
              {cat === "all"        && `All (${total})`}
              {cat === "cars_suv"   && <><Car size={12} /> Cars & SUV</>}
              {cat === "commercial" && <><Truck size={12} /> Commercial</>}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="h-9 rounded-xl border border-black/[0.1] bg-white pl-8 pr-3 text-[0.83rem] text-[#1a1a1a] outline-none transition focus:border-[#f4511e] focus:ring-2 focus:ring-[#f4511e]/10"
            />
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="flex h-9 items-center gap-2 rounded-xl bg-[#f4511e] px-4 text-[0.83rem] font-semibold text-white transition hover:bg-[#d94f14]"
          >
            <Plus size={14} /> Add Engine
          </button>
        </div>
      </div>

      {/* Form */}
      {formOpen && (
        <EngineForm
          editing={editingEngine}
          form={form}
          onChange={setForm}
          onSave={handleSave}
          onCancel={closeForm}
          isBusy={isPending}
          error={formError}
        />
      )}

      {/* PDF downloads */}
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          { label: "Cars, SUVs & Sports Cars",          href: "/documents/FET-Engine-Overview-Cars-SUV.pdf" },
          { label: "Commercial Vehicles (up to 40t)", href: "/documents/FET-Engine-Overview-Commercial-Vehicles.pdf" },
        ].map(({ label, href }) => (
          <a key={href} href={href} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl border border-black/[0.08] bg-white px-4 py-3 text-[0.82rem] transition hover:bg-[#f0f2f5]">
            <FileText size={15} className="shrink-0 text-[#9ca3af]" />
            <span className="flex-1 font-medium text-[#1a1a1a]">{label}</span>
            <Download size={13} className="shrink-0 text-[#9ca3af]" />
          </a>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/[0.12] bg-white px-6 py-12 text-center">
          <p className="text-[0.875rem] text-[#9ca3af]">
            {initial.length === 0
              ? "No engine models yet. Add them individually or ask the backend team to import the PDF data."
              : "No results match your filter."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-black/[0.08] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-[0.82rem]">
              <thead>
                <tr className="border-b border-[#f0f2f5] bg-[#fafafa]">
                  {["Category", "Manufacturer", "Model / Series", "Engine Code", "Fuel", "FET Model", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[0.68rem] font-bold uppercase tracking-[0.1em] text-[#9ca3af]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <EngineRow
                    key={e.id}
                    engine={e}
                    onEdit={() => openEdit(e)}
                    onDeleted={refresh}
                  />
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-[#f0f2f5] px-4 py-2.5 text-[0.75rem] text-[#9ca3af]">
            Showing {filtered.length} of {total} engine models
          </div>
        </div>
      )}
    </div>
  );
}
