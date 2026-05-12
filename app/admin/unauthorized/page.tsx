import { cookies } from "next/headers";
import Link from "next/link";
import { ShieldOff, ArrowLeft, Mail } from "lucide-react";
import type { Metadata } from "next";
import { ROLE_LABELS } from "@/lib/admin-permissions";

export const metadata: Metadata = { title: "Access Denied – Okelcor Admin" };

export default async function AdminUnauthorizedPage() {
  const store      = await cookies();
  const role       = store.get("admin_role")?.value ?? "";
  const roleLabel  =
    store.get("admin_role_label")?.value ||
    ROLE_LABELS[role] ||
    role ||
    null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f5f5f7] px-6 py-12 text-center">
      <div className="w-full max-w-md rounded-2xl bg-white p-10 shadow-sm">

        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
          <ShieldOff size={28} strokeWidth={1.6} className="text-red-500" />
        </div>

        <h1 className="text-[1.3rem] font-extrabold tracking-tight text-[#1a1a1a]">
          Access Denied
        </h1>
        <p className="mt-2 text-[0.875rem] leading-relaxed text-[#5c5e62]">
          You do not have permission to access this section.
        </p>

        {roleLabel && (
          <p className="mt-4 text-[0.78rem] text-[#9ca3af]">
            Your current role:{" "}
            <span className="font-semibold text-[#5c5e62]">{roleLabel}</span>
          </p>
        )}

        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/admin"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#E85C1A] px-6 text-[0.83rem] font-semibold text-white transition hover:bg-[#d14f14]"
          >
            <ArrowLeft size={14} />
            Return to Dashboard
          </Link>
          <a
            href="mailto:admin@okelcor.com"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-black/[0.10] bg-white px-6 text-[0.83rem] font-semibold text-[#5c5e62] transition hover:bg-[#f5f5f7]"
          >
            <Mail size={14} />
            Contact Super Admin
          </a>
        </div>

        <p className="mt-6 text-[0.72rem] text-[#9ca3af]">
          If you believe this is a mistake, ask a super admin to adjust your permissions.
        </p>
      </div>
    </div>
  );
}
