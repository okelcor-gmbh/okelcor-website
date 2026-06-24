"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  type Locale,
  type Translations,
  translations,
  defaultLocale,
} from "@/lib/translations";

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translations;
};

const LanguageContext = createContext<LanguageContextValue>({
  locale: defaultLocale,
  setLocale: () => {},
  t: translations[defaultLocale],
});

const STORAGE_KEY = "okelcor_locale";
const COOKIE_NAME = "okelcor_locale";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function persistLocale(value: Locale) {
  localStorage.setItem(STORAGE_KEY, value);
  document.cookie = `${COOKIE_NAME}=${value};path=/;max-age=${COOKIE_MAX_AGE};SameSite=Lax`;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  // On mount: a stored locale (returning visitor OR an explicit manual choice)
  // always wins. Only when nothing is stored do we auto-detect from the visitor's
  // country — strictly first-visit. Once detection resolves, we persist the result
  // so it never runs again and any later manual switch overrides it.
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (stored && stored in translations) {
      setLocaleState(stored);
      persistLocale(stored);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        // Backend resolves country (via CDN geo headers) → locale through its
        // authoritative country→locale map. Country list is never hardcoded here.
        const res = await fetch("/api/i18n/detect", { cache: "no-store" });
        if (!res.ok) return;
        const data: { locale?: string } = await res.json();
        const detected = data.locale;
        if (cancelled || !detected || !(detected in translations)) return;

        if (detected !== defaultLocale) {
          const next = detected as Locale;
          setLocaleState(next);
          persistLocale(next);
          // Re-render server components so they re-fetch with the new locale cookie.
          router.refresh();
        } else {
          // Remember that we resolved to the default so we don't re-detect.
          persistLocale(defaultLocale);
        }
      } catch {
        // Geo/backend unavailable — stay on the default locale.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  // Keep <html lang="..."> in sync
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    persistLocale(next);
    // Re-run server components (e.g. HeroSection) so they re-fetch the API
    // with the new locale cookie. router.refresh() does not cause a full reload.
    router.refresh();
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t: translations[locale] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
