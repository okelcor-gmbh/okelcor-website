import { CheckCircle2, ExternalLink } from "lucide-react";

const CONVERSIONS = [
  { name: "Purchase",      id: "AW-10996107897/purchase",       status: "active" },
  { name: "Add to Cart",   id: "AW-10996107897/add_to_cart",    status: "active" },
  { name: "Shopping Cart", id: "AW-10996107897/shopping_cart",  status: "active" },
  { name: "Checkout",      id: "AW-10996107897/checkout",       status: "active" },
];

export default function GoogleAdsCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white">
      <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-4">
        <div>
          <p className="text-[0.9rem] font-bold text-[#1a1a1a]">Google Ads</p>
          <p className="text-[0.72rem] text-[#5c5e62]">Customer ID: 597-727-6742</p>
        </div>
        <a
          href="https://ads.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-xl border border-black/[0.09] px-3 py-1.5 text-[0.75rem] font-semibold text-[#1a1a1a] transition hover:bg-[#f5f5f7]"
        >
          <ExternalLink size={12} strokeWidth={2} />
          Open Ads
        </a>
      </div>
      <div className="divide-y divide-black/[0.04]">
        {CONVERSIONS.map(c => (
          <div key={c.name} className="flex items-center justify-between px-5 py-3">
            <div>
              <p className="text-[0.83rem] font-semibold text-[#1a1a1a]">{c.name}</p>
              <p className="text-[0.68rem] font-mono text-[#9ca3af]">{c.id}</p>
            </div>
            <span className="flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-[0.68rem] font-bold text-green-700">
              <CheckCircle2 size={11} strokeWidth={2.5} />
              Tracking
            </span>
          </div>
        ))}
      </div>
      <div className="border-t border-black/[0.04] px-5 py-3">
        <p className="text-[0.72rem] text-[#9ca3af]">
          Conversion Tag: <span className="font-mono">AW-10996107897</span>
        </p>
      </div>
    </div>
  );
}
