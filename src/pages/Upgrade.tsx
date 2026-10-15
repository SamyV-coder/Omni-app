import { useState } from "react";
import { 
  Crown, 
  Sparkles, 
  Check, 
  Zap, 
  Bot, 
  Heart, 
  Coffee, 
  ShieldCheck, 
  Pin, 
  Star, 
  Flame, 
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { vibrate, cn } from "../lib/utils";
import { sound } from "../lib/sound";
import { usePreferences } from "../context/PreferencesContext";
import { useAuth } from "../context/AuthContext";

export function Upgrade() {
  const { user, directUser } = useAuth();
  const { getCurrencySymbol } = usePreferences();
  const currencySym = getCurrencySymbol();

  const [activePlan, setActivePlan] = useState<string>("all-access");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  
  // Status local
  const [vipActive, setVipActive] = useState(() => {
    return localStorage.getItem("omni_vip_coach_active") === "true";
  });
  const [allAccessActive, setAllAccessActive] = useState(() => {
    return localStorage.getItem("omni_all_access_active") === "true";
  });

  const [donationSuccess, setDonationSuccess] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState<number | null>(5);
  const [customDonation, setCustomDonation] = useState("");

  const handleActivateAllAccess = () => {
    vibrate([40, 80, 40]);
    sound.playSuccess();
    setAllAccessActive(true);
    setVipActive(true);
    localStorage.setItem("omni_all_access_active", "true");
    localStorage.setItem("omni_vip_coach_active", "true");
  };

  const handleActivateVipCoach = () => {
    vibrate([40, 80, 40]);
    sound.playSuccess();
    setVipActive(true);
    localStorage.setItem("omni_vip_coach_active", "true");
  };

  const handleSendDonation = () => {
    vibrate([30, 60, 30]);
    sound.playSuccess();
    setDonationSuccess(true);
    setTimeout(() => setDonationSuccess(false), 4000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="max-w-5xl mx-auto space-y-10 pb-24 md:pb-12"
    >
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono uppercase bg-amber-500/10 text-amber-400 px-3 py-1 rounded-full border border-amber-500/20 flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5" />
              <span>OMNI Premium Suite</span>
            </span>
            <span className="text-xs font-mono uppercase bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/20">
              Sans Engagement
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-light tracking-tight text-white/90">
            Pass & Abonnements <span className="font-medium bg-gradient-to-r from-amber-400 via-orange-400 to-indigo-400 bg-clip-text text-transparent">Upgrade</span>
          </h1>
          <p className="text-white/50 text-sm md:text-base mt-2 max-w-2xl font-light">
            Débloque la pleine puissance d'OMNI. Toutes les fonctionnalités de base restent 100% gratuites à vie. Retrouve ici l'ensemble des formules avancées.
          </p>
        </div>

        {/* Toggle Mensuel / Annuel (-20%) */}
        <div className="flex items-center bg-white/5 p-1 rounded-2xl border border-white/10 shrink-0">
          <button
            onClick={() => {
              vibrate(15);
              sound.playClick();
              setBillingCycle("monthly");
            }}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-medium transition-all",
              billingCycle === "monthly" ? "bg-white text-black font-semibold shadow" : "text-white/60 hover:text-white"
            )}
          >
            Facturation Mensuelle
          </button>
          <button
            onClick={() => {
              vibrate(15);
              sound.playClick();
              setBillingCycle("yearly");
            }}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5",
              billingCycle === "yearly" ? "bg-white text-black font-semibold shadow" : "text-white/60 hover:text-white"
            )}
          >
            <span>Annuel</span>
            <span className="text-[10px] font-mono bg-emerald-500 text-black px-1.5 py-0.5 rounded-full font-bold">
              -25%
            </span>
          </button>
        </div>
      </header>

      {/* Main Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Plan 1: Gratuit & Ouvert */}
        <div className="rounded-3xl bg-black/40 border border-white/10 p-6 md:p-8 backdrop-blur-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono uppercase tracking-widest text-white/40">Base Gratuite</span>
              <span className="text-[10px] font-mono bg-white/10 text-white/70 px-2.5 py-0.5 rounded-full">Actif par défaut</span>
            </div>
            <h3 className="text-2xl font-medium text-white mb-1">OMNI Standard</h3>
            <p className="text-xs text-white/50 mb-6">L'essentiel pour booster son quotidien sans débourser un centime.</p>

            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-light font-mono text-white">0 €</span>
              <span className="text-xs text-white/40">/ à vie</span>
            </div>

            <ul className="space-y-3 text-xs text-white/70">
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Minuteur Pomodoro & Sessions Focus</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Simulateur financier 50/30/20</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Publications & Demandes de services gratuites</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Assistant Gemini Life OS (texte & audio)</span>
              </li>
            </ul>
          </div>

          <div className="pt-8">
            <div className="w-full py-3 rounded-2xl bg-white/5 border border-white/10 text-center text-xs font-mono text-white/50">
              Inclus pour tous les membres
            </div>
          </div>
        </div>

        {/* Plan 2: Coach IA VIP (Academy) */}
        <div className="rounded-3xl bg-gradient-to-b from-purple-950/30 via-black/60 to-black/80 border border-purple-500/30 p-6 md:p-8 backdrop-blur-xl flex flex-col justify-between relative shadow-[0_0_40px_rgba(168,85,247,0.12)]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono uppercase tracking-widest text-purple-400">Academy Pro</span>
              <span className="text-[10px] font-mono bg-purple-500/20 text-purple-300 px-2.5 py-0.5 rounded-full border border-purple-500/30">
                Audit Financier
              </span>
            </div>
            <h3 className="text-2xl font-medium text-white mb-1">Coach IA VIP</h3>
            <p className="text-xs text-white/50 mb-6">Stratégie patrimoniale, roadmaps de Side Hustle et analyses sur-mesure.</p>

            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-light font-mono text-purple-300">
                {billingCycle === "monthly" ? "9.99 €" : "7.49 €"}
              </span>
              <span className="text-xs text-white/40">/ mois</span>
            </div>

            <ul className="space-y-3 text-xs text-white/80">
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Audit complet des dépenses et détection de fuites</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Plan d'action Side Hustle individualisé</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Accès prioritaire aux modèles Gemini Pro</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Badge VIP sur ton profil</span>
              </li>
            </ul>
          </div>

          <div className="pt-8">
            <button
              onClick={handleActivateVipCoach}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium text-xs tracking-wide flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all cursor-pointer"
            >
              <Crown className="w-4 h-4 text-purple-200" />
              <span>{vipActive ? "Coach VIP Déjà Actif ✨" : "Débloquer le Coach VIP"}</span>
            </button>
          </div>
        </div>

        {/* Plan 3: OMNI ALL-ACCESS (Pass Ultime) */}
        <div className="rounded-3xl bg-gradient-to-b from-amber-500/20 via-orange-950/20 to-black border-2 border-amber-500/60 p-6 md:p-8 backdrop-blur-xl flex flex-col justify-between relative shadow-[0_0_50px_rgba(245,158,11,0.2)]">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold text-[10px] font-mono uppercase px-3 py-1 rounded-full shadow-lg">
            Recommandé • Pass Ultime
          </div>

          <div>
            <div className="flex items-center justify-between mb-4 mt-1">
              <span className="text-xs font-mono uppercase tracking-widest text-amber-300">Tout-en-un</span>
              <span className="text-[10px] font-mono bg-amber-500/20 text-amber-200 px-2.5 py-0.5 rounded-full border border-amber-500/40">
                Super-Pass
              </span>
            </div>
            <h3 className="text-2xl font-medium text-white mb-1">OMNI All-Access</h3>
            <p className="text-xs text-white/50 mb-6">Regroupe tous les services : Coach VIP, Boosts illimités et Life OS Illimité.</p>

            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-light font-mono text-amber-300">
                {billingCycle === "monthly" ? "14.99 €" : "11.20 €"}
              </span>
              <span className="text-xs text-white/40">/ mois</span>
            </div>

            <ul className="space-y-3 text-xs text-white/90">
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-medium text-amber-200">Coach IA VIP inclus</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-amber-400 shrink-0" />
                <span>3 Boosts d'annonces offerts par mois</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Générateur de Routine illimité avec alarmes auto</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Synthèse vocale et audio Life OS sans latence</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Badge Mécène OMNI Or</span>
              </li>
            </ul>
          </div>

          <div className="pt-8">
            <button
              onClick={handleActivateAllAccess}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 hover:from-amber-400 hover:to-orange-400 text-black font-semibold text-xs tracking-wide flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(245,158,11,0.4)] transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 fill-black" />
              <span>{allAccessActive ? "Pass All-Access Actif ✨" : "Activer OMNI All-Access"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Module Boost Marché de Services */}
      <div className="rounded-3xl bg-black/40 border border-white/10 p-6 md:p-8 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Zap className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-xl font-medium text-white">Boosts à la carte — Marché de Services</h3>
              <p className="text-xs text-white/50 mt-0.5">Épingle tes offres en tête de liste pour multiplier tes contacts par 5.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono text-white/40 uppercase">Flash</span>
              <h4 className="text-base font-medium text-white mt-1">Boost 24 Heures</h4>
              <p className="text-xs text-white/50 mt-1">Idéal pour un besoin urgent de compétences.</p>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xl font-mono text-amber-300 font-bold">2.99 €</span>
              <span className="text-xs text-white/40 font-mono">À l'unité</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col justify-between relative">
            <span className="absolute -top-2.5 right-4 bg-amber-500 text-black text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full">
              Populaire
            </span>
            <div>
              <span className="text-[10px] font-mono text-amber-400 uppercase">Impact</span>
              <h4 className="text-base font-medium text-white mt-1">Boost 7 Jours</h4>
              <p className="text-xs text-white/50 mt-1">Une semaine complète au sommet de la marketplace.</p>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xl font-mono text-amber-300 font-bold">7.99 €</span>
              <span className="text-xs text-white/40 font-mono">À l'unité</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono text-white/40 uppercase">Pro</span>
              <h4 className="text-base font-medium text-white mt-1">Boost 30 Jours</h4>
              <p className="text-xs text-white/50 mt-1">Présence continue pour les freelances et experts.</p>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xl font-mono text-amber-300 font-bold">19.99 €</span>
              <span className="text-xs text-white/40 font-mono">À l'unité</span>
            </div>
          </div>
        </div>
      </div>

      {/* Soutenir OMNI (Système de Don Participatif) */}
      <div className="rounded-3xl bg-gradient-to-br from-rose-500/10 via-amber-500/5 to-purple-500/10 border border-rose-500/30 p-6 md:p-8 backdrop-blur-xl shadow-[0_0_30px_rgba(244,63,94,0.1)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-rose-500/15 text-rose-400 border border-rose-500/30">
              <Coffee className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-medium text-white">Soutenir OMNI & la Communauté</h3>
                <span className="text-[10px] font-mono bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full border border-rose-500/30">
                  Don Libre
                </span>
              </div>
              <p className="text-xs text-white/50 mt-1">
                OMNI est pensé comme une application mobile légère et libre. Si tu aimes l'outil, offre un café pour aider au maintien des serveurs !
              </p>
            </div>
          </div>
        </div>

        {donationSuccess ? (
          <div className="p-6 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <h4 className="text-base font-medium text-white">Merci pour ta générosité ! ❤️</h4>
            <p className="text-xs text-white/60">Ton soutien direct permet de maintenir l'app sans publicité.</p>
          </div>
        ) : (
          <div className="space-y-4">
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

            <div className="flex items-center gap-3">
              <input
                type="number"
                placeholder="Montant libre personnalisé (ex: 15)..."
                value={customDonation}
                onChange={(e) => {
                  setCustomDonation(e.target.value);
                  setSelectedDonation(null);
                }}
                className="flex-1 bg-black/50 border border-white/10 rounded-xl py-2.5 px-4 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-rose-500"
              />
              <button
                onClick={handleSendDonation}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 via-amber-500 to-purple-600 hover:from-rose-400 hover:to-purple-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-md shadow-rose-500/20"
              >
                <Heart className="w-3.5 h-3.5 fill-white" />
                <span>Contribuer</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Garantie & Sécurité */}
      <div className="flex items-center justify-center gap-2 text-xs text-white/40 font-mono text-center">
        <ShieldCheck className="w-4 h-4 text-emerald-400" />
        <span>Paiements cryptés sécurisés • Résiliable à tout moment en 1 clic</span>
      </div>
    </motion.div>
  );
}
