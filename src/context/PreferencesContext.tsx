// Internationalization, Regional, Currency & Nationality Context
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ALL_COUNTRIES, ALL_CURRENCIES, CountryData, CurrencyData } from "../data/internationalData";

export type LanguageCode = "fr" | "en" | "es" | "de" | "it" | "pt" | "ja" | "zh" | "ar" | "ru" | "hi" | "ko";
export type CurrencyCode = string;
export type TimeFormat = "24h" | "12h";
export type UnitSystem = "metric" | "imperial";

export const NATIONALITIES: CountryData[] = ALL_COUNTRIES;
export const CURRENCIES: CurrencyData[] = ALL_CURRENCIES;

export const LANGUAGES: { code: LanguageCode; name: string; native: string; flag: string }[] = [
  { code: "fr", name: "Français", native: "Français", flag: "🇫🇷" },
  { code: "en", name: "Anglais", native: "English", flag: "🇬🇧" },
  { code: "es", name: "Espagnol", native: "Español", flag: "🇪🇸" },
  { code: "de", name: "Allemand", native: "Deutsch", flag: "🇩🇪" },
  { code: "it", name: "Italien", native: "Italiano", flag: "🇮🇹" },
  { code: "pt", name: "Portugais", native: "Português", flag: "🇵🇹" },
  { code: "ja", name: "Japonais", native: "日本語", flag: "🇯🇵" },
  { code: "zh", name: "Chinois", native: "中文", flag: "🇨🇳" },
  { code: "ar", name: "Arabe", native: "العربية", flag: "🇸🇦" },
  { code: "ru", name: "Russe", native: "Русский", flag: "🇷🇺" },
  { code: "hi", name: "Hindi", native: "हिन्दी", flag: "🇮🇳" },
  { code: "ko", name: "Coréen", native: "한국어", flag: "🇰🇷" },
];

interface PreferencesState {
  language: LanguageCode;
  nationality: string; // Country code (e.g. "FR")
  currency: CurrencyCode;
  timeFormat: TimeFormat;
  unitSystem: UnitSystem;
  timezone: string;
  setLanguage: (lang: LanguageCode) => void;
  setNationality: (nat: string) => void;
  setCurrency: (curr: CurrencyCode) => void;
  setTimeFormat: (fmt: TimeFormat) => void;
  setUnitSystem: (units: UnitSystem) => void;
  setTimezone: (tz: string) => void;
  formatCurrency: (amountEur: number) => string;
  getCurrencySymbol: () => string;
}

const PreferencesContext = createContext<PreferencesState | undefined>(undefined);

const STORAGE_KEY = "omni_user_preferences";

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>("fr");
  const [nationality, setNationalityState] = useState<string>("FR");
  const [currency, setCurrencyState] = useState<CurrencyCode>("EUR");
  const [timeFormat, setTimeFormatState] = useState<TimeFormat>("24h");
  const [unitSystem, setUnitSystemState] = useState<UnitSystem>("metric");
  const [timezone, setTimezoneState] = useState<string>(
    typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "Europe/Paris"
  );

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.language) setLanguageState(parsed.language);
        if (parsed.nationality) setNationalityState(parsed.nationality);
        if (parsed.currency) setCurrencyState(parsed.currency);
        if (parsed.timeFormat) setTimeFormatState(parsed.timeFormat);
        if (parsed.unitSystem) setUnitSystemState(parsed.unitSystem);
        if (parsed.timezone) setTimezoneState(parsed.timezone);
      }
    } catch (e) {
      console.warn("Could not load preferences from localStorage", e);
    }
  }, []);

  const savePreferences = (patch: Partial<{
    language: LanguageCode;
    nationality: string;
    currency: CurrencyCode;
    timeFormat: TimeFormat;
    unitSystem: UnitSystem;
    timezone: string;
  }>) => {
    try {
      const current = {
        language,
        nationality,
        currency,
        timeFormat,
        unitSystem,
        timezone,
        ...patch,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    } catch (e) {
      console.warn("Could not save preferences", e);
    }
  };

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    savePreferences({ language: lang });
  };

  const setNationality = (nat: string) => {
    setNationalityState(nat);
    savePreferences({ nationality: nat });
  };

  const setCurrency = (curr: CurrencyCode) => {
    setCurrencyState(curr);
    savePreferences({ currency: curr });
  };

  const setTimeFormat = (fmt: TimeFormat) => {
    setTimeFormatState(fmt);
    savePreferences({ timeFormat: fmt });
  };

  const setUnitSystem = (units: UnitSystem) => {
    setUnitSystemState(units);
    savePreferences({ unitSystem: units });
  };

  const setTimezone = (tz: string) => {
    setTimezoneState(tz);
    savePreferences({ timezone: tz });
  };

  const getCurrencySymbol = (): string => {
    const curObj = CURRENCIES.find((c) => c.code === currency);
    return curObj ? curObj.symbol : "€";
  };

  const formatCurrency = (amountEur: number): string => {
    const curObj = CURRENCIES.find((c) => c.code === currency) || CURRENCIES[0];
    const converted = amountEur * curObj.rateToEur;
    return `${Math.round(converted).toLocaleString()} ${curObj.symbol}`;
  };

  return (
    <PreferencesContext.Provider
      value={{
        language,
        nationality,
        currency,
        timeFormat,
        unitSystem,
        timezone,
        setLanguage,
        setNationality,
        setCurrency,
        setTimeFormat,
        setUnitSystem,
        setTimezone,
        formatCurrency,
        getCurrencySymbol,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error("usePreferences must be used within a PreferencesProvider");
  }
  return context;
}
