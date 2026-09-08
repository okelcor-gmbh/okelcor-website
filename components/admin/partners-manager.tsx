"use client";

/**
 * components/admin/partners-manager.tsx
 *
 * Partner organisations — list, create, and manage the people inside them.
 *
 * Replaces onboarding by curl. That mattered beyond convenience: creating a
 * partner from a shell means an admin-chosen PIN typed into a terminal, landing
 * in shell history, by whoever holds the admin token. Workable for one pilot
 * partner, wrong as a process.
 *
 * The PIN set here is known to the admin who set it, so the server marks the
 * account `must_change_pin` and the partner is forced to replace it on first
 * sign-in. The form says so, because an admin who does not know that will pick
 * something weak on the partner's behalf.
 */

import { useCallback, useEffect, useState } from "react";
import { Plus, Search, Building2, Users, KeyRound, Ban, RotateCcw } from "lucide-react";
import type { PartnerOrganisation, PartnerUser } from "@/lib/admin-api";
import { useAdminPermissions } from "@/hooks/use-admin-permissions";

const FIELD =
  "w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-[0.88rem] outline-none transition focus:border-[#f4511e]/50 focus:ring-2 focus:ring-[#f4511e]/10";
const LABEL = "mb-1 block text-[0.75rem] font-semibold text-[#5c5e62]";

/** Markets Okelcor sells into. Dial codes drive the phone prefix. */
const COUNTRIES = [
  { code: "GH", name: "Ghana", dial: "+233", currency: "GHS" },
  { code: "NG", name: "Nigeria", dial: "+234", currency: "NGN" },
  { code: "KE", name: "Kenya", dial: "+254", currency: "KES" },
  { code: "ZA", name: "South Africa", dial: "+27", currency: "ZAR" },
  { code: "AE", name: "UAE", dial: "+971", currency: "AED" },
  { code: "CI", name: "Côte d'Ivoire", dial: "+225", currency: "XOF" },
  { code: "CM", name: "Cameroon", dial: "+237", currency: "XAF" },
  { code: "DE", name: "Germany", dial: "+49", currency: "EUR" },
  { code: "GB", name: "United Kingdom", dial: "+44", currency: "GBP" },
];

/** Mirrors the server policy so an admin is told before submitting, not after. */
function pinProblem(pin: string): string | null {
  if (!/^\d{6,10}$/.test(pin)) return "PIN must be 6–10 digits.";
  if (/^(\d)\1+$/.test(pin)) return "Cannot be the same digit repeated.";
  if ("01234567890".includes(pin) || "09876543210".includes(pin)) return "Cannot be a run of digits.";
  for (let b = 1; b <= pin.length / 2; b++) {
    if (pin.length % b) continue;
    const unit = pin.slice(0, b);
    if (b < pin.length && unit.repeat(pin.length / b) === pin) return "Cannot be a repeating pattern.";
  }
  return null;
}

export default function PartnersManager() {
  const [orgs, setOrgs] = useState<PartnerOrganisation[] | null>(null);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);

  // Gate on can(), never on the role string — see hooks/use-admin-permissions.
  const { can, loading: permsLoading } = useAdminPermissions();
  const canManage = can("partners.manage");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/partners?search=${encodeURIComponent(search)}`, {
        cache: "no-store",
      });
      const json = await res.json().catch(() => ({}));
      setOrgs(Array.isArray(json.data) ? json.data : []);
    } catch {
      setOrgs([]);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => void load(), 250);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search partners…"
            className={`${FIELD} pl-9`}
          />
        </div>
        {canManage && !permsLoading && (
          <button
            type="button"
            onClick={() => setCreating((v) => !v)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#f4511e] px-4 py-2 text-[0.85rem] font-semibold text-white transition hover:bg-[#d04d15]"
          >
            <Plus size={15} /> Add partner
          </button>
        )}
      </div>

      {creating && (
        <CreatePartnerForm
          onDone={() => {
            setCreating(false);
            void load();
          }}
          onCancel={() => setCreating(false)}
        />
      )}

      {orgs === null ? (
        <p className="py-8 text-center text-[0.9rem] text-[#5c5e62]">Loading…</p>
      ) : orgs.length === 0 ? (
        <div className="rounded-xl border border-black/[0.06] bg-white py-12 text-center">
          <Building2 size={28} className="mx-auto text-[#9ca3af]" strokeWidth={1.6} />
          <p className="mt-3 text-[0.95rem] font-semibold text-[#1a1a1a]">No partners yet</p>
          <p className="mx-auto mt-1 max-w-sm text-[0.85rem] text-[#5c5e62]">
            Partners cannot sign themselves up. Create an organisation and its first
            user here, then give them the phone number and PIN.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {orgs.map((o) => (
            <div key={o.id} className="rounded-xl border border-black/[0.06] bg-white">
              <button
                type="button"
                onClick={() => setExpanded(expanded === o.id ? null : o.id)}
                className="flex w-full items-center gap-3 px-5 py-4 text-left"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#f4511e]/10 text-[#f4511e]">
                  <Building2 size={17} strokeWidth={2} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.95rem] font-bold text-[#1a1a1a]">{o.name}</p>
                  <p className="mt-0.5 text-[0.78rem] text-[#5c5e62]">
                    {o.country} · <span className="font-mono">{o.default_currency}</span>
                    {typeof o.users_count === "number" ? ` · ${o.users_count} user${o.users_count === 1 ? "" : "s"}` : ""}
                    {typeof o.sales_count === "number" ? ` · ${o.sales_count} sales` : ""}
                  </p>
                </div>
                <span className="text-[0.8rem] text-[#9ca3af]">{expanded === o.id ? "−" : "+"}</span>
              </button>

              {expanded === o.id && <PartnerUsers orgId={o.id} canManage={canManage} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Create ────────────────────────────────────────────────────────────────── */

function CreatePartnerForm({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const [name, setName] = useState("");
  const [countryCode, setCountryCode] = useState("GH");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const country = COUNTRIES.find((c) => c.code === countryCode)!;
  const pinIssue = pin ? pinProblem(pin) : null;
  const valid = name.trim() && ownerName.trim() && phone.replace(/\D/g, "").length >= 6 && pin && !pinIssue;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || busy) return;
    setBusy(true);
    setError(null);

    const digits = phone.replace(/\D/g, "").replace(/^0+/, "");
    const cc = country.dial.replace(/\D/g, "");

    try {
      const res = await fetch("/api/admin/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          country: country.name,
          country_code: country.code,
          default_currency: country.currency,
          owner: {
            name: ownerName.trim(),
            phone: digits.startsWith(cc) ? `+${digits}` : `+${cc}${digits}`,
            pin,
          },
        }),
      });

      if (res.ok) return onDone();

      const body = (await res.json().catch(() => ({}))) as {
        message?: string;
        errors?: Record<string, string[]>;
      };
      const first = body.errors ? Object.values(body.errors)[0]?.[0] : undefined;
      setError(first ?? body.message ?? "Could not create the partner.");
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mb-4 rounded-xl border border-black/[0.06] bg-white p-5">
      <p className="mb-4 text-[0.95rem] font-bold text-[#1a1a1a]">New partner</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="p-name" className={LABEL}>Business name</label>
          <input id="p-name" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Mensah Tyres Ltd" className={FIELD} />
        </div>

        <div>
          <label htmlFor="p-country" className={LABEL}>Country</label>
          <select id="p-country" value={countryCode} onChange={(e) => setCountryCode(e.target.value)} className={FIELD}>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <span className={LABEL}>Currency</span>
          <p className="rounded-lg border border-black/10 bg-[#fafafa] px-3 py-2 font-mono text-[0.88rem] text-[#5c5e62]">
            {country.currency}
          </p>
          <p className="mt-1 text-[0.7rem] text-[#9ca3af]">
            Set from the country. Partners can still record a sale in another currency.
          </p>
        </div>

        <div className="sm:col-span-2 mt-1 border-t border-black/[0.06] pt-4">
          <p className="mb-3 text-[0.82rem] font-semibold text-[#1a1a1a]">First user</p>
        </div>

        <div>
          <label htmlFor="p-owner" className={LABEL}>Name</label>
          <input id="p-owner" value={ownerName} onChange={(e) => setOwnerName(e.target.value)}
            placeholder="Kwame Mensah" className={FIELD} />
        </div>

        <div>
          <label htmlFor="p-phone" className={LABEL}>Phone — they sign in with this</label>
          <div className="flex gap-2">
            <span className="flex items-center rounded-lg border border-black/10 bg-[#fafafa] px-2.5 font-mono text-[0.85rem] text-[#5c5e62]">
              {country.dial}
            </span>
            <input id="p-phone" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^\d\s]/g, ""))}
              placeholder="20 123 4567" inputMode="tel" className={`${FIELD} font-mono`} />
          </div>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="p-pin" className={LABEL}>Temporary PIN — 6–10 digits</label>
          <input id="p-pin" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 10))}
            placeholder="Not 123456 or 111111" inputMode="numeric" className={`${FIELD} font-mono tracking-[0.2em]`} />
          {pinIssue ? (
            <p className="mt-1 text-[0.75rem] font-medium text-red-600">{pinIssue}</p>
          ) : (
            <p className="mt-1 text-[0.72rem] text-[#9ca3af]">
              You will know this PIN, so the partner is required to replace it the first
              time they sign in. Give it to them directly — not by group chat.
            </p>
          )}
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-[0.82rem] font-medium text-red-600">
          {error}
        </p>
      )}

      <div className="mt-5 flex gap-2">
        <button type="submit" disabled={!valid || busy}
          className="rounded-lg bg-[#f4511e] px-4 py-2 text-[0.85rem] font-semibold text-white transition hover:bg-[#d04d15] disabled:opacity-40">
          {busy ? "Creating…" : "Create partner"}
        </button>
        <button type="button" onClick={onCancel}
          className="rounded-lg border border-black/10 bg-white px-4 py-2 text-[0.85rem] font-semibold text-[#5c5e62]">
          Cancel
        </button>
      </div>
    </form>
  );
}

/* ── Users inside an organisation ──────────────────────────────────────────── */

function PartnerUsers({ orgId, canManage }: { orgId: number; canManage: boolean }) {
  const [users, setUsers] = useState<PartnerUser[] | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/partners/${orgId}`, { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      setUsers(json.data?.users ?? []);
    } catch {
      setUsers([]);
    }
  }, [orgId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function act(userId: number, patch: Record<string, unknown>) {
    setBusyId(userId);
    try {
      await fetch(`/api/admin/partner-users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      await load();
    } finally {
      setBusyId(null);
    }
  }

  if (users === null) {
    return <p className="border-t border-black/[0.06] px-5 py-4 text-[0.85rem] text-[#5c5e62]">Loading users…</p>;
  }

  return (
    <div className="border-t border-black/[0.06] px-5 py-4">
      <p className="mb-3 flex items-center gap-1.5 text-[0.75rem] font-bold uppercase tracking-[0.12em] text-[#9ca3af]">
        <Users size={13} /> People
      </p>

      {users.length === 0 ? (
        <p className="text-[0.85rem] text-[#5c5e62]">No users on this partner yet.</p>
      ) : (
        <ul className="space-y-2">
          {users.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-black/[0.06] px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-[0.88rem] font-semibold text-[#1a1a1a]">
                  {u.name}
                  {!u.is_active && <span className="ml-2 text-[0.72rem] font-bold text-red-600">Deactivated</span>}
                  {u.locked_until && <span className="ml-2 text-[0.72rem] font-bold text-amber-600">Locked</span>}
                </p>
                <p className="mt-0.5 font-mono text-[0.78rem] text-[#5c5e62]">{u.phone}</p>
                {u.must_change_pin && (
                  <p className="mt-0.5 text-[0.72rem] text-[#9ca3af]">
                    Has not set their own PIN yet
                  </p>
                )}
              </div>

              {canManage && (
                <div className="flex flex-wrap gap-1.5">
                  {u.locked_until && (
                    <button type="button" disabled={busyId === u.id} onClick={() => act(u.id, { unlock: true })}
                      className="inline-flex items-center gap-1 rounded-md border border-black/10 px-2.5 py-1.5 text-[0.76rem] font-semibold text-[#5c5e62] disabled:opacity-40">
                      <RotateCcw size={12} /> Unlock
                    </button>
                  )}
                  <button type="button" disabled={busyId === u.id}
                    onClick={() => {
                      const pin = window.prompt("New temporary PIN (6–10 digits). They will be forced to change it.");
                      if (!pin) return;
                      const issue = pinProblem(pin);
                      if (issue) return window.alert(issue);
                      void act(u.id, { pin });
                    }}
                    className="inline-flex items-center gap-1 rounded-md border border-black/10 px-2.5 py-1.5 text-[0.76rem] font-semibold text-[#5c5e62] disabled:opacity-40">
                    <KeyRound size={12} /> Reset PIN
                  </button>
                  <button type="button" disabled={busyId === u.id}
                    onClick={() => act(u.id, { is_active: !u.is_active })}
                    className="inline-flex items-center gap-1 rounded-md border border-black/10 px-2.5 py-1.5 text-[0.76rem] font-semibold text-[#5c5e62] disabled:opacity-40">
                    <Ban size={12} /> {u.is_active ? "Deactivate" : "Reactivate"}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="mt-3 text-[0.72rem] text-[#9ca3af]">
        Resetting a PIN signs that person out everywhere and forces them to choose a new
        one — use it if a phone is lost.
      </p>
    </div>
  );
}
