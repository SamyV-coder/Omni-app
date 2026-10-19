import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Hexagon, 
  Mail, 
  Lock, 
  Phone, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  Eye, 
  EyeOff, 
  Globe, 
  Check 
} from "lucide-react";
import { vibrate } from "../lib/utils";
import { sound } from "../lib/sound";
import { useAuth } from "../context/AuthContext";
import { usePreferences, LANGUAGES, LanguageCode } from "../context/PreferencesContext";
import { CountryCodePicker } from "../components/CountryCodePicker";
import { ALL_COUNTRIES } from "../data/internationalData";

export function Onboarding({ onComplete }: { onComplete: () => void }) {
  const { setDirectCredentials, signInWithGoogle, signUpWithEmail, signInWithEmail } = useAuth();
  const { t, language, setLanguage } = usePreferences();
  const [showSplash, setShowSplash] = useState(true);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  
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

  const getLocalizedError = (type: "email" | "password" | "phone") => {
    if (type === "email") {
      if (language === "fr") return "Veuillez saisir une adresse email valide.";
      if (language === "es") return "Por favor, introduce un correo electrónico válido.";
      if (language === "de") return "Bitte geben Sie eine gültige E-Mail-Adresse ein.";
      if (language === "ar") return "يرجى إدخال عنوان بريد إلكتروني صالح.";
      return "Please enter a valid email address.";
    }
    if (type === "password") {
      if (language === "fr") return "Le mot de passe doit contenir au moins 6 caractères.";
      if (language === "es") return "La contraseña debe tener al menos 6 caracteres.";
      if (language === "de") return "Das Passwort muss mindestens 6 Zeichen lang sein.";
      if (language === "ar") return "يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.";
      return "Password must be at least 6 characters long.";
    }
    if (type === "phone") {
      if (language === "fr") return "Veuillez saisir un numéro de téléphone valide.";
      if (language === "es") return "Por favor, introduce un número de teléfono válido.";
      if (language === "de") return "Bitte geben Sie eine gültige Telefonnummer ein.";
      if (language === "ar") return "يرجى إدخال رقم هاتف صالح.";
      return "Please enter a valid phone number.";
    }
    return "Error";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!email.trim() || !email.includes("@")) {
      setError(getLocalizedError("email"));
      vibrate(100);
      return;
    }

    if (!password || password.length < 6) {
      setError(getLocalizedError("password"));
      vibrate(100);
      return;
    }

    if (!phone.trim() || phone.replace(/\D/g, "").length < 6) {
      setError(getLocalizedError("phone"));
      vibrate(100);
      return;
    }

    setIsSubmitting(true);
    vibrate([40, 60, 40]);

    const fullPhone = phone.trim().startsWith("+") ? phone.trim() : `${dialCode} ${phone.trim()}`;

    // Always persist credentials locally
    setDirectCredentials({
      email: email.trim(),
      phone: fullPhone,
      password: password
    });

    // Sync with Firebase Authentication & Firestore
    try {
      try {
        await signUpWithEmail(email.trim(), password, fullPhone);
      } catch (signupErr: any) {
        if (signupErr?.code === "auth/email-already-in-use") {
          await signInWithEmail(email.trim(), password);
        } else {
          console.warn("Firebase Auth notice:", signupErr?.message);
        }
      }
    } catch (firebaseErr: any) {
      console.warn("Firebase connection notice (proceeding with local auth):", firebaseErr?.message);
    }

    sound.playSuccess();
    setTimeout(() => {
      onComplete();
    }, 400);
  };

  const handleGoogleQuick = async () => {
    try {
      vibrate(30);
      sound.playClick();
      await signInWithGoogle();
      onComplete();
    } catch (e) {
      console.warn("Google sign in skipped or cancelled", e);
    }
  };

  const currentLangObj = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

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
    <div className="fixed inset-0 bg-[#050505] flex flex-col justify-between z-40 overflow-y-auto px-6 py-6 safe-area-padding">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.18),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(168,85,247,0.12),transparent_50%)] pointer-events-none" />

      {/* Top Bar with Language Selector */}
      <div className="relative z-20 flex items-center justify-between w-full max-w-sm mx-auto pt-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-mono uppercase tracking-widest">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{language === "fr" ? "Inscription Rapide" : "Fast Signup"}</span>
        </div>

        {/* Language Switcher Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              vibrate(15);
              setShowLanguagePicker(!showLanguagePicker);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-mono text-white/90 transition-colors cursor-pointer shadow-sm"
          >
            <Globe className="w-3.5 h-3.5 text-indigo-400" />
            <span>{currentLangObj.flag} {currentLangObj.code.toUpperCase()}</span>
          </button>

          {/* Language Dropdown Menu */}
          <AnimatePresence>
            {showLanguagePicker && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowLanguagePicker(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-48 max-h-72 overflow-y-auto bg-[#0d0e17] border border-white/15 rounded-2xl p-1.5 shadow-2xl z-40 custom-scrollbar"
                >
                  <p className="text-[10px] font-mono text-white/40 uppercase tracking-wider px-3 py-1.5 border-b border-white/10">
                    {language === "fr" ? "Choisir la langue" : "Select language"}
                  </p>
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => {
                        vibrate(20);
                        sound.playClick();
                        setLanguage(l.code as LanguageCode);
                        setShowLanguagePicker(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors ${
                        language === l.code
                          ? "bg-indigo-600/20 text-indigo-300 font-medium border border-indigo-500/30"
                          : "text-white/70 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{l.flag}</span>
                        <span>{l.native}</span>
                      </span>
                      {language === l.code && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Header Branding */}
      <div className="relative z-10 flex flex-col items-center text-center pt-3">
        <h2 className="text-2xl sm:text-3xl font-light text-white tracking-tight">
          {t.onboarding.welcome}{" "}
          <span className="font-medium bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            OMNI
          </span>
        </h2>
        <p className="text-xs text-white/50 max-w-xs mt-1.5 leading-relaxed font-light">
          {language === "fr" 
            ? "Renseigne tes identifiants pour initialiser ton environnement et synchroniser ton profil mobile."
            : "Enter your credentials to initialize your environment and sync your global profile."}
        </p>
      </div>

      {/* Direct Auth Form */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-sm mx-auto my-auto py-3"
      >
        <form onSubmit={handleSubmit} className="space-y-3.5">
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
              <span>{t.onboarding.emailLabel}</span>
            </label>
            <div className="relative">
              <input 
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          {/* Mot de passe */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono uppercase tracking-wider text-white/60 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-purple-400" />
              <span>{t.onboarding.passwordLabel}</span>
            </label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.onboarding.passwordPlaceholder}
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

          {/* Numéro de téléphone avec Indicatif Mondial Searchable */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono uppercase tracking-wider text-white/60 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t.onboarding.phoneLabel}</span>
              </span>
              <span className="text-[10px] text-emerald-400/80 font-mono">
                {ALL_COUNTRIES.find(c => c.dialCode === dialCode)?.flag} {dialCode}
              </span>
            </label>

            <div className="flex gap-2 items-center">
              {/* Searchable Country Code Selector Dropdown */}
              <CountryCodePicker
                value={dialCode}
                onChange={(code) => setDialCode(code)}
                searchPlaceholder={t.onboarding.searchCountry}
              />

              {/* Champ numéro libre sans préfixe forcé */}
              <input 
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="123 456 789"
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
            <span>{t.onboarding.submitBtn}</span>
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </form>

        {/* Alternative Google Sign In */}
        <div className="mt-4 text-center">
          <div className="relative flex items-center justify-center mb-3">
            <div className="border-t border-white/10 w-full absolute" />
            <span className="bg-[#050505] px-3 text-[10px] font-mono text-white/30 uppercase tracking-widest relative z-10">
              {t.onboarding.orQuickGoogle}
            </span>
          </div>

          <button
            type="button"
            onClick={handleGoogleQuick}
            className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-xs font-medium transition-all flex items-center justify-center gap-2"
          >
            <span>{t.onboarding.quickGoogleBtn}</span>
          </button>
        </div>
      </motion.div>

      {/* Footer Trust Indicator */}
      <div className="relative z-10 flex items-center justify-center gap-2 text-[11px] text-white/30 font-mono pt-2">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400/70" />
        <span>{language === "fr" ? "Chiffrement AES • Stockage Sécurisé WebIntoApp" : "AES Encryption • WebIntoApp Secure Storage"}</span>
      </div>
    </div>
  );
}
