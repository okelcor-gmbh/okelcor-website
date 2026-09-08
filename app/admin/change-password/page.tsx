"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ShieldAlert, CheckCircle } from "lucide-react";
import { changePassword } from "@/app/admin/profile/actions";

const inputCls =
  "h-10 w-full rounded-xl border border-black/[0.09] bg-white px-3.5 text-[0.875rem] text-[#1a1a1a] outline-none placeholder:text-[#aaa] transition focus:border-[#f4511e] focus:ring-2 focus:ring-[#f4511e]/10";

function PasswordField({
  label,
  value,
  onChange,
  show,
  onToggle,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[0.78rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required
          className={`${inputCls} pr-10`}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#aaa] transition hover:text-[#5c5e62]"
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  );
}

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword]         = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent]         = useState(false);
  const [showNew, setShowNew]                 = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);
  const [error, setError]                     = useState<string | null>(null);
  const [success, setSuccess]                 = useState(false);
  const [saving, setSaving]                   = useState(false);
  const [, startTransition]                   = useTransition();

  const strength = newPassword.length === 0
    ? 0
    : newPassword.length < 6 ? 1
    : newPassword.length < 10 ? 2
    : /[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword) ? 4
    : 3;

  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength];
  const strengthColor = ["", "bg-red-400", "bg-amber-400", "bg-blue-400", "bg-emerald-500"][strength];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) { setError("New passwords do not match."); return; }
    if (newPassword.length < 8)          { setError("Password must be at least 8 characters."); return; }
    setSaving(true);
    startTransition(async () => {
      const res = await changePassword(currentPassword, newPassword, confirmPassword);
      setSaving(false);
      if (res.fieldError || res.error) {
        setError(res.fieldError ?? res.error ?? "Failed to change password.");
      } else {
        setSuccess(true);
        setTimeout(() => router.replace("/admin"), 1800);
      }
    });
  };

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-md space-y-6">

        {/* Warning banner */}
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-[0.875rem] text-amber-800">
          <ShieldAlert size={16} className="mt-0.5 shrink-0 text-amber-500" />
          <div>
            <p className="font-semibold">Password change required</p>
            <p className="mt-0.5 text-[0.82rem]">
              Your account is using a temporary password. Please set a new password to continue.
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="mb-5 text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#5c5e62]">
            Set New Password
          </p>

          {success && (
            <div className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[0.83rem] text-emerald-700">
              <CheckCircle size={14} className="shrink-0" />
              Password changed. Redirecting…
            </div>
          )}

          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-[0.83rem] text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <PasswordField
              label="Current (Temporary) Password"
              value={currentPassword}
              onChange={setCurrentPassword}
              show={showCurrent}
              onToggle={() => setShowCurrent((v) => !v)}
            />
            <PasswordField
              label="New Password"
              value={newPassword}
              onChange={setNewPassword}
              show={showNew}
              onToggle={() => setShowNew((v) => !v)}
              placeholder="Min. 8 characters"
            />

            {/* Strength bar */}
            {newPassword.length > 0 && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((s) => (
                    <div
                      key={s}
                      className={`h-1 flex-1 rounded-full transition-all ${
                        strength >= s ? strengthColor : "bg-black/[0.08]"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-[0.75rem] text-[#5c5e62]">{strengthLabel}</p>
              </div>
            )}

            <PasswordField
              label="Confirm New Password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              show={showConfirm}
              onToggle={() => setShowConfirm((v) => !v)}
            />

            <div className="pt-1">
              <button
                type="submit"
                disabled={saving || success || !currentPassword || !newPassword || !confirmPassword}
                className="h-9 rounded-full bg-[#f4511e] px-6 text-[0.83rem] font-semibold text-white transition hover:bg-[#df4618] disabled:opacity-60"
              >
                {saving ? "Updating…" : "Set New Password"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
