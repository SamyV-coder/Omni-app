import { useState, useEffect } from "react";
import { 
  BookOpen, 
  TrendingUp, 
  AlertTriangle, 
  Sparkles, 
  Loader2, 
  ArrowRight, 
  BrainCircuit, 
  Target, 
  Bot, 
  CheckCircle,
  Calculator,
  PieChart,
  ShieldCheck,
  Award,
  Crown,
  Lock,
  X,
  Check,
  Zap,
  Flame,
  FileSpreadsheet
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import { useLocation } from "react-router-dom";
import { vibrate, cn } from "../lib/utils";
import { sound } from "../lib/sound";
import { useAuth } from "../context/AuthContext";
import { usePreferences } from "../context/PreferencesContext";

export function Wallet() {
  const { updateScore } = useAuth();
  const { formatCurrency, getCurrencySymbol } = usePreferences();
  const location = useLocation();
  const currencySym = getCurrencySymbol();
  const [topic, setTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [advice, setAdvice] = useState("");
  const [scoreRewarded, setScoreRewarded] = useState(false);

  // VIP Coach Modal State
  const [isVipModalOpen, setIsVipModalOpen] = useState(false);
  const [vipSubscribed, setVipSubscribed] = useState(() => {
    return localStorage.getItem("omni_vip_coach_active") === "true";
  });

  // Interactive 50/30/20 Smart Simulator (100% Gratuit)
  const [monthlyIncome, setMonthlyIncome] = useState<number>(2500);

  // Financial Goal Simulator (Temps nécessaire pour atteindre un objectif)
  const [savingsGoalTarget, setSavingsGoalTarget] = useState<number>(5000);
  const [goalLabel, setGoalLabel] = useState<string>("Fonds d'Urgence Total");

  const needs = Math.round(monthlyIncome * 0.50);
  const wants = Math.round(monthlyIncome * 0.30);
  const savings = Math.max(1, Math.round(monthlyIncome * 0.20));
  const emergencyFundTarget = Math.round(needs * 3); // 3 mois de dépenses vitales

  const monthsToReachGoal = Math.ceil(savingsGoalTarget / savings);

  useEffect(() => {
    if (location.state?.prefilledTopic) {
      setTopic(location.state.prefilledTopic);
      analyzeTopic(location.state.prefilledTopic);
    }
  }, [location.state]);

  const analyzeTopic = async (customTopic?: string) => {
    const q = customTopic || topic;
    if (!q.trim() || isGenerating) return;
    setIsGenerating(true);
    setAdvice("");
    sound.playClick();
    vibrate(30);
    
    try {
      const res = await fetch("/api/gemini/mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: q }),
      });
      const data = await res.json();
      setAdvice(data.advice || "Conseil généré par le Mentor IA.");
      sound.playComplete();
      vibrate(50);

      // Attribution de points OMNI Score (+10 pts)
      if (!scoreRewarded) {
        updateScore(10);
        setScoreRewarded(true);
      }
    } catch (error) {
      console.error(error);
      setAdvice("Une erreur est survenue lors de la communication avec le Mentor IA. Vérifie ta connexion et réessaie. 🛠️");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUnlockVip = () => {
    vibrate([50, 80, 50]);
    sound.playSuccess();
    setVipSubscribed(true);
    localStorage.setItem("omni_vip_coach_active", "true");
    setTimeout(() => {
      setIsVipModalOpen(false);
    }, 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-5xl mx-auto space-y-10 pb-24 md:pb-0"
    >
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 text-emerald-400 mb-2">
            <BookOpen className="w-5 h-5" />
            <span className="font-mono text-sm tracking-widest uppercase">Financial Academy OMNI</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-light tracking-tight text-white/90">
            Intelligence Financière
          </h1>
          <p className="text-white/50 mt-2 text-base md:text-lg max-w-2xl font-light">
            Centre d'apprentissage pour gérer son argent, générer des revenus et éviter les erreurs fatales. 100% éducatif, aucun compte bancaire ou carte de crédit requis.
          </p>
        </div>

        {/* Bouton Optionnel Coach IA VIP */}
        <button
          onClick={() => {
            vibrate(20);
            sound.playClick();
            setIsVipModalOpen(true);
          }}
          className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-500/15 via-purple-500/15 to-indigo-500/15 hover:from-amber-500/25 hover:to-indigo-500/25 border border-amber-500/40 text-amber-200 text-xs font-medium transition-all shadow-[0_0_20px_rgba(245,158,11,0.15)] group shrink-0"
        >
          <Crown className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
          <span>{vipSubscribed ? "Coach VIP Actif ✨" : "Débloquer l'analyse sur-mesure"}</span>
        </button>
      </header>

      {/* BANNER VIP COACH OPTIONNEL (Non-intrusif) */}
      <div className="rounded-3xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-indigo-500/10 border border-amber-500/30 p-6 md:p-8 backdrop-blur-xl relative overflow-hidden shadow-[0_0_30px_rgba(245,158,11,0.08)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start sm:items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/30 shrink-0">
              <Crown className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                  Option Premium VIP
                </span>
                <span className="text-xs text-white/40">Audit Patrimonial & Plan d'Action Personnalisé</span>
              </div>
              <h3 className="text-xl font-medium text-white">Coach IA VIP — Analyse Sur-Mesure</h3>
              <p className="text-xs text-white/50 mt-1 max-w-xl">
                L'ensemble des cours et calculateurs reste 100% gratuit. Débloque en option des rapports financiers ultra-détaillés et un accompagnement illimité par Gemini Pro.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              vibrate(20);
              sound.playClick();
              setIsVipModalOpen(true);
            }}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-semibold text-xs transition-all shadow-[0_0_20px_rgba(245,158,11,0.25)] flex items-center justify-center gap-2 shrink-0"
          >
            <span>{vipSubscribed ? "Consulter mon Espace VIP" : "Découvrir le Coach VIP"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Educational Pillars (100% Gratuits) */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div 
            onClick={() => { setTopic("Règle des 50/30/20 et fonds de sécurité"); analyzeTopic("Règle des 50/30/20 et fonds de sécurité"); }}
            className="rounded-3xl bg-black/40 border border-white/10 p-8 backdrop-blur-xl hover:bg-white/5 hover:border-blue-500/30 transition-all group shadow-[inset_0_0_40px_rgba(255,255,255,0.02)] cursor-pointer"
          >
            <div className="p-4 rounded-2xl bg-blue-500/10 text-blue-400 w-fit mb-6 border border-blue-500/20 group-hover:scale-110 transition-transform">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-medium tracking-wide mb-3 text-white/90">1. Gérer son argent</h3>
            <p className="text-white/50 text-sm leading-relaxed font-light">
              Maîtrise la règle d'or 50/30/20, l'épargne de sécurité et la gestion des flux sans jamais dépendre d'emprunts.
            </p>
          </div>

          <div 
            onClick={() => { setTopic("Comment lancer un Side Hustle et acquérir des compétences à haut revenu"); analyzeTopic("Comment lancer un Side Hustle et acquérir des compétences à haut revenu"); }}
            className="rounded-3xl bg-black/40 border border-white/10 p-8 backdrop-blur-xl hover:bg-white/5 hover:border-emerald-500/30 transition-all group shadow-[inset_0_0_40px_rgba(255,255,255,0.02)] cursor-pointer"
          >
            <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-400 w-fit mb-6 border border-emerald-500/20 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-medium tracking-wide mb-3 text-white/90">2. Gagner de l'argent</h3>
            <p className="text-white/50 text-sm leading-relaxed font-light">
              Apprends à créer des sources de revenus complémentaires, développer des high-income skills et valoriser ton temps.
            </p>
          </div>

          <div 
            onClick={() => { setTopic("Les erreurs financières fatales à ne jamais commettre"); analyzeTopic("Les erreurs financières fatales à ne jamais commettre"); }}
            className="rounded-3xl bg-black/40 border border-white/10 p-8 backdrop-blur-xl hover:bg-white/5 hover:border-amber-500/30 transition-all group shadow-[inset_0_0_40px_rgba(255,255,255,0.02)] cursor-pointer"
          >
            <div className="p-4 rounded-2xl bg-amber-500/10 text-amber-400 w-fit mb-6 border border-amber-500/20 group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-medium tracking-wide mb-3 text-white/90">3. Erreurs à fuir</h3>
            <p className="text-white/50 text-sm leading-relaxed font-light">
              Dettes toxiques, crédits à la consommation, achats compulsifs et pièges de la gratification immédiate.
            </p>
          </div>
        </div>

        {/* 50/30/20 Smart Simulator (100% Gratuit) */}
        <div className="lg:col-span-3 rounded-3xl bg-black/40 border border-white/10 p-8 md:p-10 backdrop-blur-xl shadow-[inset_0_0_40px_rgba(255,255,255,0.02)]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Calculator className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-light tracking-wide text-white/90">Simulateur Éducatif 50/30/20</h3>
                <p className="text-xs font-mono text-blue-400/80 uppercase tracking-widest mt-1">Outil d'apprentissage interactif gratuit</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2.5 rounded-2xl">
              <span className="text-xs font-mono text-white/40 uppercase">Revenu Net :</span>
              <input
                type="number"
                min="1"
                step="10"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(Math.max(1, Number(e.target.value) || 0))}
                className="w-32 bg-transparent text-white font-mono text-lg font-medium focus:outline-none text-right"
              />
              <span className="text-sm font-mono text-white/60">{currencySym} / mois</span>
            </div>
          </div>

          {/* Visual Percentage Progress Bar */}
          <div className="w-full h-3 rounded-full bg-white/5 overflow-hidden flex mb-8">
            <div style={{ width: "50%" }} className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]" title="50% Besoins vitaux" />
            <div style={{ width: "30%" }} className="h-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.6)]" title="30% Plaisirs & Confort" />
            <div style={{ width: "20%" }} className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]" title="20% Épargne & Avenir" />
          </div>

          {/* Breakdown Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="p-6 rounded-2xl bg-blue-500/5 border border-blue-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-blue-400 uppercase tracking-wider">50% • Besoins Vitaux</span>
                <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">Priorité 1</span>
              </div>
              <div className="text-3xl font-light font-mono text-white mb-2">{needs} {currencySym}</div>
              <p className="text-xs text-white/40 font-light leading-relaxed">
                Loyer, alimentation saine, factures d'énergie, transports. Le socle absolu.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-purple-500/5 border border-purple-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-purple-400 uppercase tracking-wider">30% • Plaisirs & Confort</span>
                <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">Plafond</span>
              </div>
              <div className="text-3xl font-light font-mono text-white mb-2">{wants} {currencySym}</div>
              <p className="text-xs text-white/40 font-light leading-relaxed">
                Sorties, hobbies, abonnements, voyages. À ne jamais dépasser pour éviter l'endettement.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider">20% • Épargne & Liberté</span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">Sécurité</span>
              </div>
              <div className="text-3xl font-light font-mono text-white mb-2">{savings} {currencySym}</div>
              <p className="text-xs text-white/40 font-light leading-relaxed">
                Fonds d'urgence de sécurité (3 mois de dépenses soit <strong className="text-emerald-300 font-mono">{emergencyFundTarget} {currencySym}</strong> à sécuriser).
              </p>
            </div>
          </div>

          {/* Interactive Savings Goal Timeline */}
          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1 space-y-1">
              <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" />
                Simulateur d'Objectif & Fonds d'Urgence
              </span>
              <h4 className="text-base font-medium text-white">Combien de temps pour atteindre ton objectif ?</h4>
              <p className="text-xs text-white/50">
                Avec tes <strong className="text-emerald-300 font-mono">{savings} {currencySym}/mois</strong> d'épargne programmée :
              </p>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2 bg-black/50 border border-white/10 px-3 py-2 rounded-xl text-xs font-mono">
                <span className="text-white/40">Cible :</span>
                <input
                  type="number"
                  step="500"
                  min="500"
                  value={savingsGoalTarget}
                  onChange={(e) => setSavingsGoalTarget(Math.max(100, Number(e.target.value) || 0))}
                  className="w-24 bg-transparent text-white font-mono text-right focus:outline-none"
                />
                <span className="text-white/60">{currencySym}</span>
              </div>

              <div className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-center">
                <span className="text-2xl font-mono font-bold text-emerald-300">{monthsToReachGoal}</span>
                <span className="text-xs font-mono text-emerald-400 ml-1.5 uppercase">mois</span>
              </div>
            </div>
          </div>
        </div>

        {/* AI Mentor Section (Gratuit pour tous) */}
        <div className="lg:col-span-3 rounded-3xl bg-black/40 border border-white/10 p-8 md:p-10 backdrop-blur-xl relative overflow-hidden shadow-[inset_0_0_40px_rgba(255,255,255,0.02)]">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] -mr-48 -mt-48 opacity-50 pointer-events-none" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-light tracking-wide text-white/90">Mentor IA Financier</h2>
                <p className="text-xs font-mono text-emerald-400/80 uppercase tracking-widest mt-1">Intelligence Artificielle Dédiée (100% Gratuite)</p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Pose une question d'apprentissage financier (ex: Comment épargner ses premiers 1000€ ?)"
                  className="w-full bg-black/60 border border-white/10 rounded-2xl py-5 px-6 text-base text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/50 transition-colors shadow-inner font-light"
                  onKeyDown={(e) => e.key === "Enter" && analyzeTopic()}
                />
              </div>
              <button
                onClick={() => analyzeTopic()}
                disabled={!topic.trim() || isGenerating}
                className="px-8 py-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] font-medium tracking-wide flex items-center justify-center gap-3 disabled:opacity-50 md:w-auto w-full border border-white/10 group text-white"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>L'IA analyse...</span>
                  </>
                ) : (
                  <>
                    <span>Consulter le Mentor</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>

            {/* Popular Topics */}
            <div className="flex flex-wrap items-center gap-2 mb-8">
              <span className="text-xs font-mono text-white/40 uppercase tracking-widest mr-2">Sujets recommandés :</span>
              {[
                "Règle des 50/30/20", 
                "Créer un Side Hustle en 2026", 
                "Les dettes à fuir absolument", 
                "Fonds d'urgence de précaution",
                "Compétences à haut revenu"
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setTopic(suggestion);
                    analyzeTopic(suggestion);
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white/70 hover:text-white transition-colors font-light"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            {/* Advice Result */}
            <AnimatePresence>
              {advice && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pt-8 border-t border-white/10">
                    <div className="markdown-body text-white/90 bg-black/60 rounded-3xl p-8 md:p-10 border border-emerald-500/20 shadow-inner prose prose-invert max-w-none">
                      <ReactMarkdown>{advice}</ReactMarkdown>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* MODAL ÉCRAN COACH IA VIP (Non-intrusif & Explicatif) */}
      <AnimatePresence>
        {isVipModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl rounded-3xl bg-[#0d0c14] border border-amber-500/30 p-6 md:p-8 relative shadow-[0_0_60px_rgba(245,158,11,0.2)]"
            >
              <button
                onClick={() => setIsVipModalOpen(false)}
                className="absolute top-5 right-5 p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <Crown className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-light text-white">Coach IA VIP</h3>
                    <span className="text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                      Sur-Mesure
                    </span>
                  </div>
                  <p className="text-xs text-white/50">L'accélérateur ultime pour ton indépendance financière</p>
                </div>
              </div>

              {vipSubscribed ? (
                <div className="space-y-6 text-center py-6">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                    <Check className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-xl font-medium text-white">Accès Coach IA VIP Débloqué !</h4>
                    <p className="text-xs text-white/60 max-w-md mx-auto mt-2 leading-relaxed">
                      Tes prompts dans l'Académie et Life OS bénéficient désormais d'un raisonnement étendu pour concevoir des plans d'investissement et des stratégies de revenus optimisées.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setIsVipModalOpen(false);
                      setTopic("Établis mon plan financier complet sur 12 mois avec mes revenus actuels");
                      analyzeTopic("Établis mon plan financier complet sur 12 mois avec mes revenus actuels");
                    }}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-semibold text-xs transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                  >
                    Générer mon plan d'action personnalisé
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-xs text-white/70 space-y-1">
                    <p className="text-white font-medium">✨ Garantie Transparence OMNI :</p>
                    <p className="text-white/40">
                      Tous les outils de calcul, guides 50/30/20 et réponses de base restent 100% gratuits à vie. Ce service VIP s'adresse à ceux souhaitant une analyse chirurgicale de leur situation.
                    </p>
                  </div>

                  {/* Avantages VIP */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-mono uppercase text-white/50 tracking-wider">Ce que débloque le Coach VIP :</h4>
                    
                    <div className="space-y-2.5">
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-white">Audit Patrimonial Profond</p>
                          <p className="text-[11px] text-white/40">Analyse de tes flux de dépenses récurrentes et détection des fuites financières.</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-white">Roadmap de Side Hustle Personnalisée</p>
                          <p className="text-[11px] text-white/40">Génération d'un plan pas-à-pas selon tes compétences et ton temps disponible.</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-white">Réponses Prioritaires & Raisonnement Avancé</p>
                          <p className="text-[11px] text-white/40">Accès direct aux modèles les plus puissants de Gemini sans file d'attente.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tarif optionnel */}
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 to-purple-500/15 border border-amber-500/30">
                    <div>
                      <p className="text-xs font-mono uppercase text-amber-300">Abonnement VIP Mensuel</p>
                      <p className="text-[11px] text-white/50">Sans engagement • Résiliable à tout moment</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-mono font-bold text-white">9.99 €</span>
                      <span className="text-xs text-white/50"> / mois</span>
                    </div>
                  </div>

                  <button
                    onClick={handleUnlockVip}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-black font-semibold text-sm flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(245,158,11,0.3)] transition-all"
                  >
                    <Crown className="w-4 h-4 fill-black" />
                    <span>Débloquer mon Coach IA VIP maintenant</span>
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
