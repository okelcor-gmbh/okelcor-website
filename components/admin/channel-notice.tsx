import Link from "next/link";
import { ShoppingBag, ArrowRight } from "lucide-react";

/**
 * "42 eBay orders — view separately".
 *
 * This page now asks for `channel=normal`, so eBay orders have quietly stopped
 * appearing on it. A filter the user didn't set and can't see is indisputably
 * worse than the mixed list it replaced, so the count travels with the split:
 * the orders are gone from *here*, and this says where they went.
 *
 * `meta.channel_counts` is counted across all orders regardless of the current
 * filter, so this figure stays right while paging and searching.
 */
export default function ChannelNotice({ count }: { count: number | null }) {
  if (count === null || count <= 0) return null;

  return (
    <Link
      href="/admin/orders/ebay"
      className="mb-4 flex items-center gap-2 rounded-xl border border-black/[0.07] bg-white px-4 py-2.5 text-[0.83rem] text-[#5c5e62] transition hover:border-[#f4511e]/40 hover:text-[#171a20]"
    >
      <ShoppingBag size={14} className="text-green-600" />
      <span>
        <strong className="font-semibold text-[#171a20] tabular-nums">{count}</strong>{" "}
        eBay {count === 1 ? "order is" : "orders are"} listed separately
      </span>
      <ArrowRight size={13} className="ml-auto" />
    </Link>
  );
}
