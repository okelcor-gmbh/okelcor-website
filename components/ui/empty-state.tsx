"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";

type Action = {
  label: string;
  href?: string;
  onClick?: () => void;
};

type Props = {
  icon: LucideIcon;
  heading: string;
  description?: string;
  action?: Action;
  /** Reduce vertical padding when placed inside a table cell */
  compact?: boolean;
};

export default function EmptyState({ icon: Icon, heading, description, action, compact }: Props) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? "py-10" : "py-16"}`}>
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#f0f2f5]">
        <Icon size={20} className="text-[#9ca3af]" strokeWidth={1.8} />
      </div>
      <p className="text-[0.9rem] font-semibold text-[#1a1a1a]">{heading}</p>
      {description && (
        <p className="mt-1.5 max-w-[300px] text-[0.82rem] leading-[1.6] text-[#5c5e62]">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-4">
          {action.href ? (
            <Link
              href={action.href}
              className="inline-flex h-9 items-center rounded-full border border-black/[0.10] bg-white px-5 text-[0.82rem] font-semibold text-[#1a1a1a] transition hover:bg-[#f0f2f5]"
            >
              {action.label}
            </Link>
          ) : (
            <button
              type="button"
              onClick={action.onClick}
              className="inline-flex h-9 items-center rounded-full border border-black/[0.10] bg-white px-5 text-[0.82rem] font-semibold text-[#1a1a1a] transition hover:bg-[#f0f2f5]"
            >
              {action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
