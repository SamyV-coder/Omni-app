import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search, 
  Target, 
  Wallet, 
  Users, 
  Briefcase, 
  Sparkles, 
  Settings as SettingsIcon, 
  HelpCircle, 
  Play, 
  ArrowRight,
  Zap,
  BookOpen,
  MapPin,
  Mail,
  HardDrive,
  Mic,
  Maximize2,
  Crown,
  Wifi,
  WifiOff
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { detectActionFromText, ActionPayload } from "../lib/lifeOsAssistant";
import { useOffline } from "../context/OfflineContext";
import { vibrate } from "../lib/utils";
import { sound } from "../lib/sound";

interface PaletteItem {
  id: string;
  title: string;
  subtitle: string;
  category: "Navigation" | "Action Focus" | "Academy" | "Gemini" | "Mode Hors-Ligne";
  icon: any;
  action: () => void;
  shortcut?: string;
  isAiAction?: boolean;
}

export function CommandPalette({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const { isOffline, toggleForceOffline } = useOffline();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const baseItems: PaletteItem[] = [
    {
      id: "focus-25",
      title: "Lancer un Sprint Focus (25 min)",
      subtitle: "Démarrer immédiatement une session Pomodoro",
      category: "Action Focus",
      icon: Play,
      action: () => {
        navigate("/focus", { state: { duration: 25 * 60, autoStart: true } });
        onClose();
      },
      shortcut: "↵"
    },
    {
      id: "focus-zen",
      title: "Mode Zen Plein Écran (Zéro Distraction)",
      subtitle: "Minuteur minimaliste immersif avec ambiances sonores",
      category: "Action Focus",
      icon: Maximize2,
      action: () => {
        navigate("/focus", { state: { zen: true } });
        onClose();
      },
      shortcut: "Z"
    },
    {
      id: "toggle-offline",
      title: isOffline ? "Repasser En Ligne" : "Activer le Mode Hors-Ligne Forcé",
      subtitle: isOffline ? "Rétablir la synchronisation réseau" : "Tester le fonctionnement 100% autonome sans internet",
      category: "Mode Hors-Ligne",
      icon: isOffline ? Wifi : WifiOff,
      action: () => {
        toggleForceOffline();
        onClose();
      },
      shortcut: "O"
    },
    {
      id: "settings-voice",
      title: "Commandes Vocales Personnalisées",
      subtitle: "Gérer ou ajouter des phrases d'activation vocale pour l'IA",
      category: "Gemini",
      icon: Mic,
      action: () => {
        navigate("/settings");
        onClose();
      },
      shortcut: "V"
    },
    {
      id: "focus-50",
      title: "Lancer Deep Work (50 min)",
      subtitle: "Session prolongée de concentration maximale",
      category: "Action Focus",
      icon: Target,
      action: () => {
        navigate("/focus", { state: { duration: 50 * 60, autoStart: true } });
        onClose();
      },
    },
    {
      id: "nav-upgrade",
      title: "Pass & Offres Upgrade (Premium)",
      subtitle: "Coach IA VIP, Boosts Marketplace et Pass All-Access",
      category: "Navigation",
      icon: Crown,
      action: () => {
        navigate("/upgrade");
        onClose();
      },
      shortcut: "U"
    },
    {
      id: "nav-lifeos",
      title: "Ouvrir Life OS (Assistant IA)",
      subtitle: "Discuter et commander le système OMNI",
      category: "Gemini",
      icon: Sparkles,
      action: () => {
        navigate("/life-os");
        onClose();
      },
    },
    {
      id: "academy-503020",
      title: "Academy : Règle des 50/30/20",
      subtitle: "Apprendre à répartir ses revenus sans stress",
      category: "Academy",
      icon: BookOpen,
      action: () => {
        navigate("/wallet", { state: { prefilledTopic: "Règle des 50/30/20 et fonds de sécurité" } });
        onClose();
      },
    },
    {
      id: "academy-sidehustle",
      title: "Academy : Compétences & Side Hustles",
      subtitle: "Générer des revenus complémentaires en 2026",
      category: "Academy",
      icon: Wallet,
      action: () => {
        navigate("/wallet", { state: { prefilledTopic: "Compétences à haut revenu et Side Hustles en 2026" } });
        onClose();
      },
    },
    {
      id: "nav-maps",
      title: "Cartographie OMNI (Google Maps)",
      subtitle: "Explorer les hubs de travail, cafés et naviguer",
      category: "Navigation",
      icon: MapPin,
      action: () => {
        navigate("/maps");
        onClose();
      },
      shortcut: "M"
    },
    {
      id: "nav-gmail",
      title: "Boîte Mail OMNI (Gmail)",
      subtitle: "Consulter la boîte de réception et envoyer des messages",
      category: "Navigation",
      icon: Mail,
      action: () => {
        navigate("/gmail");
        onClose();
      },
      shortcut: "G"
    },
    {
      id: "nav-drive",
      title: "Cloud Drive (Google Drive)",
      subtitle: "Accéder à vos documents et créer des fichiers",
      category: "Navigation",
      icon: HardDrive,
      action: () => {
        navigate("/drive");
        onClose();
      },
      shortcut: "D"
    },
    {
      id: "nav-hub",
      title: "Tableau de Bord (Hub)",
      subtitle: "Vue d'ensemble de ton système OMNI",
      category: "Navigation",
      icon: Zap,
      action: () => {
        navigate("/");
        onClose();
      },
    },
    {
      id: "nav-community",
      title: "Communauté OMNI",
      subtitle: "Échanger avec d'autres utilisateurs",
      category: "Navigation",
      icon: Users,
      action: () => {
        navigate("/community");
        onClose();
      },
    },
    {
      id: "nav-service",
      title: "Catalogue de Services",
      subtitle: "Explorer les modules et intégrations",
      category: "Navigation",
      icon: Briefcase,
      action: () => {
        navigate("/service");
        onClose();
      },
    },
    {
      id: "nav-settings",
      title: "Paramètres & Sécurité",
      subtitle: "Langue, devises, notifications et profil",
      category: "Navigation",
      icon: SettingsIcon,
      action: () => {
        navigate("/settings");
        onClose();
      },
    },
    {
      id: "nav-help",
      title: "Aide & Assistance",
      subtitle: "Guides d'utilisation et FAQ",
      category: "Navigation",
      icon: HelpCircle,
      action: () => {
        navigate("/help");
        onClose();
      },
    },
  ];

  // Dynamic filtered list with NLP Intent Detection
  const trimmed = query.trim();
  let filtered: PaletteItem[] = [];

  if (trimmed) {
    const detected = detectActionFromText(trimmed);
    if (detected) {
      filtered.push({
        id: "detected-action",
        title: detected.title,
        subtitle: `Action intelligente détectée pour « ${trimmed} »`,
        category: "Gemini",
        icon: Zap,
        isAiAction: true,
        action: () => {
          vibrate(30);
          sound.playClick();
          if (detected.type === "START_FOCUS") {
            navigate("/focus", { state: { autoStart: true, duration: detected.detail ? parseInt(detected.detail, 10) * 60 : 25 * 60 } });
          } else if (detected.type === "LEARN_FINANCE") {
            navigate("/wallet", { state: { prefilledTopic: detected.detail } });
          } else if (detected.type === "VIEW_ROUTINES") {
            navigate("/focus", { state: { tab: "routines" } });
          } else if (detected.type === "TOGGLE_OFFLINE") {
            toggleForceOffline();
          } else if (detected.target) {
            navigate(detected.target);
          }
          onClose();
        },
        shortcut: "↵"
      });
    }

    // Always offer direct execution with Life OS
    filtered.push({
      id: "ask-lifeos-query",
      title: `Demander à Life OS : « ${trimmed} »`,
      subtitle: "Poser cette question ou converser avec l'assistant",
      category: "Gemini",
      icon: Sparkles,
      isAiAction: true,
      action: () => {
        vibrate(30);
        sound.playClick();
        navigate("/life-os", { state: { prefilledPrompt: trimmed } });
        onClose();
      },
      shortcut: "↵"
    });

    const staticMatched = baseItems.filter((item) => {
      const q = trimmed.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    });

    filtered = [...filtered, ...staticMatched];
  } else {
    filtered = baseItems;
  }

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].action();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filtered, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ duration: 0.15 }}
          className="relative w-full max-w-xl bg-[#0c0c0e] border border-white/15 rounded-3xl shadow-[0_20px_70px_rgba(0,0,0,0.8)] overflow-hidden z-10"
        >
          {/* Search Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
            <Search className="w-5 h-5 text-indigo-400 shrink-0" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Commande libre, action, poser une question... (ex: 'focus 15m', 'budget')"
              className="w-full bg-transparent text-white placeholder:text-white/30 text-sm focus:outline-none font-light"
            />
            <span className="text-[10px] font-mono tracking-widest px-2 py-0.5 rounded bg-white/10 text-white/50">
              ESC
            </span>
          </div>

          {/* Results List */}
          <div className="max-h-96 overflow-y-auto p-2 divide-y divide-white/5">
            {filtered.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;
              return (
                <button
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-left transition-all cursor-pointer ${
                    isSelected
                      ? item.isAiAction
                        ? "bg-gradient-to-r from-indigo-600/30 to-purple-600/30 text-white border border-indigo-500/40 shadow-[0_0_20px_rgba(99,102,241,0.2)]"
                        : "bg-indigo-600/20 text-white border border-indigo-500/30 shadow-[inset_0_0_15px_rgba(99,102,241,0.15)]"
                      : "text-white/80 hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <div
                    className={`p-2.5 rounded-xl shrink-0 ${
                      isSelected
                        ? item.isAiAction
                          ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.6)]"
                          : "bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                        : item.isAiAction
                        ? "bg-indigo-500/20 text-indigo-300"
                        : "bg-white/5 text-white/60"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{item.title}</span>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-white/30 px-1.5 py-0.5 rounded bg-white/5">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-xs text-white/40 truncate mt-0.5 font-light">
                      {item.subtitle}
                    </p>
                  </div>
                  {isSelected && (
                    <ArrowRight className="w-4 h-4 text-indigo-400 shrink-0 animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer Navigation Hints */}
          <div className="px-5 py-3 bg-black/40 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-white/40">
            <div className="flex items-center gap-4">
              <span>↑↓ Naviguer</span>
              <span>↵ Valider</span>
              <span>ESC Fermer</span>
            </div>
            <span className="text-indigo-400 font-sans text-xs">OMNI Life OS NLP Engine</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
