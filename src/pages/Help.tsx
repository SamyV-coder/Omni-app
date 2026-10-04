import { motion } from "motion/react";
import { HelpCircle, MessageSquare, Book, ShieldAlert, Zap, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export function Help() {
  const faqs = [
    {
      q: "Comment fonctionne l'intelligence GEMINI ?",
      a: "GEMINI est le contrôleur central de la Super-App OMNI. Il a le contrôle de tous les modules : lancer des sessions Focus, te former sur la gestion de ton argent dans l'Academy, créer des discussions dans la communauté ou générer des visuels avec /image."
    },
    {
      q: "Comment fonctionne l'Academy Financière ?",
      a: "L'Academy est un centre d'apprentissage 100% éducatif, sans aucune liaison bancaire ni CB. Tu y apprends les règles de gestion d'argent (50/30/20), comment générer des revenus (high-income skills, side hustles) et les erreurs fatales à ne jamais faire avec son argent grâce au Mentor IA."
    },
    {
      q: "Mes données sont-elles sauvegardées avec Firebase ?",
      a: "Oui. Grâce à la synchronisation Firebase Auth et Firestore, tes sessions, tes messages avec Gemini et tes interactions dans la communauté sont sauvegardés de manière sécurisée sur ton compte."
    },
    {
      q: "Comment augmenter son OMNI Score ?",
      a: "L'OMNI Score augmente lorsque tu réalises des sessions de Focus, que tu consultes le mentor financier dans l'Academy, et que tu participes activement à la communauté."
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto space-y-10 pb-24 md:pb-0"
    >
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-3 text-indigo-400 mb-2">
          <HelpCircle className="w-5 h-5" />
          <span className="font-mono text-sm tracking-widest uppercase">Support Center</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-light tracking-tight text-white/90">
          Comment pouvons-nous t'aider ?
        </h1>
        <p className="text-white/50 text-lg max-w-2xl mt-2 font-light">
          Trouve des réponses à tes questions ou pilote OMNI avec Gemini.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link to="/life-os" className="group p-8 rounded-3xl bg-black/40 border border-white/10 hover:border-indigo-500/30 transition-all backdrop-blur-xl shadow-[inset_0_0_40px_rgba(255,255,255,0.02)] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <div className="relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-6 border border-indigo-500/20 group-hover:scale-110 transition-transform">
              <Sparkles className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-medium mb-3 text-white/90">Demander à LIFE OS</h3>
            <p className="text-white/50 text-sm mb-6 font-light leading-relaxed">
              Le cœur d'intelligence artificielle Life OS (propulsé par Gemini) peut contrôler tous les onglets et répondre à tes questions.
            </p>
            <div className="flex items-center gap-2 text-indigo-400 text-sm font-medium">
              <span className="font-mono uppercase tracking-widest text-xs">Ouvrir LIFE OS</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>

        <Link to="/wallet" className="group p-8 rounded-3xl bg-black/40 border border-white/10 hover:border-emerald-500/30 transition-all backdrop-blur-xl shadow-[inset_0_0_40px_rgba(255,255,255,0.02)] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <div className="relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-6 border border-emerald-500/20 group-hover:scale-110 transition-transform">
              <Book className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-medium mb-3 text-white/90">Academy Financière</h3>
            <p className="text-white/50 text-sm mb-6 font-light leading-relaxed">
              Consulte le Mentor IA pour maîtriser la gestion de ton argent et éviter les erreurs fatales.
            </p>
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
              <span className="font-mono uppercase tracking-widest text-xs">Ouvrir l'Academy</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>
      </div>

      <div className="space-y-8">
        <h2 className="text-2xl font-light tracking-wide flex items-center gap-3 text-white/90">
          <Zap className="w-6 h-6 text-amber-400" />
          Questions Fréquentes
        </h2>
        
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="p-6 rounded-2xl bg-black/40 border border-white/5 hover:border-white/10 transition-colors backdrop-blur-xl shadow-[inset_0_0_20px_rgba(255,255,255,0.01)]">
              <h4 className="text-lg font-medium text-white/90 mb-3">{faq.q}</h4>
              <p className="text-white/50 leading-relaxed text-sm font-light">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="p-8 rounded-3xl bg-black/40 border border-indigo-500/20 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-[inset_0_0_40px_rgba(99,102,241,0.05)]">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 pointer-events-none" />
        <div className="flex items-center gap-6 relative z-10">
          <div className="p-4 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-medium text-white/90">Besoin d'une assistance directe ?</h3>
            <p className="text-white/50 text-sm mt-1 font-light">Notre équipe et l'IA Gemini sont à ton service.</p>
          </div>
        </div>
        <Link 
          to="/life-os"
          className="relative z-10 px-8 py-4 rounded-2xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 font-medium transition-colors whitespace-nowrap border border-indigo-500/30 font-mono text-xs tracking-widest uppercase"
        >
          Parler à Life OS
        </Link>
      </div>
    </motion.div>
  );
}
