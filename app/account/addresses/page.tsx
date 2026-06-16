"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ChevronRight, Plus, Pencil, Trash2, Star, CheckCircle2, XCircle, X,
} from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { COUNTRIES } from "@/lib/countries";

// ─── Types ────────────────────────────────────────────────────────────────────

type Address = {
  id: number;
  full_name: string;
  line1: string;
  line2?: string;
  city: string;
  postcode: string;
  country: string;
  phone?: string;
  is_default: boolean;
};

type AddressForm = Omit<Address, "id" | "is_default"> & { is_default: boolean };

const EMPTY_FORM: AddressForm = {
  full_name: "", line1: "", line2: "", city: "", postcode: "",
  country: "", phone: "", is_default: false,
};

// ─── Countries ────────────────────────────────────────────────────────────────

// ─── Styles ───────────────────────────────────────────────────────────────────

const inputCls =
  "w-full rounded-[12px] border border-black/[0.08] bg-white px-4 py-3 text-[0.93rem] text-[var(--foreground)] outline-none placeholder:text-[var(--muted)] transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10";

const inputErrCls =
  "w-full rounded-[12px] border border-red-400 bg-red-50/50 px-4 py-3 text-[0.93rem] text-[var(--foreground)] outline-none transition";

const selectCls =
  "w-full rounded-[12px] border border-black/[0.08] bg-white px-4 py-3 text-[0.93rem] text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10 appearance-none";

// ─── Sub-components ───────────────────────────────────────────────────────────

function Field({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[0.82rem] font-semibold text-[var(--foreground)]">
        {label}{required && <span className="ml-0.5 text-[var(--primary)]">*</span>}
      </label>
      {children}
      {error && <p role="alert" className="mt-1 text-[0.75rem] text-red-500">{error}</p>}
    </div>
  );
}

function Toast({ message, type }: { message: string; type: "success" | "error" }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-[14px] px-5 py-3.5 text-[0.88rem] font-semibold text-white shadow-[0_8px_30px_rgba(0,0,0,0.15)] ${type === "success" ? "bg-green-600" : "bg-red-500"}`}>
      {type === "success" ? <CheckCircle2 size={16} strokeWidth={2} /> : <XCircle size={16} strokeWidth={2} />}
      {message}
    </div>
  );
}

// ─── Address Modal ────────────────────────────────────────────────────────────

function AddressModal({
  initial,
  onClose,
  onSave,
}: {
  initial: AddressForm & { id?: number };
  onClose: () => void;
  onSave: (form: AddressForm & { id?: number }) => Promise<void>;
}) {
  const [form, setForm] = useState<AddressForm & { id?: number }>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof AddressForm, string>>>({});
  const [saving, setSaving] = useState(false);

  const set = (key: keyof AddressForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value = e.target.type === "checkbox"
        ? (e.target as HTMLInputElement).checked
        : e.target.value;
      setForm((p) => ({ ...p, [key]: value }));
      if (errors[key]) setErrors((p) => ({ ...p, [key]: undefined }));
    };

  const validate = () => {
    const errs: typeof errors = {};
    if (!form.full_name.trim()) errs.full_name = "Full name is required";
    if (!form.line1.trim()) errs.line1 = "Address line 1 is required";
    if (!form.city.trim()) errs.city = "City is required";
    if (!form.postcode.trim()) errs.postcode = "Postcode is required";
    if (!form.country) errs.country = "Country is required";
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-[520px] max-h-[90vh] overflow-y-auto rounded-[22px] bg-white shadow-[0_24px_60px_rgba(0,0,0,0.18)]">
        <div className="sticky top-0 flex items-center justify-between border-b border-black/[0.06] bg-white px-6 py-4">
          <h2 className="text-[1rem] font-extrabold text-[var(--foreground)]">
            {form.id ? "Edit Address" : "Add New Address"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted)] transition hover:bg-black/[0.05] hover:text-[var(--foreground)]"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 p-6">
          <Field label="Full Name" required error={errors.full_name}>
            <input type="text" placeholder="John Smith" value={form.full_name} onChange={set("full_name")} className={errors.full_name ? inputErrCls : inputCls} />
          </Field>

          <Field label="Address Line 1" required error={errors.line1}>
            <input type="text" placeholder="Landsberger Str. 155" value={form.line1} onChange={set("line1")} className={errors.line1 ? inputErrCls : inputCls} />
          </Field>

          <Field label="Address Line 2">
            <input type="text" placeholder="Apartment, suite, floor (optional)" value={form.line2 ?? ""} onChange={set("line2")} className={inputCls} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="City" required error={errors.city}>
              <input type="text" placeholder="Munich" value={form.city} onChange={set("city")} className={errors.city ? inputErrCls : inputCls} />
            </Field>
            <Field label="Postcode" required error={errors.postcode}>
              <input type="text" placeholder="80687" value={form.postcode} onChange={set("postcode")} className={errors.postcode ? inputErrCls : inputCls} />
            </Field>
          </div>

          <Field label="Country" required error={errors.country}>
            <div className="relative">
              <select value={form.country} onChange={set("country")} className={errors.country ? inputErrCls + " appearance-none" : selectCls}>
                <option value="">Select country…</option>
                {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--muted)]">▾</span>
            </div>
          </Field>

          <Field label="Phone">
            <input type="tel" placeholder="+49 123 456 789" value={form.phone ?? ""} onChange={set("phone")} className={inputCls} />
          </Field>

          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={form.is_default}
              onChange={set("is_default")}
              className="h-4 w-4 rounded border-black/20 accent-[var(--primary)]"
            />
            <span className="text-[0.88rem] font-medium text-[var(--foreground)]">Set as default address</span>
          </label>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex h-11 flex-1 items-center justify-center rounded-full border border-black/[0.08] text-[0.9rem] font-semibold text-[var(--foreground)] transition hover:border-black/20"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex h-11 flex-1 items-center justify-center rounded-full bg-[var(--primary)] text-[0.9rem] font-semibold text-white transition hover:bg-[var(--primary-hover)] disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save Address"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<(AddressForm & { id?: number }) | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadAddresses = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/customer/addresses");
      if (!res.ok) return;
      const data = await res.json();
      setAddresses(data.data ?? data ?? []);
    } catch {
      // Silently handle — empty list shown
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAddresses(); }, [loadAddresses]);

  const handleSave = async (form: AddressForm & { id?: number }) => {
    const isEdit = !!form.id;
    const url = isEdit
      ? `/api/auth/customer/addresses/${form.id}`
      : "/api/auth/customer/addresses";

    const res = await fetch(url, {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const data = await res.json();
      showToast(data.message ?? "Failed to save address.", "error");
      return;
    }

    await loadAddresses();
    setModal(null);
    showToast(isEdit ? "Address updated." : "Address added.", "success");
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/auth/customer/addresses/${id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        showToast("Failed to delete address.", "error");
        return;
      }
      await loadAddresses();
      showToast("Address deleted.", "success");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#f5f5f5]">
      <Navbar />

      <div className="tesla-shell pb-16 pt-[96px]">

        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-1.5 text-[0.82rem] text-[var(--muted)]">
          <Link href="/account" className="transition hover:text-[var(--foreground)]">My Account</Link>
          <ChevronRight size={13} className="opacity-50" />
          <span className="font-medium text-[var(--foreground)]">Saved Addresses</span>
        </nav>

        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]">
            Saved Addresses
          </h1>
          <button
            type="button"
            onClick={() => setModal({ ...EMPTY_FORM })}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-5 py-2.5 text-[0.88rem] font-semibold text-white transition hover:bg-[var(--primary-hover)]"
          >
            <Plus size={15} strokeWidth={2.5} /> Add New Address
          </button>
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-7 w-7 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent" />
          </div>
        ) : addresses.length === 0 ? (
          <div className="flex flex-col items-center rounded-[22px] bg-[#efefef] px-8 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#e0e0e0]">
              <Star size={24} strokeWidth={1.5} className="text-[var(--muted)]" />
            </div>
            <h2 className="mt-4 text-lg font-extrabold text-[var(--foreground)]">No saved addresses</h2>
            <p className="mt-1.5 text-[0.88rem] text-[var(--muted)]">
              Add an address to speed up checkout.
            </p>
            <button
              type="button"
              onClick={() => setModal({ ...EMPTY_FORM })}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-6 py-2.5 text-[0.9rem] font-semibold text-white transition hover:bg-[var(--primary-hover)]"
            >
              <Plus size={15} strokeWidth={2.5} /> Add Address
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className={`relative flex flex-col gap-1.5 rounded-[20px] border bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] ${
                  addr.is_default ? "border-[var(--primary)]/30" : "border-black/[0.06]"
                }`}
              >
                {addr.is_default && (
                  <span className="mb-1 inline-flex items-center gap-1.5 self-start rounded-full bg-[var(--primary)]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--primary)]">
                    <Star size={10} fill="currentColor" /> Default
                  </span>
                )}

                <p className="font-bold text-[var(--foreground)]">{addr.full_name}</p>
                <p className="text-[0.85rem] text-[var(--muted)]">{addr.line1}</p>
                {addr.line2 && <p className="text-[0.85rem] text-[var(--muted)]">{addr.line2}</p>}
                <p className="text-[0.85rem] text-[var(--muted)]">{addr.city}, {addr.postcode}</p>
                <p className="text-[0.85rem] text-[var(--muted)]">{addr.country}</p>
                {addr.phone && <p className="text-[0.85rem] text-[var(--muted)]">{addr.phone}</p>}

                <div className="mt-3 flex gap-2 border-t border-black/[0.05] pt-3">
                  <button
                    type="button"
                    onClick={() => setModal({
                      id: addr.id,
                      full_name: addr.full_name,
                      line1: addr.line1,
                      line2: addr.line2 ?? "",
                      city: addr.city,
                      postcode: addr.postcode,
                      country: addr.country,
                      phone: addr.phone ?? "",
                      is_default: addr.is_default,
                    })}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-black/[0.08] py-2 text-[0.82rem] font-semibold text-[var(--foreground)] transition hover:border-black/20 hover:bg-[#f5f5f5]"
                  >
                    <Pencil size={13} strokeWidth={2} /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(addr.id)}
                    disabled={deletingId === addr.id}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-red-200 py-2 text-[0.82rem] font-semibold text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 size={13} strokeWidth={2} />
                    {deletingId === addr.id ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {modal && (
        <AddressModal
          initial={modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} />}
      <Footer />
    </main>
  );
}
