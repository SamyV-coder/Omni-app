import { useState, useEffect } from "react";
import { 
  ChevronLeft, 
  User, 
  Shield, 
  BrainCircuit, 
  Bell, 
  Link2, 
  Fingerprint, 
  Lock, 
  EyeOff, 
  Smartphone,
  LogOut,
  Sparkles,
  LogIn,
  CheckCircle2,
  Mic,
  Plus,
  Trash2,
  Volume2,
  Globe,
  Coins,
  Flag,
  Clock,
  Gauge,
  Coffee,
  Heart
} from "lucide-react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { cn, vibrate } from "../lib/utils";
import { sound } from "../lib/sound";
import { useAuth } from "../context/AuthContext";
import { 
  usePreferences, 
  LANGUAGES, 
  CURRENCIES, 
  NATIONALITIES,
  LanguageCode,
  CurrencyCode,
  TimeFormat,
  UnitSystem
} from "../context/PreferencesContext";
import { 
  getStoredVoiceCommands, 
  saveStoredVoiceCommands, 
  CustomVoiceCommand,
  speakText 
} from "../lib/voiceCommands";

// Composant Switch réutilisable
function Toggle({ enabled, onChange, locked = false }: { enabled: boolean; onChange?: () => void; locked?: boolean }) {
  return (
    <button
      onClick={() => !locked && onChange && onChange()}
      disabled={locked}
      className={cn(
        "w-12 h-6 rounded-full transition-colors relative flex items-center",
        enabled ? "bg-indigo-600" : "bg-white/10",
        locked && "opacity-50 cursor-not-allowed"
      )}
    >
      <div
        className={cn(
          "w-4 h-4 rounded-full bg-white absolute transition-transform shadow-sm",
          enabled ? "translate-x-7" : "translate-x-1"
        )}
      />
    </button>
  );
}

export function Settings() {
  const { user, signInWithGoogle, signOut } = useAuth();
  const { 
    language, 
    setLanguage, 
    nationality, 
    setNationality, 
    currency, 
    setCurrency, 
    timeFormat, 
    setTimeFormat, 
    unitSystem, 
    setUnitSystem,
    timezone,
    setTimezone
  } = usePreferences();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [biometrics, setBiometrics] = useState(true);
  const [aiAnalysis, setAiAnalysis] = useState(true);
  const [notifications, setNotifications] = useState(false);
  const [loading, setLoading] = useState(true);

  // Search filter for vast countries and currencies list
  const [countrySearch, setCountrySearch] = useState("");
  const [currencySearch, setCurrencySearch] = useState("");

  // Soutenir OMNI (Système de Don Participatif)
  const [selectedDonation, setSelectedDonation] = useState<number | null>(5);
  const [customDonation, setCustomDonation] = useState<string>("");
  const [donationThanked, setDonationThanked] = useState<boolean>(false);

  // Custom Voice Commands
  const [voiceCommands, setVoiceCommands] = useState<CustomVoiceCommand[]>([]);
  const [newTrigger, setNewTrigger] = useState("");
  const [newActionType, setNewActionType] = useState<any>("START_FOCUS");
  const [newResponse, setNewResponse] = useState("");
  const [showAddCommand, setShowAddCommand] = useState(false);

  useEffect(() => {
    setVoiceCommands(getStoredVoiceCommands());
  }, []);

  const handleToggleCommand = (id: string) => {
    vibrate(20);
    sound.playClick();
    const updated = voiceCommands.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c));
    setVoiceCommands(updated);
    saveStoredVoiceCommands(updated);
  };

  const handleDeleteCommand = (id: string) => {
    vibrate(20);
    sound.playClick();
    const updated = voiceCommands.filter((c) => c.id !== id);
    setVoiceCommands(updated);
    saveStoredVoiceCommands(updated);
  };

  const handleCreateVoiceCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrigger.trim() || !newResponse.trim()) return;
    vibrate(25);
    sound.playSuccess();

    let targetRoute = "/focus";
    let payload: any = null;

    if (newActionType === "START_FOCUS") {
      targetRoute = "/focus";
      payload = { duration: 25 * 60, autoStart: true };
    } else if (newActionType === "FIND_PLACES") {
      targetRoute = "/maps";
    } else if (newActionType === "NAVIGATE") {
      targetRoute = "/wallet";
    } else if (newActionType === "ZEN_MODE") {
      targetRoute = "/focus";
      payload = { zen: true };
    }

    const newCmd: CustomVoiceCommand = {
      id: `vc-${Date.now()}`,
      triggerPhrase: newTrigger.toLowerCase().trim(),
      actionType: newActionType,
      targetRoute,
      payload,
      responseMessage: newResponse.trim(),
      enabled: true,
    };

    const updated = [...voiceCommands, newCmd];
    setVoiceCommands(updated);
    saveStoredVoiceCommands(updated);
    setNewTrigger("");
    setNewResponse("");
    setShowAddCommand(false);
  };

  const handleTestVoiceSpeech = (text: string) => {
    vibrate(20);
    sound.playNotification();
    speakText(text);
  };

  // Charger les paramètres depuis l'API
  useEffect(() => {
    fetch("/api/settings")
      .then(res => res.json())
      .then(data => {
        if (data) {
          setUsername(data.username || user?.displayName || "");
          setEmail(data.email || user?.email || "");
          setBiometrics(data.biometrics !== undefined ? Boolean(data.biometrics) : true);
          setAiAnalysis(data.aiAnalysis !== undefined ? Boolean(data.aiAnalysis) : true);
          setNotifications(Boolean(data.notifications));
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Erreur de chargement des paramètres:", err);
        setLoading(false);
      });
  }, [user]);

  // Sauvegarder les paramètres dans l'API
  const saveSettings = (updates: any) => {
    fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates)
    }).catch(err => console.error("Erreur de sauvegarde:", err));
  };

  const handleToggle = (key: string, value: boolean) => {
    vibrate(20);
    if (key === "biometrics") setBiometrics(value);
    if (key === "aiAnalysis") setAiAnalysis(value);
    if (key === "notifications") setNotifications(value);
    saveSettings({ [key]: value });
  };

  const handleBlur = () => {
    saveSettings({ username, email });
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-white/50">Chargement...</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-4xl mx-auto space-y-8 pb-24 md:pb-10"
    >
      <header className="flex items-center gap-4">
        <Link 
          to="/" 
          className="p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-white/70" />
        </Link>
        <div>
          <h1 className="text-3xl font-light tracking-tight text-white/90">Paramètres Système</h1>
          <p className="text-white/50 mt-1 text-sm">Configuration de ton écosystème OMNI & Gemini.</p>
        </div>
      </header>

      <div className="space-y-6">
        {/* Profil & Identité Firebase */}
        <section className="rounded-3xl bg-white/5 border border-white/10 overflow-hidden backdrop-blur-md">
          <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-medium tracking-wide">Profil & Authentification Firebase</h2>
            </div>
            {user && (
              <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Compte Google Actif
              </span>
            )}
          </div>
          <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <img 
                src={user?.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.uid || "OMNI"}`} 
                alt="Avatar"
                className="w-20 h-20 rounded-2xl bg-black border border-indigo-500/30 object-cover shadow-[0_0_20px_rgba(99,102,241,0.2)]"
              />
              <div className="flex-1 w-full space-y-4">
                <div>
                  <label className="text-xs font-mono text-white/40 uppercase tracking-wider mb-1 block">Nom d'utilisateur</label>
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onBlur={handleBlur}
                    placeholder="Agent OMNI" 
                    className="w-full bg-black/50 border border-white/10 rounded-xl py-2.5 px-4 text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50" 
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-white/40 uppercase tracking-wider mb-1 block">Email (Firebase Auth)</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={handleBlur}
                    placeholder="email@example.com" 
                    className="w-full bg-black/50 border border-white/10 rounded-xl py-2.5 px-4 text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50" 
                  />
                </div>
              </div>
            </div>

            {!user ? (
              <div className="pt-2">
                <button
                  onClick={() => signInWithGoogle()}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Se connecter avec Google Firebase</span>
                </button>
              </div>
            ) : (
              <div className="pt-2">
                <button
                  onClick={() => signOut()}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-red-400 border border-white/10 text-xs font-mono tracking-wider transition-colors flex items-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Se déconnecter</span>
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Soutenir OMNI — Don Participatif & Communauté */}
        <section className="rounded-3xl bg-gradient-to-br from-rose-500/10 via-amber-500/5 to-purple-500/10 border border-rose-500/30 overflow-hidden backdrop-blur-md shadow-[0_0_30px_rgba(244,63,94,0.1)]">
          <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30">
                <Heart className="w-5 h-5 fill-rose-500/30 animate-pulse" />
              </div>
              <div>
                <h2 className="text-lg font-medium tracking-wide text-white">Soutenir OMNI</h2>
                <p className="text-xs text-white/50">Aide-nous à maintenir l'application 100% gratuite et sans pub</p>
              </div>
            </div>

            <span className="text-[10px] font-mono uppercase bg-rose-500/15 text-rose-300 px-3 py-1 rounded-full border border-rose-500/30">
              Community Powered
            </span>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-black/40 border border-white/10">
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Coffee className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-white">Offre-moi un café ☕</h4>
                  <p className="text-xs text-white/40 mt-0.5">
                    OMNI est développé avec passion. Ton soutien permet de financer les serveurs et l'accès aux modèles d'IA pour tous.
                  </p>
                </div>
              </div>
            </div>

            {donationThanked ? (
              <div className="p-6 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-2 border border-emerald-500/30">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-base font-medium text-white">Merci infiniment pour ton soutien précieux ! ❤️</h4>
                <p className="text-xs text-white/60">
                  Grâce à toi, l'écosystème OMNI continue de grandir librement, sans serveur payant obligatoire et accessible à chacun.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-mono text-white/60 uppercase tracking-wider block mb-2.5">
                    Choisis un montant de contribution :
                  </label>
                  
                  {/* Boutons montants suggérés */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { amount: 3, label: "☕ 1 Café (3 €)" },
                      { amount: 5, label: "🥐 Café & Croissant (5 €)" },
                      { amount: 10, label: "⚡ Super Boost (10 €)" },
                      { amount: 25, label: "🚀 Mécène OMNI (25 €)" },
                    ].map((item) => (
                      <button
                        key={item.amount}
                        type="button"
                        onClick={() => {
                          vibrate(15);
                          sound.playClick();
                          setSelectedDonation(item.amount);
                          setCustomDonation("");
                        }}
                        className={cn(
                          "py-3 px-3 rounded-2xl border text-xs font-medium transition-all text-center flex flex-col items-center justify-center gap-1",
                          selectedDonation === item.amount
                            ? "bg-rose-500/20 border-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.25)]"
                            : "bg-white/5 border-white/10 text-white/70 hover:border-white/20"
                        )}
                      >
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Montant personnalisé */}
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      placeholder="Ou saisis un montant libre..."
                      value={customDonation}
                      onChange={(e) => {
                        setCustomDonation(e.target.value);
                        setSelectedDonation(null);
                      }}
                      className="w-full bg-black/50 border border-white/10 rounded-xl py-2.5 px-4 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-rose-500"
                    />
                  </div>
                  <span className="text-xs font-mono text-white/50">€</span>
                </div>

                {/* Bouton de confirmation */}
                <button
                  type="button"
                  onClick={() => {
                    const finalAmount = customDonation ? Number(customDonation) : selectedDonation;
                    if (!finalAmount || finalAmount <= 0) return;
                    vibrate([40, 60, 40]);
                    sound.playSuccess();
                    setDonationThanked(true);
                    setTimeout(() => setDonationThanked(false), 5000);
                  }}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 via-amber-500 to-purple-600 hover:from-rose-400 hover:to-purple-500 text-white font-medium text-xs tracking-wide flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(244,63,94,0.25)] transition-all"
                >
                  <Heart className="w-4 h-4 fill-white" />
                  <span>
                    Contribuer {customDonation ? `${customDonation} €` : selectedDonation ? `${selectedDonation} €` : ""} avec gratitude
                  </span>
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Internationalisation, Langue, Nationalité, Devise & Unités */}
        <section className="rounded-3xl bg-white/5 border border-white/10 overflow-hidden backdrop-blur-md">
          <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-medium tracking-wide">Internationalisation & Région</h2>
                <p className="text-xs text-white/40">Langue, nationalité, devise financière et formats internationaux</p>
              </div>
            </div>

            <span className="text-[10px] font-mono uppercase bg-blue-500/10 text-blue-300 px-2.5 py-1 rounded-full border border-blue-500/20">
              Global Standard
            </span>
          </div>

          <div className="p-6 space-y-6">
            {/* Langue de l'interface et de l'IA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-mono text-white/60 uppercase tracking-wider flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-blue-400" />
                  Langue du système & de l'IA
                </label>
                <select
                  value={language}
                  onChange={(e) => {
                    vibrate(20);
                    sound.playClick();
                    setLanguage(e.target.value as LanguageCode);
                  }}
                  className="w-full bg-black/60 border border-white/10 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code} className="bg-[#111116] text-white">
                      {l.flag} {l.name} ({l.native})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-white/40">Affecte les réponses de Life OS, les briefings vocaux et les menus.</p>
              </div>

              {/* Nationalité / Pays d'ancrage */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono text-white/60 uppercase tracking-wider flex items-center gap-2">
                    <Flag className="w-3.5 h-3.5 text-amber-400" />
                    Nationalité & Pays ({NATIONALITIES.length} pays)
                  </label>
                  <span className="text-[10px] font-mono text-amber-400/80">
                    Sélection : {NATIONALITIES.find(n => n.code === nationality)?.flag} {nationality}
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    placeholder="🔍 Filtrer les pays (ex: France, Algérie, Canada...)"
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-3 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500 mb-2"
                  />
                  <select
                    value={nationality}
                    onChange={(e) => {
                      vibrate(20);
                      sound.playClick();
                      const selectedCode = e.target.value;
                      setNationality(selectedCode);
                      // Auto-suggest associated currency if available
                      const countryMatch = NATIONALITIES.find(c => c.code === selectedCode);
                      if (countryMatch?.currencyCode && CURRENCIES.some(curr => curr.code === countryMatch.currencyCode)) {
                        setCurrency(countryMatch.currencyCode);
                      }
                    }}
                    className="w-full bg-black/60 border border-white/10 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:border-amber-500 transition-colors"
                  >
                    {NATIONALITIES
                      .filter(n => 
                        !countrySearch.trim() || 
                        n.name.toLowerCase().includes(countrySearch.toLowerCase()) || 
                        n.code.toLowerCase().includes(countrySearch.toLowerCase())
                      )
                      .map((n) => (
                        <option key={n.code} value={n.code} className="bg-[#111116] text-white">
                          {n.flag} {n.name} ({n.code})
                        </option>
                      ))}
                  </select>
                </div>
                <p className="text-[11px] text-white/40">Couvre 195+ pays du monde entier. Personnalise le contexte régional et les analyses IA.</p>
              </div>
            </div>

            {/* Devise Financière & Horloge */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-white/5">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono text-white/60 uppercase tracking-wider flex items-center gap-2">
                    <Coins className="w-3.5 h-3.5 text-emerald-400" />
                    Devise Financière ({CURRENCIES.length} devises)
                  </label>
                  <span className="text-[10px] font-mono text-emerald-400/80">
                    Active : {currency} ({CURRENCIES.find(c => c.code === currency)?.symbol})
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    placeholder="🔍 Filtrer les monnaies (ex: Euro, Dollar, Dirham, CFA...)"
                    value={currencySearch}
                    onChange={(e) => setCurrencySearch(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-3 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500 mb-2"
                  />
                  <select
                    value={currency}
                    onChange={(e) => {
                      vibrate(20);
                      sound.playClick();
                      setCurrency(e.target.value as CurrencyCode);
                    }}
                    className="w-full bg-black/60 border border-white/10 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                  >
                    {CURRENCIES
                      .filter(c => 
                        !currencySearch.trim() || 
                        c.name.toLowerCase().includes(currencySearch.toLowerCase()) || 
                        c.code.toLowerCase().includes(currencySearch.toLowerCase()) ||
                        c.symbol.toLowerCase().includes(currencySearch.toLowerCase())
                      )
                      .map((c) => (
                        <option key={c.code} value={c.code} className="bg-[#111116] text-white">
                          {c.code} ({c.symbol}) — {c.name}
                        </option>
                      ))}
                  </select>
                </div>
                <p className="text-[11px] text-white/40">Prend en charge toutes les monnaies internationales mondiales, cryptos et devises régionales.</p>
              </div>

              {/* Format de l'heure & Fuseau */}
              <div className="space-y-2">
                <label className="text-xs font-mono text-white/60 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-purple-400" />
                  Format de l'heure & Alarmes
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      vibrate(20);
                      sound.playClick();
                      setTimeFormat("24h");
                    }}
                    className={`py-3 rounded-2xl border text-xs font-mono transition-all ${
                      timeFormat === "24h"
                        ? "bg-purple-600/30 border-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                        : "bg-white/5 border-white/10 text-white/60 hover:text-white"
                    }`}
                  >
                    24 Heures (14:30)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      vibrate(20);
                      sound.playClick();
                      setTimeFormat("12h");
                    }}
                    className={`py-3 rounded-2xl border text-xs font-mono transition-all ${
                      timeFormat === "12h"
                        ? "bg-purple-600/30 border-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                        : "bg-white/5 border-white/10 text-white/60 hover:text-white"
                    }`}
                  >
                    12 Heures (02:30 PM)
                  </button>
                </div>
                <p className="text-[11px] text-white/40">Fuseau détecté : <strong className="text-white/70 font-mono">{timezone}</strong></p>
              </div>
            </div>

            {/* Système de Mesure */}
            <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="font-medium text-white/90 text-sm flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-indigo-400" />
                  Système d'unités de distance (Maps & Activité)
                </p>
                <p className="text-xs text-white/40">Kilomètres (Métrique) ou Miles (Impérial)</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    vibrate(20);
                    sound.playClick();
                    setUnitSystem("metric");
                  }}
                  className={`px-4 py-2 rounded-xl border text-xs font-mono transition-all ${
                    unitSystem === "metric"
                      ? "bg-indigo-600/30 border-indigo-500 text-indigo-200"
                      : "bg-white/5 border-white/10 text-white/50 hover:text-white"
                  }`}
                >
                  Métrique (km, m)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    vibrate(20);
                    sound.playClick();
                    setUnitSystem("imperial");
                  }}
                  className={`px-4 py-2 rounded-xl border text-xs font-mono transition-all ${
                    unitSystem === "imperial"
                      ? "bg-indigo-600/30 border-indigo-500 text-indigo-200"
                      : "bg-white/5 border-white/10 text-white/50 hover:text-white"
                  }`}
                >
                  Impérial (mi, ft)
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Intelligence Artificielle LIFE OS (Gemini) */}
        <section className="rounded-3xl bg-white/5 border border-white/10 overflow-hidden backdrop-blur-md">
          <div className="p-6 border-b border-white/10 flex items-center gap-3 bg-white/[0.02]">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-medium tracking-wide">LIFE OS & Contrôle Central (Gemini)</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <BrainCircuit className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-white/90">Contrôle multi-onglets par Life OS</p>
                  <p className="text-sm text-white/40">Autorise Life OS (Gemini) à commander Focus, Academy, et Community</p>
                </div>
              </div>
              <Toggle enabled={aiAnalysis} onChange={() => handleToggle("aiAnalysis", !aiAnalysis)} />
            </div>

            <div className="flex items-center justify-between opacity-80">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-white/10 text-white/50">
                  <EyeOff className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-white/90">Confidentialité & Chiffrement Cloud</p>
                  <p className="text-sm text-white/40">Données protégées par les règles de sécurité Firestore</p>
                </div>
              </div>
              <Toggle enabled={true} locked={true} />
            </div>
          </div>
        </section>

        {/* Sécurité & Accès */}
        <section className="rounded-3xl bg-white/5 border border-white/10 overflow-hidden backdrop-blur-md">
          <div className="p-6 border-b border-white/10 flex items-center gap-3 bg-white/[0.02]">
            <Shield className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-medium tracking-wide">Sécurité & Biométrie</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <Fingerprint className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-white/90">Déverrouillage Biométrique OMNI</p>
                  <p className="text-sm text-white/40">Utiliser FaceID / TouchID pour sécuriser l'accès</p>
                </div>
              </div>
              <Toggle enabled={biometrics} onChange={() => handleToggle("biometrics", !biometrics)} />
            </div>
          </div>
        </section>

        {/* Commandes Vocales Personnalisées (Life OS Speech Engine) */}
        <section className="rounded-3xl bg-white/5 border border-white/10 overflow-hidden backdrop-blur-md">
          <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Mic className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-medium tracking-wide">Commandes Vocales Personnalisées</h2>
                <p className="text-xs text-white/40">Créez vos propres phrases d'activation reconnues et exécutées par l'IA</p>
              </div>
            </div>

            <button
              onClick={() => setShowAddCommand(!showAddCommand)}
              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono flex items-center gap-1.5 shadow-md shadow-purple-600/30 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Créer une commande</span>
            </button>
          </div>

          {/* Form to create custom voice command */}
          {showAddCommand && (
            <form onSubmit={handleCreateVoiceCommand} className="p-6 border-b border-white/10 bg-purple-500/[0.03] space-y-4">
              <h3 className="text-sm font-semibold text-white">Nouvelle Commande Vocale</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono text-white/50 block mb-1">Phrase que vous direz (ex: "lance mon focus")</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: active le mode travail"
                    value={newTrigger}
                    onChange={(e) => setNewTrigger(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-white/50 block mb-1">Type d'action exécutée</label>
                  <select
                    value={newActionType}
                    onChange={(e) => setNewActionType(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="START_FOCUS">Lancer Focus Deep Work (25m)</option>
                    <option value="DAILY_BRIEFING">Briefing Audio Matinal (Life OS)</option>
                    <option value="FIND_PLACES">Ouvrir Maps & trouver un café/coworking</option>
                    <option value="ZEN_MODE">Activer le Mode Zen Plein Écran</option>
                    <option value="NAVIGATE">Aller à l'Academy Finance</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-mono text-white/50 block mb-1">Réponse vocale de l'IA (Text-to-Speech)</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Mode travail enclenché, bonne concentration."
                  value={newResponse}
                  onChange={(e) => setNewResponse(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCommand(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-mono text-white/50 hover:text-white"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono font-medium shadow-md shadow-purple-600/30"
                >
                  Enregistrer la commande
                </button>
              </div>
            </form>
          )}

          {/* List of custom voice commands */}
          <div className="p-6 space-y-3">
            {voiceCommands.map((cmd) => (
              <div
                key={cmd.id}
                className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
                  cmd.enabled
                    ? "bg-white/[0.03] border-white/10 hover:border-purple-500/30"
                    : "bg-white/[0.01] border-white/5 opacity-50"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white font-mono flex items-center gap-1.5">
                      <Mic className="w-3.5 h-3.5 text-purple-400" />
                      « {cmd.triggerPhrase} »
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {cmd.actionType}
                    </span>
                  </div>
                  <p className="text-xs text-white/60 font-light flex items-center gap-1">
                    <span>Réponse :</span>
                    <span className="italic text-white/80">"{cmd.responseMessage}"</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleTestVoiceSpeech(cmd.responseMessage)}
                    title="Tester la voix Text-to-Speech"
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                  >
                    <Volume2 className="w-4 h-4 text-purple-400" />
                  </button>

                  <Toggle enabled={cmd.enabled} onChange={() => handleToggleCommand(cmd.id)} />

                  <button
                    onClick={() => handleDeleteCommand(cmd.id)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Notifications */}
        <section className="rounded-3xl bg-white/5 border border-white/10 overflow-hidden backdrop-blur-md">
          <div className="p-6 border-b border-white/10 flex items-center gap-3 bg-white/[0.02]">
            <Smartphone className="w-5 h-5 text-orange-400" />
            <h2 className="text-lg font-medium tracking-wide">Notifications & Alertes</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-white/90">Alertes Focus & Academy</p>
                  <p className="text-sm text-white/40">Rappels de fin de session Pomodoro et conseils quotidiens</p>
                </div>
              </div>
              <Toggle enabled={notifications} onChange={() => handleToggle("notifications", !notifications)} />
            </div>
          </div>
        </section>
      </div>
    </motion.div>
  );
}
