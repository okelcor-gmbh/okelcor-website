"use client";

/**
 * components/navbar.tsx
 *
 * Fixed top navigation bar — GSAP-powered, i18n-aware.
 *
 * Animation architecture:
 *   useGSAP (mount, once)        — header bar entrance (y + opacity)
 *   useEffect([openLang])        — language dropdown open/close (autoAlpha + y)
 *   useEffect([openMenu])        — mobile drawer open/close (autoAlpha + x)
 *
 * Panels and drawers are always in the DOM. GSAP's autoAlpha (opacity + visibility)
 * keeps them invisible and non-interactive when closed — no AnimatePresence needed.
 * This removes mount/unmount overhead and allows clean mid-animation interruption.
 *
 * i18n: nav labels, language names, and UI copy come from useLanguage() → t.
 * Language switching (EN/DE/FR) via setLocale() is fully preserved.
 */

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Globe,
  CircleHelp,
  UserCircle2,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ShoppingCart,
  Search,
  Package,
  Car,
  Truck,
  Tractor,
  RotateCcw,
  CheckCircle2,
  Zap,
  MapPin,
  ShieldCheck,
  Download,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import { useCart } from "@/context/cart-context";
import { useLanguage } from "@/context/language-context";
import { useSearch } from "@/context/search-context";
import { type Locale } from "@/lib/translations";
import { gsap, useGSAP, ease, prefersReducedMotion } from "@/lib/gsap";

// ── Data ───────────────────────────────────────────────────────────────────────

const LANGUAGES: { code: Locale; flag: string }[] = [
  { code: "en", flag: "🇬🇧" },
  { code: "de", flag: "🇩🇪" },
  { code: "fr", flag: "🇫🇷" },
  { code: "es", flag: "🇪🇸" },
];

// ── Component ──────────────────────────────────────────────────────────────────

export default function Navbar() {
  const pathname = usePathname();
  const { totalItems, openCart } = useCart();
  const { locale, setLocale, t } = useLanguage();
  const { openSearch } = useSearch();
  const { customer, isAuthenticated: isAuthed, isLoading: authLoading, logout } = useCustomerAuth();

  type NavItem = { label: string; href: string };

  const navItems: NavItem[] = [
    { label: t.nav.home,    href: "/" },
    { label: t.nav.shop,    href: "/shop" },
    { label: t.nav.fet,     href: "/fet" },
    { label: t.nav.news,    href: "/news" },
    { label: t.nav.about,   href: "/wholesale-tire-distributors-europe" },
    { label: t.nav.contact, href: "/contact" },
    { label: t.nav.quote,   href: "/tyre-supply-quotation" },
  ];

  const [openMenu, setOpenMenu]             = useState(false);
  const [openLang, setOpenLang]             = useState(false);
  const [openMobileLang, setOpenMobileLang] = useState(false);
  const [openProfile, setOpenProfile]       = useState(false);
  const [openShopMega,  setOpenShopMega]  = useState(false);
  const [openFetMega,   setOpenFetMega]   = useState(false);
  const [openAboutMega, setOpenAboutMega] = useState(false);

  const shopCloseTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetCloseTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aboutCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── DOM refs ─────────────────────────────────────────────────────────────
  const headerRef           = useRef<HTMLElement>(null);
  const langBackdropRef     = useRef<HTMLButtonElement>(null);
  const langPanelRef        = useRef<HTMLDivElement>(null);
  const drawerBackdropRef   = useRef<HTMLButtonElement>(null);
  const drawerRef           = useRef<HTMLElement>(null);
  const profileBackdropRef  = useRef<HTMLButtonElement>(null);
  const profilePanelRef     = useRef<HTMLDivElement>(null);

  // Skip the initial mount run for toggle effects (panels are already hidden)
  const isLangFirstRender     = useRef(true);
  const isMenuFirstRender     = useRef(true);
  const isProfileFirstRender  = useRef(true);

  // ── Route change: close all panels ───────────────────────────────────────
  useEffect(() => {
    setOpenMenu(false);
    setOpenLang(false);
    setOpenMobileLang(false);
    setOpenProfile(false);
    setOpenShopMega(false);
    setOpenFetMega(false);
    setOpenAboutMega(false);
  }, [pathname]);

  // ── Scroll lock for mobile overlays ──────────────────────────────────────
  useEffect(() => {
    const shouldLock = openMenu || openMobileLang;
    document.body.style.overflow = shouldLock ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [openMenu, openMobileLang]);

  const closeAll = () => {
    setOpenMenu(false);
    setOpenLang(false);
    setOpenMobileLang(false);
    setOpenProfile(false);
    setOpenShopMega(false);
    setOpenFetMega(false);
    setOpenAboutMega(false);
  };

  const openShopMenu = () => {
    if (shopCloseTimer.current) clearTimeout(shopCloseTimer.current);
    setOpenFetMega(false);
    setOpenAboutMega(false);
    setOpenShopMega(true);
  };
  const closeShopMenu = () => {
    shopCloseTimer.current = setTimeout(() => setOpenShopMega(false), 120);
  };

  const openFetMenu = () => {
    if (fetCloseTimer.current) clearTimeout(fetCloseTimer.current);
    setOpenShopMega(false);
    setOpenAboutMega(false);
    setOpenFetMega(true);
  };
  const closeFetMenu = () => {
    fetCloseTimer.current = setTimeout(() => setOpenFetMega(false), 120);
  };

  const openAboutMenu = () => {
    if (aboutCloseTimer.current) clearTimeout(aboutCloseTimer.current);
    setOpenShopMega(false);
    setOpenFetMega(false);
    setOpenAboutMega(true);
  };
  const closeAboutMenu = () => {
    aboutCloseTimer.current = setTimeout(() => setOpenAboutMega(false), 120);
  };

  // ── Escape key: close any open panel ─────────────────────────────────────
  // setState setters are stable — safe to use [] dependency.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpenMenu(false);
      setOpenLang(false);
      setOpenMobileLang(false);
      setOpenProfile(false);
      setOpenShopMega(false);
      setOpenFetMega(false);
      setOpenAboutMega(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // ── Establish hidden initial states on mount ──────────────────────────────
  // Runs before the first paint to prevent any flash of visible panels.
  // autoAlpha: 0 sets both opacity: 0 AND visibility: hidden.
  useEffect(() => {
    gsap.set(langPanelRef.current,       { autoAlpha: 0, y: -8 });
    gsap.set(langBackdropRef.current,    { autoAlpha: 0 });
    gsap.set(drawerRef.current,          { autoAlpha: 0, x: "100%" });
    gsap.set(drawerBackdropRef.current,  { autoAlpha: 0 });
    gsap.set(profilePanelRef.current,    { autoAlpha: 0, y: -8 });
    gsap.set(profileBackdropRef.current, { autoAlpha: 0 });
  }, []);

  // ── Header entrance ───────────────────────────────────────────────────────
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;

      gsap.fromTo(
        headerRef.current,
        { y: -12, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.45, ease: ease.entrance }
      );
    },
    { scope: headerRef }
  );

  // ── Language dropdown ─────────────────────────────────────────────────────
  // Open:  panel slides down from y: -10 + fades in. Backdrop fades in.
  // Close: panel slides up to y: -8 + fades out. Backdrop fades out.
  useEffect(() => {
    if (isLangFirstRender.current) {
      isLangFirstRender.current = false;
      return;
    }

    const panel    = langPanelRef.current;
    const backdrop = langBackdropRef.current;
    const reduced  = prefersReducedMotion();

    if (openLang) {
      if (reduced) {
        gsap.set([panel, backdrop], { autoAlpha: 1, y: 0 });
      } else {
        gsap.to(backdrop, { autoAlpha: 1, duration: 0.18 });
        gsap.fromTo(
          panel,
          { autoAlpha: 0, y: -10 },
          { autoAlpha: 1, y: 0, duration: 0.26, ease: ease.smooth }
        );
      }
    } else {
      if (reduced) {
        gsap.set([panel, backdrop], { autoAlpha: 0, y: -8 });
      } else {
        gsap.to(backdrop, {
          autoAlpha: 0,
          duration: 0.18,
          onInterrupt: () => { gsap.set(backdrop, { autoAlpha: 0 }); },
        });
        gsap.to(panel, {
          autoAlpha: 0,
          y: -8,
          duration: 0.2,
          ease: ease.sharp,
          onInterrupt: () => { gsap.set(panel, { autoAlpha: 0 }); },
        });
      }
    }

    return () => {
      gsap.killTweensOf([panel, backdrop]);
    };
  }, [openLang]);

  // ── Profile dropdown ──────────────────────────────────────────────────────
  useEffect(() => {
    if (isProfileFirstRender.current) {
      isProfileFirstRender.current = false;
      return;
    }

    const panel    = profilePanelRef.current;
    const backdrop = profileBackdropRef.current;
    const reduced  = prefersReducedMotion();

    if (openProfile) {
      if (reduced) {
        gsap.set([panel, backdrop], { autoAlpha: 1, y: 0 });
      } else {
        gsap.to(backdrop, { autoAlpha: 1, duration: 0.18 });
        gsap.fromTo(
          panel,
          { autoAlpha: 0, y: -10 },
          { autoAlpha: 1, y: 0, duration: 0.26, ease: ease.smooth }
        );
      }
    } else {
      if (reduced) {
        gsap.set([panel, backdrop], { autoAlpha: 0, y: -8 });
      } else {
        gsap.to(backdrop, {
          autoAlpha: 0,
          duration: 0.18,
          onInterrupt: () => { gsap.set(backdrop, { autoAlpha: 0 }); },
        });
        gsap.to(panel, {
          autoAlpha: 0,
          y: -8,
          duration: 0.2,
          ease: ease.sharp,
          onInterrupt: () => { gsap.set(panel, { autoAlpha: 0 }); },
        });
      }
    }

    return () => {
      gsap.killTweensOf([panel, backdrop]);
    };
  }, [openProfile]);

  // ── Mobile drawer ─────────────────────────────────────────────────────────
  // Open:  slides in from right with expo.out deceleration.
  // Close: slides back out with power2.in, then hides via onComplete.
  useEffect(() => {
    if (isMenuFirstRender.current) {
      isMenuFirstRender.current = false;
      return;
    }

    const drawer   = drawerRef.current;
    const backdrop = drawerBackdropRef.current;
    const reduced  = prefersReducedMotion();

    if (openMenu) {
      if (reduced) {
        gsap.set(drawer,   { autoAlpha: 1, x: "0%" });
        gsap.set(backdrop, { autoAlpha: 1 });
      } else {
        gsap.to(backdrop, { autoAlpha: 1, duration: 0.22 });
        gsap.fromTo(
          drawer,
          { autoAlpha: 1, x: "100%" },
          { x: "0%", duration: 0.36, ease: ease.drawer }
        );
      }
    } else {
      if (reduced) {
        gsap.set(drawer,   { autoAlpha: 0, x: "100%" });
        gsap.set(backdrop, { autoAlpha: 0 });
      } else {
        gsap.to(backdrop, {
          autoAlpha: 0,
          duration: 0.2,
          onInterrupt: () => { gsap.set(backdrop, { autoAlpha: 0 }); },
        });
        gsap.to(drawer, {
          x: "100%",
          duration: 0.28,
          ease: "power2.in",
          onComplete:  () => { gsap.set(drawer, { autoAlpha: 0 }); },
          onInterrupt: () => { gsap.set(drawer, { autoAlpha: 0 }); },
        });
      }
    }

    return () => {
      gsap.killTweensOf([drawer, backdrop]);
    };
  }, [openMenu]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Fixed header bar ─────────────────────────────────────────────── */}
      <header ref={headerRef} className="fixed left-0 z-50 w-full" style={{ top: "var(--bar-h, 0px)" }}>
        <div className="border-b border-black/[0.04] bg-white/96 backdrop-blur-xl">
          <div className="tesla-shell grid h-[76px] grid-cols-[auto_1fr_auto] items-center gap-4 lg:h-20 lg:grid-cols-[1fr_auto_1fr]">

            {/* Logo */}
            <Link href="/" className="flex min-w-0 flex-col items-center justify-self-start">
              <Image
                src="/logo/okelcor-logo.png"
                alt="Okelcor"
                width={120}
                height={22}
                priority
                style={{ height: "22px", width: "auto" }}
                className="object-contain"
              />
              <span className="mt-0.5 text-[9px] font-bold tracking-[0.22em] text-[var(--primary)] uppercase">
                Growing Together
              </span>
            </Link>

            {/* Desktop nav links */}
            <nav className="hidden items-center justify-center lg:flex">
              <div className="flex items-center rounded-2xl px-2 py-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;

                  if (item.href === "/shop") {
                    return (
                      <div key="shop" onMouseEnter={openShopMenu} onMouseLeave={closeShopMenu}>
                        <Link
                          href="/shop"
                          className={`tesla-nav-link inline-flex items-center gap-1 ${isActive ? "tesla-nav-link-active" : ""}`}
                        >
                          {item.label}
                          <ChevronDown size={12} strokeWidth={2.5} className="hidden" aria-hidden="true" />
                        </Link>
                      </div>
                    );
                  }

                  if (item.href === "/fet") {
                    return (
                      <div key="fet" onMouseEnter={openFetMenu} onMouseLeave={closeFetMenu}>
                        <Link
                          href="/fet"
                          className={`tesla-nav-link inline-flex items-center gap-1 ${isActive ? "tesla-nav-link-active" : ""}`}
                        >
                          {item.label}
                          <ChevronDown size={12} strokeWidth={2.5} className="hidden" aria-hidden="true" />
                        </Link>
                      </div>
                    );
                  }

                  if (item.href === "/wholesale-tire-distributors-europe") {
                    return (
                      <div key="about" onMouseEnter={openAboutMenu} onMouseLeave={closeAboutMenu}>
                        <Link
                          href="/wholesale-tire-distributors-europe"
                          className={`tesla-nav-link ${isActive ? "tesla-nav-link-active" : ""}`}
                        >
                          {item.label}
                        </Link>
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={`tesla-nav-link ${isActive ? "tesla-nav-link-active" : ""}`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </nav>

            {/* Right utility icons */}
            <div className="flex items-center justify-end gap-1 text-black">
              <div className="hidden items-center gap-1 lg:flex">
                <Link href="/contact" className="tesla-icon-btn" aria-label="Help">
                  <CircleHelp size={20} strokeWidth={1.9} />
                </Link>

                <button
                  type="button"
                  onClick={openSearch}
                  className="tesla-icon-btn"
                  aria-label={t.search.ariaLabel}
                >
                  <Search size={20} strokeWidth={1.9} />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOpenLang((prev) => !prev);
                    setOpenMenu(false);
                    setOpenMobileLang(false);
                  }}
                  className={`tesla-icon-btn ${openLang ? "tesla-icon-btn-active" : ""}`}
                  aria-label="Language"
                  aria-expanded={openLang}
                >
                  <Globe size={20} strokeWidth={1.9} />
                </button>

                {authLoading ? (
                  <div className="h-9 w-9 animate-pulse rounded-full bg-black/[0.06]" aria-hidden="true" />
                ) : isAuthed ? (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setOpenProfile((prev) => !prev);
                        setOpenLang(false);
                        setOpenMenu(false);
                      }}
                      className={`tesla-icon-btn ${openProfile ? "tesla-icon-btn-active" : ""}`}
                      aria-label="Account"
                      aria-expanded={openProfile}
                    >
                      <UserCircle2 size={21} strokeWidth={1.9} />
                    </button>

                    {/* Profile dropdown panel */}
                    <div
                      ref={profilePanelRef}
                      className="absolute right-0 top-[calc(100%+10px)] z-50 min-w-[220px] rounded-2xl border border-black/[0.07] bg-white/95 shadow-[0_12px_32px_rgba(0,0,0,0.1)] backdrop-blur-xl"
                      style={{ visibility: "hidden" }}
                    >
                      {/* Email */}
                      <div className="px-4 pb-3 pt-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-black/40">Signed in as</p>
                        <p className="mt-1 truncate text-[0.875rem] font-semibold text-black">
                          {customer?.email ?? "—"}
                        </p>
                      </div>

                      <div className="mx-4 border-t border-black/[0.06]" />

                      {/* Account links */}
                      <div className="p-2">
                        <Link
                          href="/account"
                          onClick={() => setOpenProfile(false)}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[0.875rem] font-semibold text-black/70 transition hover:bg-black/[0.04] hover:text-black"
                        >
                          <LayoutDashboard size={16} strokeWidth={1.9} />
                          My Account
                        </Link>
                        <Link
                          href="/account/orders"
                          onClick={() => setOpenProfile(false)}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[0.875rem] font-semibold text-black/70 transition hover:bg-black/[0.04] hover:text-black"
                        >
                          <Package size={16} strokeWidth={1.9} />
                          My Orders
                        </Link>
                        <button
                          type="button"
                          onClick={() => { setOpenProfile(false); logout().then(() => { window.location.href = "/"; }); }}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[0.875rem] font-semibold text-black/70 transition hover:bg-black/[0.04] hover:text-black"
                        >
                          <LogOut size={16} strokeWidth={2} />
                          Sign Out
                        </button>

                      </div>
                    </div>
                  </div>
                ) : (
                  <Link href="/login" className="tesla-icon-btn" aria-label="Sign in">
                    <UserCircle2 size={21} strokeWidth={1.9} />
                  </Link>
                )}
              </div>

              {/* Cart — always visible */}
              <button
                type="button"
                onClick={() => {
                  openCart();
                  setOpenMenu(false);
                  setOpenLang(false);
                }}
                className="tesla-icon-btn relative"
                aria-label="Open cart"
              >
                <ShoppingCart size={20} strokeWidth={1.9} />
                {totalItems > 0 && (
                  <span className="absolute right-0.5 top-0.5 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-[var(--primary)] px-0.5 text-[9px] font-bold text-white">
                    {totalItems > 99 ? "99+" : totalItems}
                  </span>
                )}
              </button>

              {/* Hamburger — mobile only */}
              <div className="lg:hidden">
                <button
                  type="button"
                  onClick={() => {
                    setOpenMenu((prev) => !prev);
                    setOpenLang(false);
                    setOpenMobileLang(false);
                  }}
                  className={`tesla-icon-btn ${openMenu ? "tesla-icon-btn-active" : ""}`}
                  aria-label={openMenu ? "Close menu" : "Open menu"}
                  aria-expanded={openMenu}
                >
                  {openMenu ? (
                    <X size={22} strokeWidth={2} />
                  ) : (
                    <Menu size={22} strokeWidth={2} />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/*
          Language dropdown backdrop — always in DOM.
          GSAP autoAlpha controls interactivity and opacity.
          lg:block keeps it display:block on desktop; desktop-only interaction.
        */}
        <button
          ref={langBackdropRef}
          type="button"
          aria-label="Close language panel"
          className="fixed inset-0 z-40 hidden bg-transparent lg:block"
          style={{ visibility: "hidden" }}
          onClick={() => setOpenLang(false)}
        />

        <button
          ref={profileBackdropRef}
          type="button"
          aria-label="Close profile panel"
          className="fixed inset-0 z-40 hidden bg-transparent lg:block"
          style={{ visibility: "hidden" }}
          onClick={() => setOpenProfile(false)}
        />

        {/*
          Language dropdown panel — always in DOM, absolutely positioned below the header.
          GSAP autoAlpha handles show/hide; no conditional rendering needed.
          Contains the EN / DE / FR language switcher (i18n).
        */}
        <div
          ref={langPanelRef}
          className="absolute left-0 top-full z-50 w-full border-t border-black/5 bg-white/95 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur-xl"
          style={{ visibility: "hidden" }}
        >
          <div className="tesla-shell py-8 text-black">
            <p className="mb-5 text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--primary)]">
              {t.lang.panelTitle}
            </p>
            <div className="flex gap-3">
              {LANGUAGES.map(({ code, flag }) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => { setLocale(code); setOpenLang(false); }}
                  className={`flex items-center gap-3 rounded-[14px] border px-5 py-3.5 text-left transition hover:border-black/20 hover:bg-black/[0.03] ${
                    locale === code
                      ? "border-[var(--primary)] bg-[var(--primary)]/5 font-semibold"
                      : "border-black/10"
                  }`}
                >
                  <span className="text-xl">{flag}</span>
                  <div>
                    <p className="text-[0.95rem] font-semibold text-black">
                      {t.lang[code]}
                    </p>
                    <p className="text-[0.78rem] font-bold uppercase tracking-wider text-black/40">
                      {code.toUpperCase()}
                    </p>
                  </div>
                  {locale === code && (
                    <span className="ml-1 h-2 w-2 rounded-full bg-[var(--primary)]" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Shop Mega Menu ────────────────────────────────────────────────── */}
        <div
          className={`absolute left-0 top-full z-50 w-full border-t border-black/[0.06] bg-white shadow-lg transition-[opacity,transform] duration-200 ease-out ${openShopMega ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-2"}`}
          onMouseEnter={() => { if (shopCloseTimer.current) clearTimeout(shopCloseTimer.current); }}
          onMouseLeave={closeShopMenu}
        >
          <div className="tesla-shell py-8">
            <div className="grid grid-cols-3 gap-10">

              {/* Col 1 — Tyre Type */}
              <div>
                <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--primary)]">Tyre Type</p>
                <div className="flex flex-col gap-0.5">
                  {([
                    { Icon: Car,       label: "PCR",  sub: "Passenger",   href: "/shop?type=PCR"  },
                    { Icon: Truck,     label: "TBR",  sub: "Truck & Bus", href: "/shop?type=TBR"  },
                    { Icon: Tractor,   label: "OTR",  sub: "Off-Road",    href: "/shop?type=OTR"  },
                    { Icon: RotateCcw, label: "Used", sub: "Used Tyres",  href: "/shop?type=USED" },
                  ] as const).map(({ Icon, label, sub, href }) => (
                    <Link
                      key={label}
                      href={href}
                      onClick={() => setOpenShopMega(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-black/[0.04]"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f5f5f5]">
                        <Icon size={16} strokeWidth={1.8} className="text-[#5c5e62]" />
                      </div>
                      <div>
                        <p className="text-[0.88rem] font-bold text-[#171a20]">{label}</p>
                        <p className="text-[0.74rem] text-[#5c5e62]">{sub}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Col 2 — Top Brands */}
              <div>
                <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--primary)]">Top Brands</p>
                <div className="flex flex-wrap gap-2">
                  {["Michelin", "Bridgestone", "Continental", "Goodyear", "Pirelli", "Dunlop", "Hankook", "Falken"].map((brand) => (
                    <Link
                      key={brand}
                      href={`/shop?brand=${brand.toUpperCase()}`}
                      onClick={() => setOpenShopMega(false)}
                      className="rounded-full border border-black/[0.09] px-3 py-1.5 text-[0.78rem] font-semibold text-[#5c5e62] transition hover:border-[var(--primary)]/40 hover:bg-[#fff5f3] hover:text-[var(--primary)]"
                    >
                      {brand}
                    </Link>
                  ))}
                </div>
                <Link
                  href="/shop"
                  onClick={() => setOpenShopMega(false)}
                  className="mt-4 inline-flex items-center gap-1 text-[0.8rem] font-semibold text-[var(--primary)] transition hover:underline"
                >
                  View all 31 brands <ChevronRight size={13} strokeWidth={2.5} />
                </Link>
              </div>

              {/* Col 3 — Quick Search */}
              <div>
                <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--primary)]">Find Your Tyre</p>
                <div className="flex flex-col gap-2">
                  <Link
                    href="/shop?tab=car"
                    onClick={() => setOpenShopMega(false)}
                    className="flex items-center justify-between rounded-xl border border-black/[0.08] px-4 py-3 text-[0.88rem] font-semibold text-[#171a20] transition hover:border-[var(--primary)]/30 hover:bg-[#fff8f6]"
                  >
                    Search by Car <ChevronRight size={14} strokeWidth={2} />
                  </Link>
                  <Link
                    href="/shop?tab=size"
                    onClick={() => setOpenShopMega(false)}
                    className="flex items-center justify-between rounded-xl border border-black/[0.08] px-4 py-3 text-[0.88rem] font-semibold text-[#171a20] transition hover:border-[var(--primary)]/30 hover:bg-[#fff8f6]"
                  >
                    Search by Size <ChevronRight size={14} strokeWidth={2} />
                  </Link>
                </div>
                <p className="mt-4 text-[0.78rem] font-semibold text-[#5c5e62]">
                  11,650+ tyres in stock
                </p>
              </div>

            </div>
          </div>
        </div>

        {/* ── FET Mega Menu ─────────────────────────────────────────────────── */}
        <div
          className={`absolute left-0 top-full z-50 w-full border-t border-black/[0.06] bg-white shadow-lg transition-[opacity,transform] duration-200 ease-out ${openFetMega ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-2"}`}
          onMouseEnter={() => { if (fetCloseTimer.current) clearTimeout(fetCloseTimer.current); }}
          onMouseLeave={closeFetMenu}
        >
          <div className="tesla-shell py-8">
            <div className="grid max-w-[740px] grid-cols-2 gap-12">

              {/* Col 1 — Product Overview */}
              <div>
                <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-[#dcfce7] px-3 py-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" aria-hidden="true" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#166534]">{t.fetMega.badge}</span>
                </div>
                <h3 className="mb-3 text-[1.1rem] font-extrabold leading-snug text-[#111111]">
                  {t.fetMega.heading}
                </h3>
                <ul className="mb-5 flex flex-col gap-2">
                  {t.fetMega.benefits.map((point) => (
                    <li key={point} className="flex items-center gap-2 text-[0.85rem] text-[#5c5e62]">
                      <CheckCircle2 size={14} strokeWidth={2} className="shrink-0 text-[#22c55e]" />
                      {point}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/fet"
                  onClick={() => setOpenFetMega(false)}
                  className="inline-flex items-center gap-2 rounded-full bg-[#22c55e] px-5 py-2.5 text-[0.85rem] font-semibold text-white transition hover:bg-[#16a34a]"
                >
                  {t.fetMega.learnMore} <ChevronRight size={13} strokeWidth={2.5} />
                </Link>
              </div>

              {/* Col 2 — Quick Stats */}
              <div>
                <div className="mb-4 flex flex-col gap-2">
                  {([
                    { stat: "13.9%",       label: t.fetMega.labelFuelSavings   },
                    { stat: "€900–€1,300", label: t.fetMega.labelAnnualSavings },
                    { stat: "3–5 months",  label: t.fetMega.labelPayback       },
                  ] as const).map(({ stat, label }) => (
                    <div key={stat} className="flex items-center gap-3 rounded-xl bg-[#f0f4f0] px-4 py-3">
                      <Zap size={15} strokeWidth={2} className="shrink-0 text-[#22c55e]" />
                      <span className="text-[0.93rem] font-extrabold text-[#111111]">{stat}</span>
                      <span className="text-[0.8rem] text-[#5c5e62]">{label}</span>
                    </div>
                  ))}
                </div>
                <Link
                  href="/tyre-supply-quotation"
                  onClick={() => setOpenFetMega(false)}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--primary)] px-5 py-2.5 text-[0.85rem] font-semibold text-white transition hover:bg-[#d44519]"
                >
                  {t.fetMega.requestQuote} <ChevronRight size={13} strokeWidth={2.5} />
                </Link>
              </div>

            </div>
          </div>
        </div>

        {/* ── About Mega Menu ───────────────────────────────────────────────── */}
        <div
          className={`absolute left-0 top-full z-50 w-full border-t border-black/[0.06] bg-white shadow-lg transition-[opacity,transform] duration-200 ease-out ${openAboutMega ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-2"}`}
          onMouseEnter={() => { if (aboutCloseTimer.current) clearTimeout(aboutCloseTimer.current); }}
          onMouseLeave={closeAboutMenu}
        >
          <div className="tesla-shell py-8">
            <div className="grid grid-cols-3 gap-10">

              {/* Col 1 — Company */}
              <div>
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--primary)]">About Okelcor</p>
                <p className="mb-4 text-[0.85rem] leading-6 text-[#5c5e62]">
                  B2B and B2C tyre wholesale company headquartered in Munich, Germany. Supplying premium tyres to distributors and fleets across Europe, Africa and the Middle East.
                </p>
                <Link
                  href="/wholesale-tire-distributors-europe"
                  onClick={() => setOpenAboutMega(false)}
                  className="inline-flex items-center gap-1.5 text-[0.82rem] font-semibold text-[var(--primary)] transition hover:underline"
                >
                  Our Story <ChevronRight size={13} strokeWidth={2.5} />
                </Link>
              </div>

              {/* Col 2 — Location */}
              <div>
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--primary)]">Our Office</p>
                <div className="mb-4 flex gap-2.5">
                  <MapPin size={15} strokeWidth={1.8} className="mt-0.5 shrink-0 text-[var(--primary)]" />
                  <address className="not-italic text-[0.85rem] leading-6 text-[#171a20]">
                    <span className="font-semibold">Okelcor GmbH</span><br />
                    Landsberger Str. 155<br />
                    80687 Munich, Germany
                  </address>
                </div>
                <Link
                  href="/contact"
                  onClick={() => setOpenAboutMega(false)}
                  className="inline-flex items-center gap-1.5 text-[0.82rem] font-semibold text-[var(--primary)] transition hover:underline"
                >
                  Contact Us <ChevronRight size={13} strokeWidth={2.5} />
                </Link>
              </div>

              {/* Col 3 — Certifications */}
              <div>
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--primary)]">Certifications</p>
                <div className="mb-4 flex items-start gap-3 rounded-xl border border-[#e2e8e2] bg-[#f0f4f0] p-4">
                  <ShieldCheck size={28} strokeWidth={1.6} className="mt-0.5 shrink-0 text-[#16a34a]" />
                  <div>
                    <p className="text-[0.88rem] font-extrabold text-[#111111]">ISO 9001:2015</p>
                    <p className="mt-0.5 text-[0.75rem] text-[#5c5e62]">Certified by qm-solutions GmbH, Germany</p>
                    <p className="mt-0.5 text-[0.73rem] text-[#9ca3af]">Valid until January 2026</p>
                  </div>
                </div>
                <a
                  href="/documents/CTI-Certificate-ISO9001.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpenAboutMega(false)}
                  className="inline-flex items-center gap-1.5 text-[0.82rem] font-semibold text-[var(--primary)] transition hover:underline"
                >
                  <Download size={13} strokeWidth={2.2} />
                  Download Certificate
                </a>
              </div>

            </div>
          </div>
        </div>
      </header>

      {/*
        Mobile drawer backdrop — always in DOM, fixed full-screen.
        Outside the header so it covers the entire viewport including the header.
      */}
      <button
        ref={drawerBackdropRef}
        type="button"
        aria-label="Close menu"
        className="fixed inset-0 z-40 bg-black/18 backdrop-blur-[2px]"
        style={{ visibility: "hidden" }}
        onClick={closeAll}
      />

      {/*
        Mobile drawer — always in DOM, slides from the right.
        GSAP set on mount establishes x: 100% + visibility: hidden as initial state.
        Contains i18n nav links, language switcher (EN/DE/FR), account + help links.
      */}
      <aside
        ref={drawerRef as React.RefObject<HTMLElement>}
        className="fixed right-0 top-0 z-[60] flex h-screen w-full max-w-[420px] flex-col bg-white shadow-[-14px_0_40px_rgba(0,0,0,0.12)]"
        style={{ visibility: "hidden" }}
        aria-label="Navigation menu"
        aria-modal={openMenu}
      >
        {/* Drawer close button */}
        <div className="flex h-[76px] items-center justify-end px-5 sm:px-6">
          <button
            type="button"
            onClick={closeAll}
            className="tesla-icon-btn"
            aria-label="Close menu"
          >
            <X size={22} strokeWidth={2} />
          </button>
        </div>

        {/* Drawer scrollable content */}
        <div className="hide-scrollbar flex-1 overflow-y-auto px-5 pb-8 pt-2 sm:px-6">
          {!openMobileLang ? (
            <>
              {/* Nav links */}
              <div className="flex flex-col gap-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={closeAll}
                      className={`tesla-mobile-link ${isActive ? "tesla-mobile-link-active" : ""}`}
                    >
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>

              {/* Meta links: search, language, account, help */}
              <div className="mt-7 border-t border-black/[0.06] pt-6">
                <button
                  type="button"
                  className="tesla-mobile-meta-link"
                  onClick={() => { closeAll(); openSearch(); }}
                >
                  <div className="flex items-center gap-4">
                    <Search size={22} strokeWidth={1.9} />
                    <span className="text-[1rem] font-semibold text-black">
                      {t.search.ariaLabel}
                    </span>
                  </div>
                  <ChevronRight size={18} strokeWidth={2} />
                </button>

                <button
                  type="button"
                  className="tesla-mobile-meta-link"
                  onClick={() => setOpenMobileLang(true)}
                >
                  <div className="flex items-start gap-4">
                    <Globe size={22} strokeWidth={1.9} className="mt-0.5" />
                    <div className="text-left">
                      <div className="text-[1rem] font-semibold text-black">
                        {t.lang[locale]}
                      </div>
                      <div className="mt-1 text-[0.94rem] text-black/55">
                        {locale.toUpperCase()}
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={18} strokeWidth={2} />
                </button>

                {authLoading ? (
                  <div className="tesla-mobile-meta-link cursor-default">
                    <div className="flex items-center gap-4">
                      <div className="h-6 w-6 animate-pulse rounded-full bg-black/[0.08]" />
                      <div className="h-4 w-36 animate-pulse rounded bg-black/[0.08]" />
                    </div>
                  </div>
                ) : isAuthed ? (
                  <>
                    <div className="tesla-mobile-meta-link cursor-default">
                      <div className="flex items-start gap-4">
                        <UserCircle2 size={23} strokeWidth={1.9} className="mt-0.5 shrink-0" />
                        <div>
                          <div className="text-[0.78rem] font-bold uppercase tracking-wider text-black/40">
                            Signed in as
                          </div>
                          <div className="mt-0.5 truncate text-[0.95rem] font-semibold text-black">
                            {customer?.email ?? "—"}
                          </div>
                        </div>
                      </div>
                    </div>
                    <Link
                      href="/account"
                      onClick={closeAll}
                      className="tesla-mobile-meta-link"
                    >
                      <div className="flex items-center gap-4">
                        <LayoutDashboard size={22} strokeWidth={1.9} />
                        <span className="text-[1rem] font-semibold text-black">My Account</span>
                      </div>
                    </Link>
                    <Link
                      href="/account/orders"
                      onClick={closeAll}
                      className="tesla-mobile-meta-link"
                    >
                      <div className="flex items-center gap-4">
                        <Package size={22} strokeWidth={1.9} />
                        <span className="text-[1rem] font-semibold text-black">My Orders</span>
                      </div>
                    </Link>
                    <button
                      type="button"
                      onClick={() => { closeAll(); logout().then(() => { window.location.href = "/"; }); }}
                      className="tesla-mobile-meta-link w-full text-left"
                    >
                      <div className="flex items-center gap-4">
                        <LogOut size={22} strokeWidth={1.9} />
                        <span className="text-[1rem] font-semibold text-black">
                          Sign Out
                        </span>
                      </div>
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    onClick={closeAll}
                    className="tesla-mobile-meta-link"
                  >
                    <div className="flex items-center gap-4">
                      <UserCircle2 size={23} strokeWidth={1.9} />
                      <span className="text-[1rem] font-semibold text-black">
                        {t.nav.account}
                      </span>
                    </div>
                  </Link>
                )}

                <Link
                  href="/contact"
                  onClick={closeAll}
                  className="tesla-mobile-meta-link"
                >
                  <div className="flex items-center gap-4">
                    <CircleHelp size={22} strokeWidth={1.9} />
                    <span className="text-[1rem] font-semibold text-black">
                      {t.nav.help}
                    </span>
                  </div>
                </Link>
              </div>
            </>
          ) : (
            /* Mobile language selector — EN / DE / FR */
            <div className="pb-8">
              <button
                type="button"
                onClick={() => setOpenMobileLang(false)}
                className="mb-4 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[0.95rem] font-semibold text-black/70 transition hover:bg-black/[0.04] hover:text-black"
              >
                <ChevronLeft size={18} strokeWidth={2} />
                <span>{t.nav.back}</span>
              </button>

              <p className="mb-4 px-3 text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--primary)]">
                {t.lang.panelTitle}
              </p>

              <div className="flex flex-col gap-2">
                {LANGUAGES.map(({ code, flag }) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => {
                      setLocale(code);
                      setOpenMobileLang(false);
                    }}
                    className={`tesla-mobile-link text-left ${
                      locale === code ? "tesla-mobile-link-active" : ""
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-lg">{flag}</span>
                      <span>{t.lang[code]}</span>
                    </span>
                    {locale === code && (
                      <span className="h-2 w-2 rounded-full bg-[var(--primary)]" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
