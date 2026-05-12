"use client";

import {
  ShieldCheck,
  ShieldOff,
  AlertTriangle,
  XCircle,
  Webhook,
  Users,
} from "lucide-react";

type Summary = {
  failed_attempts_today: number;
  blocked_admin_actions?: number;
  webhook_failures?: number;
  active_admin_sessions?: number;
  _unavailable?: boolean;
};

type TwoFaUser = {
  id: number;
  two_factor_enabled: boolean;
};

function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
  iconColor,
  iconBg,
  highlight,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  iconColor: string;
  iconBg: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-4 rounded-2xl bg-white px-5 py-4 shadow-sm ${
        highlight ? "ring-1 ring-red-200" : ""
      }`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
      >
        <Icon size={18} className={iconColor} />
      </div>
      <div className="min-w-0">
        <p className="text-[0.7rem] text-[#5c5e62] leading-snug">{label}</p>
        <p
          className={`text-[1.35rem] font-extrabold leading-none mt-0.5 ${iconColor}`}
        >
          {value}
        </p>
        {sub && (
          <p className="mt-0.5 text-[0.68rem] text-[#9ca3af] leading-snug">
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

export default function SecurityMetrics({
  summary,
  twoFaUsers,
}: {
  summary: Summary | null;
  twoFaUsers: TwoFaUser[] | null;
}) {
  const total = twoFaUsers?.length ?? 0;
  const enabled = twoFaUsers?.filter((u) => u.two_factor_enabled).length ?? 0;
  const adoptionPct =
    twoFaUsers === null ? null : total === 0 ? 100 : Math.round((enabled / total) * 100);

  const failedToday = summary?.failed_attempts_today ?? 0;
  const blockedActions = summary?.blocked_admin_actions;
  const webhookFails = summary?.webhook_failures;
  const activeSessions = summary?.active_admin_sessions;

  return (
    <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {/* 2FA Adoption */}
      <MetricCard
        icon={adoptionPct !== null && adoptionPct < 80 ? ShieldOff : ShieldCheck}
        label="2FA Adoption"
        value={adoptionPct !== null ? `${adoptionPct}%` : "—"}
        sub={
          twoFaUsers !== null
            ? `${enabled} of ${total} admin${total !== 1 ? "s" : ""}`
            : "Loading…"
        }
        iconColor={
          adoptionPct === null
            ? "text-[#5c5e62]"
            : adoptionPct < 50
            ? "text-red-600"
            : adoptionPct < 80
            ? "text-amber-600"
            : "text-emerald-600"
        }
        iconBg={
          adoptionPct === null
            ? "bg-[#f5f5f7]"
            : adoptionPct < 50
            ? "bg-red-50"
            : adoptionPct < 80
            ? "bg-amber-50"
            : "bg-emerald-50"
        }
        highlight={adoptionPct !== null && adoptionPct < 50}
      />

      {/* Failed logins today */}
      <MetricCard
        icon={AlertTriangle}
        label="Failed Logins Today"
        value={failedToday}
        iconColor={failedToday > 0 ? "text-amber-600" : "text-[#5c5e62]"}
        iconBg={failedToday > 0 ? "bg-amber-50" : "bg-[#f5f5f7]"}
        highlight={failedToday >= 10}
      />

      {/* Blocked admin actions */}
      <MetricCard
        icon={XCircle}
        label="Blocked Admin Actions"
        value={blockedActions ?? "—"}
        sub={blockedActions == null ? "Not tracked" : undefined}
        iconColor={
          blockedActions == null
            ? "text-[#9ca3af]"
            : blockedActions > 0
            ? "text-red-600"
            : "text-[#5c5e62]"
        }
        iconBg={
          blockedActions == null
            ? "bg-[#f5f5f7]"
            : blockedActions > 0
            ? "bg-red-50"
            : "bg-[#f5f5f7]"
        }
        highlight={!!blockedActions && blockedActions > 0}
      />

      {/* Webhook failures */}
      <MetricCard
        icon={Webhook}
        label="Webhook Failures"
        value={webhookFails ?? "—"}
        sub={webhookFails == null ? "Not tracked" : undefined}
        iconColor={
          webhookFails == null
            ? "text-[#9ca3af]"
            : webhookFails > 0
            ? "text-orange-600"
            : "text-[#5c5e62]"
        }
        iconBg={
          webhookFails == null
            ? "bg-[#f5f5f7]"
            : webhookFails > 0
            ? "bg-orange-50"
            : "bg-[#f5f5f7]"
        }
      />

      {/* Active admin sessions */}
      <MetricCard
        icon={Users}
        label="Active Admin Sessions"
        value={activeSessions ?? "—"}
        sub={activeSessions == null ? "Not tracked" : undefined}
        iconColor={activeSessions == null ? "text-[#9ca3af]" : "text-blue-600"}
        iconBg={activeSessions == null ? "bg-[#f5f5f7]" : "bg-blue-50"}
      />
    </div>
  );
}
