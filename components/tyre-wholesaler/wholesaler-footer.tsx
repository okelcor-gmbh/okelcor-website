import Link from "next/link";

// Minimal landing-page footer for /tyre-wholesaler (replaces the global footer here only).

const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Imprint", href: "/imprint" },
];

export default function WholesalerFooter() {
  return (
    <footer className="w-full border-t border-white/10 bg-[#171a20] py-12 text-white/60">
      <div className="tesla-shell">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Company */}
          <div>
            <h3 className="text-[1.15rem] font-extrabold tracking-tight text-white">OKELCOR</h3>
            <p className="mt-4 max-w-xs text-[0.9rem] leading-7">
              Global tyre wholesaler and supply chain logistics based in Munich, Germany.
            </p>
            <p className="mt-4 text-[0.9rem]">REX Exporter: DEREX76000242</p>
            <p className="text-[0.9rem]">ISO 9001:2015 Certified</p>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-[0.95rem] font-bold text-white">Contact Us</h4>
            <p className="mt-4 text-[0.9rem]">
              Phone:{" "}
              <a href="tel:+498954558360" className="transition-colors hover:text-white">
                +49 89 545 583 60
              </a>
            </p>
            <p className="mt-2 text-[0.9rem]">Location: Munich, Bavaria, Germany</p>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-[0.95rem] font-bold text-white">Legal</h4>
            <ul className="mt-4 space-y-2">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-[0.9rem] transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-8 text-center text-[0.82rem]">
          &copy; 2026 Okelcor. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
