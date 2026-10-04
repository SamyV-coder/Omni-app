import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Plus, 
  X, 
  MapPin, 
  Mail, 
  HardDrive, 
  Play, 
  Sparkles, 
  Target, 
  Wallet,
  Users,
  Compass
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { sound } from "../lib/sound";
import { vibrate } from "../lib/utils";

interface ShortcutAction {
  id: string;
  title: string;
  icon: any;
  color: string;
  border: string;
  onClick: () => void;
}

export function MobileSpeedDial() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const shortcuts: ShortcutAction[] = [
    {
      id: "focus-now",
      title: "Focus 25m",
      icon: Play,
      color: "bg-emerald-600 text-white shadow-emerald-500/30",
      border: "border-emerald-400/40",
      onClick: () => {
        navigate("/focus", { state: { duration: 25 * 60, autoStart: true } });
        setIsOpen(false);
      }
    },
    {
      id: "maps-view",
      title: "Maps OMNI",
      icon: MapPin,
      color: "bg-indigo-600 text-white shadow-indigo-500/30",
      border: "border-indigo-400/40",
      onClick: () => {
        navigate("/maps");
        setIsOpen(false);
      }
    },
    {
      id: "gmail-view",
      title: "Gmail",
      icon: Mail,
      color: "bg-rose-600 text-white shadow-rose-500/30",
      border: "border-rose-400/40",
      onClick: () => {
        navigate("/gmail");
        setIsOpen(false);
      }
    },
    {
      id: "drive-view",
      title: "Drive",
      icon: HardDrive,
      color: "bg-amber-600 text-white shadow-amber-500/30",
      border: "border-amber-400/40",
      onClick: () => {
        navigate("/drive");
        setIsOpen(false);
      }
    },
    {
      id: "lifeos-view",
      title: "Life OS (IA)",
      icon: Sparkles,
      color: "bg-purple-600 text-white shadow-purple-500/30",
      border: "border-purple-400/40",
      onClick: () => {
        navigate("/life-os");
        setIsOpen(false);
      }
    },
  ];

  const toggle = () => {
    vibrate(25);
    sound.playClick();
    setIsOpen(!isOpen);
  };

  return (
    <div className="md:hidden fixed bottom-24 right-5 z-40">
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30"
          />
        )}
      </AnimatePresence>

      {/* Floating Action Menu Items */}
      <div className="relative z-40 flex flex-col-reverse items-end gap-3">
        {/* Main Dial Trigger Button */}
        <motion.button
          onClick={toggle}
          whileTap={{ scale: 0.9 }}
          animate={{ rotate: isOpen ? 45 : 0 }}
          className="w-13 h-13 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 p-0.5 shadow-[0_0_25px_rgba(99,102,241,0.5)] border border-white/20 flex items-center justify-center text-white"
        >
          <div className="w-full h-full bg-black/40 rounded-[14px] flex items-center justify-center">
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </div>
        </motion.button>

        {/* Speed Dial Actions */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.9 }}
              className="flex flex-col items-end gap-2.5 mb-1"
            >
              {shortcuts.map((sc, index) => {
                const Icon = sc.icon;
                return (
                  <motion.div
                    key={sc.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.04 }}
                    className="flex items-center gap-3"
                  >
                    <span className="text-[11px] font-mono tracking-wider text-white bg-black/80 px-2.5 py-1 rounded-lg border border-white/10 shadow-lg whitespace-nowrap">
                      {sc.title}
                    </span>
                    <button
                      onClick={() => {
                        vibrate(20);
                        sound.playClick();
                        sc.onClick();
                      }}
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg border ${sc.color} ${sc.border} active:scale-95 transition-transform`}
                    >
                      <Icon className="w-5 h-5" />
                    </button>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
