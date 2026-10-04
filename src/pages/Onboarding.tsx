import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Hexagon, Shield, BrainCircuit, ArrowRight, Zap } from "lucide-react";
import { vibrate } from "../lib/utils";

const STEPS = [
  {
    icon: Hexagon,
    title: "Bienvenue dans OMNI",
    description: "L'écosystème absolu. Productivité, finances, social et services centralisés dans une interface unique et épurée."
  },
  {
    icon: BrainCircuit,
    title: "Life OS Intégré",
    description: "Ton assistant IA personnel analyse, filtre et t'aide à prendre les meilleures décisions au quotidien, en temps réel."
  },
  {
    icon: Shield,
    title: "Sécurité Militaire",
    description: "Chiffrement de bout en bout. Tes données t'appartiennent. L'IA te protège et modère ton environnement."
  }
];

export function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
      vibrate([50, 100, 50]); // Haptic feedback for splash end
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  const handleNext = () => {
    vibrate(50);
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      vibrate([30, 50, 30]);
      onComplete();
    }
  };

  if (showSplash) {
    return (
      <motion.div 
        className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50"
        exit={{ opacity: 0, scale: 1.1 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="relative flex items-center justify-center w-32 h-32 rounded-3xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-white/10 shadow-[0_0_50px_rgba(59,130,246,0.3)]"
        >
          <div className="absolute inset-0 bg-black rounded-[30px] m-[2px] flex items-center justify-center overflow-hidden">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="absolute w-[200%] h-[200%] bg-[conic-gradient(from_0deg,transparent_0_340deg,rgba(59,130,246,0.5)_360deg)]"
            />
            <div className="absolute inset-1 bg-black rounded-[26px] flex items-center justify-center">
              <Hexagon className="w-12 h-12 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]" />
            </div>
          </div>
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="mt-8 text-3xl font-light tracking-[0.3em] text-white"
        >
          OMNI
        </motion.h1>
      </motion.div>
    );
  }

  const CurrentIcon = STEPS[step].icon;

  return (
    <div className="fixed inset-0 bg-black flex flex-col z-40">
      {/* Background Glows */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.15),transparent_50%)] pointer-events-none transition-colors duration-1000" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(147,51,234,0.15),transparent_50%)] pointer-events-none transition-colors duration-1000" />

      <div className="flex-1 flex flex-col items-center justify-center p-8 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center text-center max-w-md"
          >
            <div className="w-24 h-24 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
              <CurrentIcon className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-medium tracking-tight mb-4">{STEPS[step].title}</h2>
            <p className="text-white/50 text-lg leading-relaxed">{STEPS[step].description}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="p-8 pb-12 relative z-10 flex flex-col items-center gap-8">
        {/* Progress Indicators */}
        <div className="flex items-center gap-3">
          {STEPS.map((_, i) => (
            <div 
              key={i} 
              className={`h-1.5 rounded-full transition-all duration-500 ${i === step ? 'w-8 bg-white' : 'w-2 bg-white/20'}`} 
            />
          ))}
        </div>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleNext}
          className="w-full max-w-md py-4 rounded-2xl bg-white text-black font-medium tracking-wide flex items-center justify-center gap-3 hover:bg-white/90 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)]"
        >
          {step === STEPS.length - 1 ? (
            <>
              <Zap className="w-5 h-5" />
              <span>Initialiser OMNI</span>
            </>
          ) : (
            <>
              <span>Continuer</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}
