import React from "react";
import { WifiOff, Wifi, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useOffline } from "../context/OfflineContext";

export function OfflineBanner() {
  const { isOffline, isOnline, forceOffline, toggleForceOffline } = useOffline();

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="sticky top-0 z-50 w-full px-4 py-2 bg-gradient-to-r from-amber-950/90 via-black/90 to-amber-950/90 border-b border-amber-500/30 backdrop-blur-xl flex items-center justify-between text-xs font-mono shadow-lg"
        >
          <div className="flex items-center gap-2 text-amber-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
            </span>
            <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="font-medium">
              {!isOnline
                ? "Connexion internet interrompue • Mode Hors-Ligne Actif (GPS & Cache Local 100% opérationnels)"
                : "Mode Hors-Ligne forcé • Exécution 100% locale sans réseau"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {forceOffline && isOnline && (
              <button
                type="button"
                onClick={toggleForceOffline}
                className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-[11px] text-amber-200 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Wifi className="w-3 h-3" />
                <span>Repasser En Ligne</span>
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
