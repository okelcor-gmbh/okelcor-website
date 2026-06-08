"use client";

import { useState, useEffect, useCallback } from "react";
import { Activity, Loader2 } from "lucide-react";
import { TIMELINE_EVENT_LABELS, timelineTone, type TimelineEvent } from "@/lib/crm8";

interface Props {
  customerId: number;
  /** Re-fetch when this value changes (e.g. after an approval action). */
  refreshKey?: number;
}

const TONE_DOT: Record<string, string> = {
  positive: "bg-emerald-500",
  warning:  "bg-amber-500",
  danger:   "bg-red-500",
  neutral:  "bg-gray-300",
};

function fmtDT(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
  } catch { return iso; }
}

export default function CustomerTimelineCard({ customerId, refreshKey = 0 }: Props) {
  const [events, setEvents]   = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUA]  = useState(false);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/customers/${customerId}/timeline`, { cache: "no-store" });
      if (res.status === 404 || res.status === 405) { setUA(true); setEvents([]); return; }
      const json = await res.json().catch(() => ({})) as Record<string, unknown>;
      const raw = (Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : []) as TimelineEvent[];
      setEvents(raw);
    } catch {
      setUA(true);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => { fetchEvents(); }, [fetchEvents, refreshKey]);

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
      <div className="flex items-center gap-2.5 border-b border-black/[0.06] px-5 py-4">
        <Activity size={15} className="text-[#5c5e62]" />
        <p className="text-[0.9rem] font-extrabold text-[#1a1a1a]">Lifecycle Timeline</p>
      </div>

      <div className="p-5">
        {unavailable ? (
          <div className="py-6 text-center">
            <p className="text-[0.83rem] text-[#9ca3af]">Timeline not available yet.</p>
            <p className="mt-1 font-mono text-[0.72rem] text-[#d1d5db]">Backend: GET /admin/customers/{"{id}"}/timeline</p>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-6"><Loader2 size={18} className="animate-spin text-[#E85C1A]" /></div>
        ) : events.length === 0 ? (
          <p className="py-6 text-center text-[0.83rem] text-[#9ca3af]">No lifecycle events recorded yet.</p>
        ) : (
          <ol className="relative ml-1.5 border-l border-black/[0.08]">
            {events.map((e) => (
              <li key={e.id} className="relative mb-4 pl-5 last:mb-0">
                <span className={`absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full ring-2 ring-white ${TONE_DOT[timelineTone(e.event_type)]}`} />
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[0.83rem] font-semibold text-[#1a1a1a]">
                    {e.title || TIMELINE_EVENT_LABELS[e.event_type] || e.event_type.replace(/_/g, " ")}
                  </p>
                  <time className="shrink-0 text-[0.7rem] text-[#9ca3af]">{fmtDT(e.created_at)}</time>
                </div>
                {e.description && <p className="mt-0.5 text-[0.78rem] text-[#5c5e62]">{e.description}</p>}
                {e.admin_name && <p className="mt-0.5 text-[0.7rem] text-[#9ca3af]">by {e.admin_name}</p>}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
