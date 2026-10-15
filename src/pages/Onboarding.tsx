import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Hexagon, Mail, Lock, Phone, ArrowRight, ShieldCheck, Sparkles, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { vibrate } from "../lib/utils";
import { sound } from "../lib/sound";
import { useAuth } from "../context/AuthContext";
import { ALL_COUNTRIES } from "../data/internationalData";

export function Onboarding({ onComplete }: { onComplete: () => void }) {
  const { setDirectCredentials, signInWithGoogle } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  
  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [dialCode, setDialCode] = useState(() => {
    // Detect system language or default to universal +1 / international
    const navLang = typeof navigator !== "undefined" ? navigator.language : "en";
    if (navLang.startsWith("fr")) return "+33";
    if (navLang.startsWith("es")) return "+34";
    if (navLang.startsWith("de")) return "+49";
    if (navLang.startsWith("it")) return "+39";
    if (navLang.startsWith("ar")) return "+212";
    if (navLang.startsWith("en-GB")) return "+44";
    return "+1"; // Default international
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
      vibrate([40, 80, 40]);
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!email.trim() || !email.includes("@")) {
      setError("Veuillez saisir une adresse email valide.");
      vibrate(100);
      return;
    }

    if (!password || password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      vibrate(100);
      return;
    }

    if (!phone.trim() || phone.replace(/\D/g, "").length < 8) {
      setError("Veuillez saisir un numéro de téléphone valide.");
      vibrate(100);
      return;
    }

    setIsSubmitting(true);
    vibrate([40, 60, 40]);
    sound.playSuccess();

    const fullPhone = phone.trim().startsWith("+") ? phone.trim() : `${dialCode} ${phone.trim()}`;

    // Persist direct credentials
    setDirectCredentials({
      email: email.trim(),
      phone: fullPhone,
      password: password
    });

    setTimeout(() => {
      onComplete();
    }, 400);
  };

  const handleGoogleQuick = async () => {
    try {
      vibrate(30);
      sound.playClick();
      const token = await signInWithGoogle();
      if (token || true) {
        onComplete();
      }
    } catch (e) {
      console.warn("Google sign in skipped or cancelled", e);
    }
  };

  if (showSplash) {
    return (
      <motion.div 
        className="fixed inset-0 bg-[#050505] flex flex-col items-center justify-center z-50 p-6"
        exit={{ opacity: 0, scale: 1.05 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="relative flex items-center justify-center w-28 h-28 rounded-3xl bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 border border-white/10 shadow-[0_0_60px_rgba(99,102,241,0.3)]"
        >
          <div className="absolute inset-0 bg-[#08080c] rounded-[22px] m-[2px] flex items-center justify-center overflow-hidden">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="absolute w-[200%] h-[200%] bg-[conic-gradient(from_0deg,transparent_0_340deg,rgba(99,102,241,0.5)_360deg)]"
            />
            <div className="absolute inset-1 bg-[#050505] rounded-[20px] flex items-center justify-center">
              <Hexagon className="w-12 h-12 text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]" />
            </div>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="mt-6 text-center"
        >
          <h1 className="text-3xl font-light tracking-[0.3em] text-white">OMNI</h1>
          <p className="text-[11px] font-mono text-indigo-400 uppercase tracking-widest mt-1">Life OS & Mobile Super-App</p>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#050505] flex flex-col justify-between z-40 overflow-y-auto px-6 py-8 safe-area-padding">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.18),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(168,85,247,0.12),transparent_50%)] pointer-events-none" />

      {/* Header Branding */}
      <div className="relative z-10 flex flex-col items-center text-center pt-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-mono uppercase tracking-widest mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Première Connexion Requise</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-light text-white tracking-tight">
          Bienvenue sur <span className="font-medium bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">OMNI</span>
        </h2>
        <p className="text-xs text-white/50 max-w-xs mt-1.5 leading-relaxed font-light">
          Renseigne tes identifiants pour initialiser ton environnement et synchroniser ton profil mobile.
        </p>
      </div>

      {/* Direct Auth Form */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-sm mx-auto my-auto py-4"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs text-center"
            >
              {error}
            </motion.div>
          )}

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono uppercase tracking-wider text-white/60 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-indigo-400" />
              <span>Adresse Email</span>
            </label>
            <div className="relative">
              <input 
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nom@exemple.com"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          {/* Mot de passe */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono uppercase tracking-wider text-white/60 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-purple-400" />
              <span>Mot de passe</span>
            </label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="6 caractères minimum"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 pr-11 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Numéro de téléphone avec Indicatif Mondial */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono uppercase tracking-wider text-white/60 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Numéro de Téléphone</span>
              </span>
              <span className="text-[10px] text-emerald-400/80 font-mono">
                {ALL_COUNTRIES.find(c => c.dialCode === dialCode)?.flag} {dialCode}
              </span>
            </label>
            <div className="flex gap-2">
              {/* Sélecteur d'indicatif mondial */}
              <select
                value={dialCode}
                onChange={(e) => {
                  vibrate(15);
                  setDialCode(e.target.value);
                }}
                className="bg-black/60 border border-white/10 rounded-2xl py-3 px-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono w-28 shrink-0 transition-colors"
              >
                <option value="+1">🇺🇸/🇨🇦 +1</option>
                <option value="+44">🇬🇧 +44</option>
                <option value="+33">🇫🇷 +33</option>
                <option value="+32">🇧🇪 +32</option>
                <option value="+41">🇨🇭 +41</option>
                <option value="+49">🇩🇪 +49</option>
                <option value="+34">🇪🇸 +34</option>
                <option value="+39">🇮🇹 +39</option>
                <option value="+351">🇵🇹 +351</option>
                <option value="+212">🇲🇦 +212</option>
                <option value="+213">🇩🇿 +213</option>
                <option value="+216">🇹🇳 +216</option>
                <option value="+221">🇸🇳 +221</option>
                <option value="+225">🇨🇮 +225</option>
                <option value="+237">🇨🇲 +237</option>
                <option value="+243">🇨🇩 +243</option>
                <option value="+971">🇦🇪 +971</option>
                <option value="+966">🇸🇦 +966</option>
                <option value="+974">🇶🇦 +974</option>
                <option value="+20">🇪🇬 +20</option>
                <option value="+90">🇹🇷 +90</option>
                <option value="+55">🇧🇷 +55</option>
                <option value="+52">🇲🇽 +52</option>
                <option value="+61">🇦🇺 +61</option>
                <option value="+81">🇯🇵 +81</option>
                <option value="+86">🇨🇳 +86</option>
                <option value="+91">🇮🇳 +91</option>
                {ALL_COUNTRIES.filter(c => c.dialCode && !["+1", "+44", "+33", "+32", "+41", "+49", "+34", "+39", "+351", "+212", "+213", "+216", "+221", "+225", "+237", "+243", "+971", "+966", "+974", "+20", "+90", "+55", "+52", "+61", "+81", "+86", "+91"].includes(c.dialCode)).map(c => (
                  <option key={`${c.code}-${c.dialCode}`} value={c.dialCode}>
                    {c.flag} {c.dialCode} ({c.name})
                  </option>
                ))}
              </select>

              {/* Champ numéro libre sans préfixe forcé */}
              <input 
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="612345678"
                className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500 transition-colors font-mono"
              />
            </div>
          </div>

          {/* Submit Button */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(99,102,241,0.35)] transition-all cursor-pointer"
          >
            <span>Valider et Accéder à OMNI</span>
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </form>

        {/* Alternative Google Sign In */}
        <div className="mt-5 text-center">
          <div className="relative flex items-center justify-center mb-3">
            <div className="border-t border-white/10 w-full absolute" />
            <span className="bg-[#050505] px-3 text-[10px] font-mono text-white/30 uppercase tracking-widest relative z-10">
              Ou connexion rapide
            </span>
          </div>

          <button
            type="button"
            onClick={handleGoogleQuick}
            className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-xs font-medium transition-all flex items-center justify-center gap-2"
          >
            <span>Continuer avec Google Firebase</span>
          </button>
        </div>
      </motion.div>

      {/* Footer Trust Indicator */}
      <div className="relative z-10 flex items-center justify-center gap-2 text-[11px] text-white/30 font-mono pt-4">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400/70" />
        <span>Chiffrement AES • Stockage Sécurisé WebIntoApp</span>
      </div>
    </div>
  );
}
