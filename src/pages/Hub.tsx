import { Fingerprint, Shield, Settings as SettingsIcon, Activity, ArrowRight, Hexagon, Sparkles, CheckCircle2, MapPin, Mail, HardDrive, Compass, Award, Trophy, Zap } from "lucide-react";
import { motion } from "motion/react";
import { Link, useNavigate } from "react-router-dom";
import { vibrate } from "../lib/utils";
import { useAuth } from "../context/AuthContext";

export function Hub() {
  const { user, signInWithGoogle, omniScore } = useAuth();
  const navigate = useNavigate();

  // Gamification Tier
  const getRankBadge = (score: number) => {
    if (score >= 60) return { title: "Grand Maître OMNI", color: "from-amber-400 to-yellow-500", text: "text-amber-300", border: "border-amber-400/40", icon: Trophy };
    if (score >= 35) return { title: "Architecte du Focus", color: "from-purple-400 to-pink-500", text: "text-purple-300", border: "border-purple-400/40", icon: Award };
    if (score >= 15) return { title: "Adepte Deep Work", color: "from-indigo-400 to-blue-500", text: "text-indigo-300", border: "border-indigo-400/40", icon: Zap };
    return { title: "Initié OMNI", color: "from-emerald-400 to-teal-500", text: "text-emerald-300", border: "border-emerald-400/40", icon: Sparkles };
  };

  const rank = getRankBadge(omniScore);
  const RankIcon = rank.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-6xl mx-auto space-y-8 pb-24 md:pb-0"
    >
      <header className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 text-indigo-400 mb-2">
            <Activity className="w-5 h-5" />
            <span className="font-mono text-sm tracking-widest uppercase">Command Center</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-light tracking-tight text-white/90">
            Bienvenue sur <span className="font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">OMNI</span>
          </h1>
          <p className="text-white/50 mt-2 text-lg font-light">Super-App pilotée par l'intelligence Gemini.</p>
        </div>
        <Link 
          to="/settings"
          onClick={() => vibrate(50)}
          className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all backdrop-blur-md group"
        >
          <SettingsIcon className="w-6 h-6 text-white/70 group-hover:rotate-90 transition-transform duration-500" />
        </Link>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* OMNI Score Card */}
        <motion.div 
          whileHover={{ scale: 1.01 }}
          className="col-span-1 lg:col-span-3 rounded-3xl bg-black/40 border border-white/10 p-8 backdrop-blur-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 group shadow-[inset_0_0_40px_rgba(255,255,255,0.02)]"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          <div className="flex items-center gap-6 relative z-10">
            <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-black border border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.05)] group-hover:border-indigo-500/30 transition-colors">
              <Hexagon className="w-10 h-10 text-indigo-400/70 group-hover:text-indigo-400 transition-colors" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <h2 className="text-2xl font-light tracking-wide text-white/90">OMNI Score</h2>
                <div className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/5 border ${rank.border} text-xs font-mono font-medium ${rank.text}`}>
                  <RankIcon className="w-3.5 h-3.5" />
                  <span>{rank.title}</span>
                </div>
              </div>
              <p className="text-white/50 text-sm font-light">Indicateur de productivité et d'apprentissage global.</p>
            </div>
          </div>
          <div className="text-center md:text-right relative z-10">
            <div className="text-5xl font-light tracking-tighter text-white font-mono">{omniScore} <span className="text-2xl text-white/40">/ 100</span></div>
            <p className="text-xs font-mono text-emerald-400 uppercase tracking-widest mt-2 flex items-center justify-end gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {omniScore > 0 ? "Progression en cours" : "Prêt à démarrer"}
            </p>
          </div>
        </motion.div>

        {/* Security & Identity Card */}
        <div className="col-span-1 lg:col-span-2 rounded-3xl bg-black/40 border border-white/10 p-8 backdrop-blur-xl relative overflow-hidden group shadow-[inset_0_0_40px_rgba(255,255,255,0.02)]">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32 transition-opacity group-hover:opacity-70 opacity-30 pointer-events-none" />
          
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex items-start justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-medium tracking-wide text-white/90">Identité & Sécurité Firebase</h2>
                  <p className="text-xs text-white/40 font-mono">Authentification sécurisée Google</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-[10px] font-mono tracking-widest uppercase border ${
                user 
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                  : "bg-amber-500/10 text-amber-400 border-amber-500/20"
              }`}>
                {user ? "Authentifié" : "Non Connecté"}
              </span>
            </div>

            <div>
              <p className="text-white/60 mb-6 max-w-md font-light leading-relaxed">
                {user 
                  ? `Connecté en tant que ${user.displayName || user.email}. Tes données, sessions de Focus et messages Gemini sont synchronisés dans Firestore.`
                  : "Connecte-toi avec Google pour sauvegarder tes sessions de travail, tes messages Gemini et tes interactions communautaires sur le Cloud."
                }
              </p>
              {user ? (
                <div className="flex items-center gap-3 text-sm text-emerald-400 font-mono">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Cloud Firestore synchronisé</span>
                </div>
              ) : (
                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  onClick={() => signInWithGoogle()}
                  className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-indigo-600/80 to-purple-600/80 hover:from-indigo-500 hover:to-purple-500 transition-all shadow-[0_0_20px_rgba(99,102,241,0.2)] font-medium tracking-wide w-full sm:w-auto border border-white/10 text-white"
                >
                  <Fingerprint className="w-5 h-5" />
                  <span>Connexion Google Firebase</span>
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              )}
            </div>
          </div>
        </div>

        {/* Quick Launchpad Action Cards */}
        <div className="col-span-1 lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div 
            onClick={() => {
              vibrate(30);
              navigate("/focus", { state: { duration: 25 * 60, autoStart: true } });
            }}
            className="rounded-3xl bg-black/40 border border-white/10 p-6 backdrop-blur-xl hover:border-blue-500/40 hover:bg-white/[0.03] transition-all cursor-pointer group shadow-[inset_0_0_30px_rgba(255,255,255,0.01)]"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono text-blue-400 uppercase tracking-widest">Sprint Express</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300">25 min</span>
            </div>
            <h3 className="text-lg font-medium text-white/90 group-hover:text-white mb-1">Démarrer Focus</h3>
            <p className="text-xs text-white/40 font-light">Lancer un bloc Pomodoro avec ambiance sonore et +5 pts.</p>
          </div>

          <div 
            onClick={() => {
              vibrate(30);
              navigate("/wallet");
            }}
            className="rounded-3xl bg-black/40 border border-white/10 p-6 backdrop-blur-xl hover:border-teal-500/40 hover:bg-white/[0.03] transition-all cursor-pointer group shadow-[inset_0_0_30px_rgba(255,255,255,0.01)]"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono text-teal-400 uppercase tracking-widest">Simulateur 50/30/20</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300">Academy</span>
            </div>
            <h3 className="text-lg font-medium text-white/90 group-hover:text-white mb-1">Calculer son Budget</h3>
            <p className="text-xs text-white/40 font-light">Calculer sa répartition idéale sans crédit ni piège financier.</p>
          </div>

          <div 
            onClick={() => {
              vibrate(30);
              navigate("/life-os");
            }}
            className="rounded-3xl bg-black/40 border border-white/10 p-6 backdrop-blur-xl hover:border-indigo-500/40 hover:bg-white/[0.03] transition-all cursor-pointer group shadow-[inset_0_0_30px_rgba(255,255,255,0.01)]"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest">Life OS</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">Gemini 3.8</span>
            </div>
            <h3 className="text-lg font-medium text-white/90 group-hover:text-white mb-1">Piloter par Commande</h3>
            <p className="text-xs text-white/40 font-light">Demander à l'IA d'organiser tes tâches et contrôler l'app.</p>
          </div>
        </div>

        {/* Global Integrations Launchpad: Maps, Gmail, Drive */}
        <div className="col-span-1 lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div 
            onClick={() => {
              vibrate(25);
              navigate("/maps");
            }}
            className="rounded-3xl bg-black/40 border border-white/10 p-6 backdrop-blur-xl hover:border-indigo-500/40 hover:bg-white/[0.03] transition-all cursor-pointer group shadow-[inset_0_0_30px_rgba(255,255,255,0.01)]"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest">Google Maps</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">Live</span>
            </div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition-transform">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-medium text-white/90 group-hover:text-white">Cartographie & Hubs</h3>
            </div>
            <p className="text-xs text-white/40 font-light">Localisation en temps réel, spots coworking et cafés productifs.</p>
          </div>

          <div 
            onClick={() => {
              vibrate(25);
              navigate("/gmail");
            }}
            className="rounded-3xl bg-black/40 border border-white/10 p-6 backdrop-blur-xl hover:border-rose-500/40 hover:bg-white/[0.03] transition-all cursor-pointer group shadow-[inset_0_0_30px_rgba(255,255,255,0.01)]"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono text-rose-400 uppercase tracking-widest">Gmail Workspace</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300">OAuth</span>
            </div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 group-hover:scale-110 transition-transform">
                <Mail className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-medium text-white/90 group-hover:text-white">Messagerie Gmail</h3>
            </div>
            <p className="text-xs text-white/40 font-light">Lecture directe de la boîte de réception et composition rapide.</p>
          </div>

          <div 
            onClick={() => {
              vibrate(25);
              navigate("/drive");
            }}
            className="rounded-3xl bg-black/40 border border-white/10 p-6 backdrop-blur-xl hover:border-amber-500/40 hover:bg-white/[0.03] transition-all cursor-pointer group shadow-[inset_0_0_30px_rgba(255,255,255,0.01)]"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono text-amber-400 uppercase tracking-widest">Google Drive</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">Cloud</span>
            </div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
                <HardDrive className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-medium text-white/90 group-hover:text-white">Stockage Drive</h3>
            </div>
            <p className="text-xs text-white/40 font-light">Exploration de documents et création instantanée de notes sécurisées.</p>
          </div>
        </div>

        {/* System Status Card */}
        <div className="col-span-1 rounded-3xl bg-black/40 border border-white/10 p-8 backdrop-blur-xl flex flex-col justify-between shadow-[inset_0_0_40px_rgba(255,255,255,0.02)]">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-medium tracking-wide text-white/90">État du Système</h2>
          </div>

          <div className="space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-white/50 uppercase tracking-wider">Life OS (Gemini)</span>
              <div className="flex items-center gap-2">
                <span className="text-indigo-400">Actif</span>
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/50 uppercase tracking-wider">Focus Engine</span>
              <div className="flex items-center gap-2">
                <span className="text-blue-400">Prêt</span>
                <div className="w-2 h-2 rounded-full bg-blue-400" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/50 uppercase tracking-wider">Academy IA</span>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400">En ligne</span>
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/50 uppercase tracking-wider">Communauté Sync</span>
              <div className="flex items-center gap-2">
                <span className="text-orange-400">Connecté</span>
                <div className="w-2 h-2 rounded-full bg-orange-400" />
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/5">
            <Link 
              to="/life-os"
              className="text-xs font-mono text-indigo-400 hover:text-indigo-300 text-center uppercase tracking-widest block transition-colors"
            >
              → Ouvrir Life OS (Gemini)
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
