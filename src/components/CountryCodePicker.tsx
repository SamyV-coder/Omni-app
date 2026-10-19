import { useState, useMemo, useRef, useEffect } from "react";
import { Search, X, Check, Globe } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ALL_COUNTRIES, CountryData } from "../data/internationalData";
import { vibrate } from "../lib/utils";

// Top common international prefixes specifically highlighted
const POPULAR_DIAL_CODES = [
  { code: "US", dialCode: "+1", name: "USA / Canada", flag: "🇺🇸" },
  { code: "FR", dialCode: "+33", name: "France", flag: "🇫🇷" },
  { code: "GB", dialCode: "+44", name: "Royaume-Uni", flag: "🇬🇧" },
  { code: "MA", dialCode: "+212", name: "Maroc", flag: "🇲🇦" },
  { code: "DZ", dialCode: "+213", name: "Algérie", flag: "🇩🇿" },
  { code: "AE", dialCode: "+971", name: "Émirats Arabes Unis", flag: "🇦🇪" },
  { code: "TN", dialCode: "+216", name: "Tunisie", flag: "🇹🇳" },
  { code: "DE", dialCode: "+49", name: "Allemagne", flag: "🇩🇪" },
  { code: "ES", dialCode: "+34", name: "Espagne", flag: "🇪🇸" },
  { code: "IT", dialCode: "+39", name: "Italie", flag: "🇮🇹" },
  { code: "CI", dialCode: "+225", name: "Côte d'Ivoire", flag: "🇨🇮" },
  { code: "SN", dialCode: "+221", name: "Sénégal", flag: "🇸🇳" },
  { code: "SA", dialCode: "+966", name: "Arabie Saoudite", flag: "🇸🇦" },
  { code: "BE", dialCode: "+32", name: "Belgique", flag: "🇧🇪" },
  { code: "CH", dialCode: "+41", name: "Suisse", flag: "🇨🇭" },
];

interface CountryCodePickerProps {
  value: string; // e.g. "+33"
  onChange: (dialCode: string, country?: CountryData) => void;
  searchPlaceholder?: string;
  className?: string;
}

export function CountryCodePicker({
  value,
  onChange,
  searchPlaceholder = "Rechercher pays ou indicatif (+33, +1, Maroc...)",
  className = "",
}: CountryCodePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Selected country object
  const selectedCountry = useMemo(() => {
    return ALL_COUNTRIES.find((c) => c.dialCode === value) || {
      code: "GLOBAL",
      name: "International",
      flag: "🌐",
      dialCode: value,
      currencyCode: "USD",
    };
  }, [value]);

  // Focus search input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else {
      setSearch("");
    }
  }, [isOpen]);

  // Clean string helper for case & accent insensitive comparison
  const normalize = (str: string) =>
    str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  // Filtered countries
  const filteredCountries = useMemo(() => {
    const q = normalize(search.trim());
    if (!q) return ALL_COUNTRIES;

    // Remove leading plus for dial code matching
    const qCode = q.startsWith("+") ? q.slice(1) : q;

    return ALL_COUNTRIES.filter((c) => {
      const nameMatch = normalize(c.name).includes(q);
      const codeMatch = c.code.toLowerCase().includes(q);
      const dialCodeClean = (c.dialCode || "").replace("+", "");
      const dialMatch = (c.dialCode || "").includes(q) || dialCodeClean.startsWith(qCode);
      return nameMatch || codeMatch || dialMatch;
    });
  }, [search]);

  const handleSelect = (country: CountryData) => {
    vibrate(25);
    onChange(country.dialCode || "+1", country);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => {
          vibrate(15);
          setIsOpen(true);
        }}
        className="flex items-center justify-between gap-1.5 h-[46px] px-3.5 bg-black/60 hover:bg-black/80 border border-white/10 hover:border-emerald-500/50 rounded-2xl text-white font-mono text-xs transition-all focus:outline-none focus:border-emerald-500 shadow-sm"
        title="Changer l'indicatif international"
      >
        <span className="text-base select-none">{selectedCountry.flag}</span>
        <span className="font-semibold tracking-tight text-white/90">{value}</span>
        <span className="text-[10px] text-white/40 ml-0.5">▼</span>
      </button>

      {/* Modal / Popover Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
            {/* Click outside backdrop */}
            <div
              className="absolute inset-0"
              onClick={() => setIsOpen(false)}
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="relative z-10 w-full sm:max-w-md max-h-[85vh] flex flex-col bg-[#0c0d14] border border-white/15 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white">Indicatif Téléphonique</h3>
                    <p className="text-[11px] text-white/40 font-mono">195+ pays reconnus au niveau mondial</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="p-3 border-b border-white/10 bg-black/40">
                <div className="relative flex items-center">
                  <Search className="w-4 h-4 text-white/40 absolute left-3.5 pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-9 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="absolute right-2.5 p-1 text-white/40 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Popular Quick-Select Chips */}
                {!search && (
                  <div className="mt-3">
                    <p className="text-[10px] font-mono uppercase tracking-wider text-white/40 mb-1.5">
                      Accès Rapide International :
                    </p>
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                      {POPULAR_DIAL_CODES.map((pop) => (
                        <button
                          key={pop.code}
                          type="button"
                          onClick={() => {
                            const full = ALL_COUNTRIES.find((c) => c.code === pop.code) || {
                              code: pop.code,
                              name: pop.name,
                              flag: pop.flag,
                              currencyCode: "USD",
                              dialCode: pop.dialCode,
                            };
                            handleSelect(full);
                          }}
                          className={`shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-mono transition-all ${
                            value === pop.dialCode
                              ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                              : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          <span>{pop.flag}</span>
                          <span>{pop.dialCode}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Country List */}
              <div className="flex-1 overflow-y-auto divide-y divide-white/5 p-1 max-h-[50vh] custom-scrollbar">
                {filteredCountries.length === 0 ? (
                  <div className="p-8 text-center text-xs text-white/40 font-light">
                    Aucun pays trouvé pour "{search}"
                  </div>
                ) : (
                  filteredCountries.map((country) => {
                    const isSelected = country.dialCode === value;
                    return (
                      <button
                        key={`${country.code}-${country.dialCode}`}
                        type="button"
                        onClick={() => handleSelect(country)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors text-left group ${
                          isSelected
                            ? "bg-emerald-500/15 border border-emerald-500/30 text-white"
                            : "hover:bg-white/5 text-white/80 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <span className="text-xl shrink-0 select-none">{country.flag}</span>
                          <div className="overflow-hidden">
                            <p className="text-xs font-medium text-white truncate">{country.name}</p>
                            <span className="text-[10px] font-mono text-white/40 tracking-wider">
                              {country.code}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0 ml-3">
                          <span className="text-xs font-mono font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                            {country.dialCode || "+1"}
                          </span>
                          {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Footer Info */}
              <div className="p-3 border-t border-white/10 bg-black/40 text-center">
                <span className="text-[10px] font-mono text-white/40">
                  {filteredCountries.length} pays disponibles • Numérotation conforme E.164
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
