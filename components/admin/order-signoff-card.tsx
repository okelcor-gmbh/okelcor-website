"use client";

import { useEffect, useState } from "react";
import {
  ShieldCheck, ShieldAlert, Shield, Check, Loader2, X, AlertTriangle, History, Info,
} from "lucide-react";
import type { OrderSignoffState, OrderSignoffSlot } from "@/lib/admin-api";
import { canDo } from "@/lib/admin-permissions";
import { useAdminPermissions } from "@/hooks/use-admin-permissions";

/**
 * Dual sign-off on an order confirmation: one Operations signature, one
 * Finance, given by two different people.
 *
 * **Where the state comes from, and why there are two sources.** The order
 * detail payload embeds the whole block, so this panel paints immediately with
 * no spinner and no second request — including all four status values. But
 * `you_may_sign` is added only by `GET /orders/{id}/signoffs`
 * (`AdminOrderSignoffController:39`); the shared `state()` the order detail
 * calls does not include it. Nor can it be derived here: the entitlement check
 * compares `admin_user_id` to enforce the two-different-people rule, and the
 * slots carry a display *name*. So the panel renders from the embedded block
 * and asks the dedicated endpoint one question only — which button to offer.
 * Until that answers, no button is shown, because offering one that 403s is
 * worse than offering it a moment late.
 */

const STATUS_STYLES: Record<string, { chip: string; icon: typeof Shield; label: string }> = {
  complete:     { chip: "bg-emerald-100 text-emerald-800", icon: ShieldCheck, label: "Signed off" },
  partial:      { chip: "bg-amber-100 text-amber-900",     icon: ShieldAlert, label: "One signature" },
  awaiting:     { chip: "bg-slate-100 text-slate-700",     icon: Shield,      label: "Awaiting signatures" },
  not_required: { chip: "bg-slate-100 text-slate-600",     icon: Info,        label: "Not required" },
};

function fmt(dt?: string | null): string {
  if (!dt) return "";
  try {
    return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(dt));
  } catch { return dt; }
}

function SlotRow({
  slot, canSign, canWithdraw, busy, onSign, onWithdraw,
}: {
  slot: OrderSignoffSlot;
  canSign: boolean;
  canWithdraw: boolean;
  busy: boolean;
  onSign: () => void;
  onWithdraw: () => void;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-black/[0.07] bg-white p-3">
      <div
        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
          slot.signed ? "bg-emerald-100 text-emerald-700" : "bg-[#f0f2f5] text-[#8c8f94]"
        }`}
      >
        {slot.signed ? <Check size={14} strokeWidth={3} /> : <Shield size={13} />}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[0.83rem] font-bold text-[#171a20]">{slot.label}</p>

        {slot.signed ? (
          <>
            <p className="text-[0.78rem] text-[#5c5e62]">
              {slot.signed_by}
              {slot.signed_at && <span className="text-[#8c8f94]"> · {fmt(slot.signed_at)}</span>}
            </p>
            {slot.note && (
              <p className="mt-1 rounded-lg bg-[#fafafa] px-2 py-1 text-[0.75rem] text-[#5c5e62]">
                {slot.note}
              </p>
            )}
          </>
        ) : (
          <p className="text-[0.78rem] text-[#8c8f94]">
            Not yet signed
            {/* Naming the roles turns "why is there no button" into an answer,
                without pretending this user could press one. */}
            {slot.roles && slot.roles.length > 0 && (
              <> · {slot.roles.map((r) => r.replace(/_/g, " ")).join(" or ")}</>
            )}
          </p>
        )}
      </div>

      {slot.signed && canWithdraw ? (
        <button
          type="button"
          onClick={onWithdraw}
          disabled={busy}
          className="shrink-0 rounded-lg px-2 py-1 text-[0.75rem] font-semibold text-[#5c5e62] transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
        >
          Withdraw
        </button>
      ) : canSign ? (
        <button
          type="button"
          onClick={onSign}
          disabled={busy}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[#171a20] px-3 py-1.5 text-[0.78rem] font-semibold text-white transition hover:bg-black disabled:opacity-50"
        >
          {busy ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} strokeWidth={3} />}
          Sign
        </button>
      ) : null}
    </div>
  );
}

export default function OrderSignoffCard({
  orderId,
  initial,
}: {
  orderId: number;
  initial?: OrderSignoffState | null;
}) {
  const { role, permissions } = useAdminPermissions();

  /**
   * Withdrawal, unlike signing, *is* safe to decide here.
   *
   * The server checks the slot's own permission or `orders.signoff_bypass`
   * (`OrderSignoffService:291`) and nothing else — no same-person rule, no order
   * state — and the slot carries its `permission` in the payload. So this is the
   * same role check, made from the same facts, and offering the control only to
   * someone who can use it avoids the permissions puzzle a dead button creates.
   * Signing stays server-decided because it compares `admin_user_id`, which is
   * not in the payload at all.
   */
  const mayWithdraw = (slot: OrderSignoffSlot) =>
    (!!slot.permission && canDo(role ?? "", slot.permission, permissions))
    || canDo(role ?? "", "orders.signoff_bypass", permissions);
  const [state, setState] = useState<OrderSignoffState | null>(initial ?? null);
  const [maySign, setMaySign] = useState<string[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<{ kind: "role" | "state" | "other"; message: string } | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Sign/withdraw dialogs
  const [signing, setSigning] = useState<OrderSignoffSlot | null>(null);
  const [note, setNote] = useState("");
  const [withdrawing, setWithdrawing] = useState<OrderSignoffSlot | null>(null);
  const [reason, setReason] = useState("");

  const required = state?.required !== false && state?.status !== "not_required";

  // The one question the embedded block can't answer. Skipped entirely when
  // there is nothing to sign, so an exempt order makes no request at all.
  useEffect(() => {
    if (!required) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/admin/orders/${orderId}/signoffs`);
        const json = await res.json().catch(() => null);
        const data = json?.data as OrderSignoffState | undefined;
        if (cancelled || !data) return;
        setState(data);
        setMaySign(Array.isArray(data.you_may_sign) ? data.you_may_sign : []);
      } catch {
        if (!cancelled) setMaySign([]);
      }
    })();
    return () => { cancelled = true; };
  }, [orderId, required]);

  if (!state) return null;

  const style = STATUS_STYLES[state.status] ?? STATUS_STYLES.awaiting;
  const StatusIcon = style.icon;

  async function submitSign() {
    if (!signing) return;
    setBusy(signing.slot);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/signoffs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slot: signing.slot, note: note.trim() || undefined }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        // Entitlement is checked per slot inside the service, not by route
        // middleware, because the two halves are held by different roles. So
        // these two failures mean genuinely different things and get told
        // apart: 403 is "not your signature to give", 409 is "not right now".
        setError({
          kind: res.status === 403 ? "role" : res.status === 409 ? "state" : "other",
          message: json.message ?? json.error ?? "Could not record the signature.",
        });
        return;
      }
      const data = (json.data ?? null) as OrderSignoffState | null;
      if (data) {
        setState(data);
        setMaySign(Array.isArray(data.you_may_sign) ? data.you_may_sign : []);
      }
      setSigning(null);
      setNote("");
    } catch {
      setError({ kind: "other", message: "Network error. Please try again." });
    } finally {
      setBusy(null);
    }
  }

  async function submitWithdraw() {
    if (!withdrawing) return;
    if (!reason.trim()) { setError({ kind: "other", message: "A reason is required to withdraw a signature." }); return; }
    setBusy(withdrawing.slot);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/signoffs/${withdrawing.slot}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError({
          kind: res.status === 403 ? "role" : res.status === 409 ? "state" : "other",
          message: json.message ?? json.error ?? "Could not withdraw the signature.",
        });
        return;
      }
      const data = (json.data ?? null) as OrderSignoffState | null;
      if (data) {
        setState(data);
        setMaySign(Array.isArray(data.you_may_sign) ? data.you_may_sign : []);
      }
      setWithdrawing(null);
      setReason("");
    } catch {
      setError({ kind: "other", message: "Network error. Please try again." });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rounded-xl border border-black/[0.06] bg-white p-5">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h3 className="text-[0.95rem] font-bold text-[#171a20]">Order confirmation sign-off</h3>
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[0.7rem] font-bold ${style.chip}`}>
          <StatusIcon size={11} />
          {style.label}
        </span>
        {required && typeof state.signed_count === "number" && (
          <span className="text-[0.75rem] tabular-nums text-[#8c8f94]">
            {state.signed_count} of {state.slots?.length ?? 2}
          </span>
        )}
      </div>

      {/*
        `not_required` is not `awaiting`. An empty panel would read as "nobody
        has signed yet", which is a different and more alarming statement than
        "this order predates the rule and there is nothing to do".
      */}
      {state.status === "not_required" ? (
        <p className="rounded-xl bg-[#fafafa] px-3 py-2.5 text-[0.8rem] leading-snug text-[#5c5e62]">
          This order was raised before two-signature sign-off came in, so it doesn&apos;t need
          one. Nothing is outstanding and nothing is blocked.
        </p>
      ) : (
        <>
          <p className="mb-3 text-[0.78rem] leading-snug text-[#8c8f94]">
            Two people must sign before the confirmation can be sent — one Operations, one
            Finance. The same person cannot give both.
          </p>

          <div className="space-y-2">
            {(state.slots ?? []).map((slot) => (
              <SlotRow
                key={slot.slot}
                slot={slot}
                canSign={(maySign ?? []).includes(slot.slot)}
                canWithdraw={mayWithdraw(slot)}
                busy={busy === slot.slot}
                onSign={() => { setSigning(slot); setNote(""); setError(null); }}
                onWithdraw={() => { setWithdrawing(slot); setReason(""); setError(null); }}
              />
            ))}
          </div>

          {error && (
            <div
              className={`mt-3 flex items-start gap-2 rounded-xl p-3 text-[0.8rem] ${
                error.kind === "role"
                  ? "bg-slate-100 text-slate-700"
                  : "bg-amber-50 text-amber-900"
              }`}
            >
              {error.kind === "role" ? <Shield size={14} className="mt-0.5 shrink-0" />
                                     : <AlertTriangle size={14} className="mt-0.5 shrink-0" />}
              <div>
                <p className="font-semibold">
                  {error.kind === "role" ? "Not your signature to give"
                    : error.kind === "state" ? "Not right now"
                    : "Couldn't do that"}
                </p>
                <p>{error.message}</p>
              </div>
            </div>
          )}
        </>
      )}

      {(state.history?.length ?? 0) > 0 && (
        <div className="mt-3 border-t border-black/[0.06] pt-2">
          <button
            type="button"
            onClick={() => setShowHistory((v) => !v)}
            className="flex items-center gap-1.5 text-[0.75rem] font-semibold text-[#5c5e62] transition hover:text-[#171a20]"
          >
            <History size={12} />
            {showHistory ? "Hide" : "Show"} history ({state.history!.length})
          </button>
          {showHistory && (
            <ul className="mt-2 space-y-1.5">
              {state.history!.map((h, i) => (
                <li key={i} className="text-[0.75rem] leading-snug text-[#5c5e62]">
                  <span className="font-semibold text-[#171a20]">{h.label ?? h.slot}</span>
                  {" · "}{h.signed_by}
                  {h.signed_at && <span className="text-[#8c8f94]"> · {fmt(h.signed_at)}</span>}
                  {h.revoked && (
                    <span className="text-red-600">
                      {" "}· withdrawn{h.revoked_by ? ` by ${h.revoked_by}` : ""}
                      {h.revoke_reason ? `: ${h.revoke_reason}` : ""}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ── Sign dialog ── */}
      {signing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5">
            <div className="mb-2 flex items-center gap-2">
              <h4 className="text-[0.95rem] font-bold text-[#171a20]">
                Sign as {signing.label}
              </h4>
              <button type="button" onClick={() => setSigning(null)} className="ml-auto text-[#8c8f94] hover:text-[#171a20]">
                <X size={16} />
              </button>
            </div>
            <p className="mb-3 text-[0.8rem] leading-snug text-[#5c5e62]">
              Your name and the time are recorded against this order. Editing the order total
              afterwards withdraws both signatures automatically.
            </p>
            <label className="mb-1 block text-[0.78rem] font-semibold text-[#5c5e62]">
              Note (optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="e.g. Stock confirmed, pricing checked against the proposal"
              className="w-full rounded-lg border border-black/[0.10] px-3 py-2 text-[0.83rem] focus:border-[#f4511e] focus:outline-none"
            />
            <div className="mt-3 flex justify-end gap-2">
              <button type="button" onClick={() => setSigning(null)} className="rounded-lg px-3 py-2 text-[0.83rem] font-semibold text-[#5c5e62]">
                Cancel
              </button>
              <button
                type="button"
                onClick={submitSign}
                disabled={busy !== null}
                className="flex items-center gap-1.5 rounded-lg bg-[#171a20] px-4 py-2 text-[0.83rem] font-semibold text-white transition hover:bg-black disabled:opacity-50"
              >
                {busy ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} strokeWidth={3} />}
                Sign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Withdraw dialog ── */}
      {withdrawing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5">
            <div className="mb-2 flex items-center gap-2">
              <h4 className="text-[0.95rem] font-bold text-[#171a20]">
                Withdraw the {withdrawing.label} signature
              </h4>
              <button type="button" onClick={() => setWithdrawing(null)} className="ml-auto text-[#8c8f94] hover:text-[#171a20]">
                <X size={16} />
              </button>
            </div>
            <p className="mb-3 text-[0.8rem] leading-snug text-[#5c5e62]">
              Given by {withdrawing.signed_by}. The reason is recorded and stays in the history.
            </p>
            <label className="mb-1 block text-[0.78rem] font-semibold text-[#5c5e62]">
              Reason <span className="text-[#f4511e]">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Why is this signature being withdrawn?"
              className="w-full rounded-lg border border-black/[0.10] px-3 py-2 text-[0.83rem] focus:border-[#f4511e] focus:outline-none"
            />
            {error && <p className="mt-2 text-[0.78rem] text-red-600">{error.message}</p>}
            <div className="mt-3 flex justify-end gap-2">
              <button type="button" onClick={() => setWithdrawing(null)} className="rounded-lg px-3 py-2 text-[0.83rem] font-semibold text-[#5c5e62]">
                Cancel
              </button>
              <button
                type="button"
                onClick={submitWithdraw}
                disabled={busy !== null || !reason.trim()}
                className="rounded-lg bg-red-600 px-4 py-2 text-[0.83rem] font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                Withdraw
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
