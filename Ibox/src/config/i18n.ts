import React, { useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, setLanguage } from "../store/store";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const translations: Record<string, Record<"en" | "fr", string>> = require("./translations.json");

export type Locale = "en" | "fr";

let currentLocale: Locale = (() => {
  try {
    // Attempt to auto-detect device locale (RN / web compatible)
    const deviceLocale = Intl?.DateTimeFormat().resolvedOptions().locale ?? "en";
    return deviceLocale.startsWith("fr") ? "fr" : "en";
  } catch {
    return "en";
  }
})();

/**
 * Change the active locale for the app ("en" | "fr").
 */
export function setLocale(locale: Locale) {
  currentLocale = locale;
}

/**
 * Get the currently active locale.
 */
export function getLocale(): Locale {
  return currentLocale;
}

/**
 * Translate a key using the active locale. Falls back to English, then the key itself.
 */
export function t(key: string): string {
  const entry = (translations as Record<string, Record<Locale, string>>)[key];
  if (entry) {
    return entry[currentLocale] ?? entry.en ?? key;
  }
  return key;
}

/**
 * React hook wrapper for translations so components re-render when the locale changes.
 * Uses Redux state for locale if available.
 */
export function useTranslation() {
  const reduxLocale = useSelector((state: RootState) => state.language.value) as Locale;
  const dispatch = useDispatch();

  const translate = useCallback((k: string) => {
    const entry = (translations as Record<string, Record<Locale, string>>)[k];
    if (entry) {
      return entry[reduxLocale] ?? entry.en ?? k;
    }
    return k;
  }, [reduxLocale]);

  const set = useCallback((loc: Locale) => {
    currentLocale = loc; // keep module-level locale in sync
    dispatch(setLanguage(loc));
  }, [dispatch]);

  return {
    t: translate,
    locale: reduxLocale,
    setLocale: set,
  } as const;
} 