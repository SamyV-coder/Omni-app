import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Target, 
  Wallet, 
  Users, 
  Briefcase, 
  Sparkles, 
  HelpCircle, 
  LogIn, 
  LogOut, 
  X, 
  Send, 
  Zap, 
  Loader2,
  Search,
  Command,
  MapPin,
  Mail,
  HardDrive,
  Settings as SettingsIcon,
  Heart,
  Coffee
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn, vibrate } from "../lib/utils";
import { sound } from "../lib/sound";
import { useAuth } from "../context/AuthContext";
import { usePreferences } from "../context/PreferencesContext";
import { CommandPalette } from "./CommandPalette";
import { MobileSpeedDial } from "./MobileSpeedDial";
import { NotificationManagerOverlay } from "./NotificationBanner";

const navItems = [
  { path: "/", label: "HUB", icon: LayoutDashboard },
  { path: "/focus", label: "FOCUS", icon: Target },
  { path: "/wallet", label: "ACADEMY", icon: Wallet },
  { path: "/maps", label: "MAPS", icon: MapPin },
  { path: "/gmail", label: "GMAIL", icon: Mail },
  { path: "/drive", label: "DRIVE", icon: HardDrive },
  { path: "/community", label: "COMMUNITY", icon: Users },
  { path: "/service", label: "SERVICE", icon: Briefcase },
  { path: "/life-os", label: "LIFE OS", icon: Sparkles },
  { path: "/settings", label: "SETTINGS", icon: SettingsIcon },
  { path: "/help", label: "HELP", icon: HelpCircle },
];

export function Layout() {
  const { user, signInWithGoogle, signOut, omniScore } = useAuth();
  const { language, currency, nationality } = usePreferences();
  const navigate = useNavigate();
  const location = useLocation();
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isQuickGeminiOpen, setIsQuickGeminiOpen] = useState(false);
  const [quickInput, setQuickInput] = useState("");
  const [quickLoading, setQuickLoading] = useState(false);
  const [quickReply, setQuickReply] = useState<string | null>(null);

  // Global Keyboard Shortcuts (Cmd+K / Ctrl+K to open Command Palette)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        sound.playClick();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleQuickGemini = async () => {
    if (!quickInput.trim() || quickLoading) return;
    setQuickLoading(true);
    setQuickReply(null);
    vibrate(30);

    try {
      const res = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: quickInput }],
          currentTab: location.pathname,
          language,
          currency,
          nationality,
        }),
      });
      const data = await res.json();
      setQuickReply(data.reply || "Commande exécutée.");
      setQuickInput("");
    } catch (e) {
      setQuickReply("Erreur lors de la communication avec Gemini.");
    } finally {
      setQuickLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#050505] text-white overflow-hidden font-sans selection:bg-indigo-500/30">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-72 border-r border-white/5 bg-black/40 backdrop-blur-2xl p-6 relative z-20">
        <div className="absolute inset-y-0 right-0 w-[1px] bg-gradient-to-b from-transparent via-white/10 to-transparent" />
        
        {/* Logo OMNI */}
        <div 
          onClick={() => navigate("/")}
          className="flex items-center gap-4 mb-8 mt-2 px-2 cursor-pointer group"
        >
          <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 shadow-[0_0_20px_rgba(99,102,241,0.4)]">
            <div className="absolute inset-[2px] bg-black rounded-[14px] flex items-center justify-center transition-transform group-hover:scale-[0.98]">
              <div className="w-4 h-4 rounded-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.9)] animate-pulse" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 font-display">
              OMNI
            </h1>
            <p className="text-[10px] font-mono text-white/40 tracking-[0.2em] uppercase mt-0.5">Gemini Super-App</p>
          </div>
        </div>

        {/* User Card / Firebase Google Auth */}
        <div className="mb-4 p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md">
          {user ? (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <img 
                  src={user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`} 
                  alt="Avatar" 
                  className="w-9 h-9 rounded-xl border border-indigo-500/30 object-cover bg-black"
                />
                <div className="overflow-hidden">
                  <p className="text-xs font-medium text-white truncate">{user.displayName || "Agent OMNI"}</p>
                  <p className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Score : {omniScore} pts
                  </p>
                </div>
              </div>
              <button 
                onClick={() => signOut()}
                title="Déconnexion"
                className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-white/5 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => signInWithGoogle()}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-indigo-600/30 to-purple-600/30 hover:from-indigo-600/50 hover:to-purple-600/50 border border-indigo-500/30 text-white text-xs font-medium flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(99,102,241,0.2)]"
            >
              <LogIn className="w-3.5 h-3.5 text-indigo-400" />
              <span>Connexion Google</span>
            </button>
          )}
        </div>

        {/* Quick Command Launcher button (Cmd+K) */}
        <button
          onClick={() => {
            sound.playClick();
            setIsCommandPaletteOpen(true);
          }}
          className="mb-4 w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white/60 hover:text-white transition-all text-xs font-light group"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
            <span>Recherche / Commandes</span>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-white/50 border border-white/5">
            ⌘K
          </span>
        </button>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto hide-scrollbar">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => sound.playClick()}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative overflow-hidden",
                  isActive
                    ? "text-white bg-white/5 border border-white/10 shadow-[inset_0_0_20px_rgba(255,255,255,0.02)]"
                    : "text-white/40 hover:text-white hover:bg-white/[0.02]"
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-indigo-400 via-purple-500 to-pink-500 rounded-r-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                  )}
                  <item.icon className={cn(
                    "w-5 h-5 transition-all duration-500",
                    isActive 
                      ? "text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)] scale-110" 
                      : "group-hover:scale-110 group-hover:text-white/70"
                  )} />
                  <span className={cn(
                    "font-medium text-sm tracking-widest uppercase font-mono transition-colors",
                    isActive ? "text-white" : "text-white/50 group-hover:text-white/80"
                  )}>{item.label}</span>

                  {item.label === "LIFE OS" && (
                    <span className="ml-auto text-[9px] font-mono uppercase bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">
                      Gemini
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bouton Soutenir OMNI dans la sidebar */}
        <div className="pt-3 px-2">
          <button
            onClick={() => {
              vibrate(20);
              sound.playClick();
              navigate("/settings");
            }}
            className="w-full p-3 rounded-2xl bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-purple-500/10 hover:from-rose-500/20 hover:to-purple-500/20 border border-rose-500/30 text-rose-200 text-xs font-medium flex items-center justify-between transition-all group shadow-[0_0_15px_rgba(244,63,94,0.1)]"
          >
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 group-hover:scale-110 transition-transform">
                <Coffee className="w-3.5 h-3.5" />
              </span>
              <span>Soutenir OMNI ☕</span>
            </div>
            <Heart className="w-3.5 h-3.5 text-rose-400 group-hover:fill-rose-400 transition-colors" />
          </button>
        </div>

        {/* Bottom Status */}
        <div className="mt-auto pt-6 border-t border-white/5 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" />
            <span className="text-[11px] font-mono text-white/40 uppercase tracking-widest">OMNI Engine</span>
          </div>
          <span className="text-[11px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
            Score: {omniScore}
          </span>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden flex flex-col bg-[#050505]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.08),transparent_50%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.08),transparent_50%)] pointer-events-none" />
        
        {/* Floating Quick Gemini Button (visible when not on /life-os) */}
        {location.pathname !== "/life-os" && (
          <div className="fixed bottom-24 md:bottom-8 right-6 z-40">
            <button
              onClick={() => setIsQuickGeminiOpen(true)}
              className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium shadow-[0_0_30px_rgba(99,102,241,0.4)] border border-white/20 transition-all hover:scale-105 active:scale-95 group"
            >
              <Sparkles className="w-5 h-5 text-indigo-200 group-hover:rotate-12 transition-transform" />
              <span className="text-xs font-mono tracking-widest uppercase">Commander Life OS</span>
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 md:p-10 relative z-10 custom-scrollbar">
          <Outlet />
        </div>
      </main>

      {/* Quick Gemini Overlay Drawer */}
      <AnimatePresence>
        {isQuickGeminiOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="w-full max-w-xl bg-[#0a0a0f] border border-indigo-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white">Life OS Quick Controller</h3>
                    <p className="text-[11px] font-mono text-white/40 uppercase">Propulsé par Gemini • Contrôle instantané</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsQuickGeminiOpen(false)}
                  className="p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 mb-4">
                <p className="text-xs text-white/60 font-light">
                  Exemples : "Ouvre le Focus et démarre 25 min", "Donne-moi 3 règles d'argent pour l'Academy", "Publie un message dans Community".
                </p>

                {quickReply && (
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-sm text-white/90 font-light leading-relaxed max-h-56 overflow-y-auto">
                    {quickReply}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={quickInput}
                  onChange={(e) => setQuickInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleQuickGemini()}
                  placeholder="Donne un ordre à Life OS..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500/50"
                  disabled={quickLoading}
                  autoFocus
                />
                <button
                  onClick={handleQuickGemini}
                  disabled={!quickInput.trim() || quickLoading}
                  className="p-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white disabled:opacity-40"
                >
                  {quickLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Nav for Mobile with Smooth Overflow */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-18 bg-black/95 backdrop-blur-2xl border-t border-white/10 flex items-center justify-start overflow-x-auto px-3 gap-2 z-50 scrollbar-none">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center min-w-[56px] h-14 rounded-2xl transition-all duration-300 relative shrink-0",
                isActive
                  ? "text-indigo-400 bg-white/[0.04]"
                  : "text-white/40 hover:text-white/80"
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-1 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-b-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                )}
                <item.icon className={cn(
                  "w-4 h-4 mb-1 transition-transform",
                  isActive ? "drop-shadow-[0_0_8px_rgba(99,102,241,0.5)] scale-110" : ""
                )} />
                <span className="text-[8px] font-mono tracking-wider uppercase">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Mobile Shortcuts Speed Dial (Quick Action Float Button) */}
      <MobileSpeedDial />

      {/* Global Notification & Alarm Manager Overlay */}
      <NotificationManagerOverlay />

      {/* Quick Command Palette (Cmd+K) */}
      <CommandPalette 
        isOpen={isCommandPaletteOpen} 
        onClose={() => setIsCommandPaletteOpen(false)} 
      />
    </div>
  );
}
