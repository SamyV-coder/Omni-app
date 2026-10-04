import React, { useState, useEffect } from "react";
import { Bell, BellOff, X, Sparkles, Check, Clock } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { notificationService, NotificationPermissionState } from "../lib/notifications";
import { initRoutineScheduler } from "../lib/routineScheduler";
import { sound } from "../lib/sound";
import { vibrate } from "../lib/utils";

interface ToastItem {
  id: string;
  title: string;
  body: string;
}

export function NotificationManagerOverlay() {
  const [permission, setPermission] = useState<NotificationPermissionState>("default");
  const [showPromptBanner, setShowPromptBanner] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    initRoutineScheduler();

    const currentState = notificationService.getPermissionState();
    setPermission(currentState);

    // Show opt-in banner if not decided yet
    if (currentState === "default") {
      const dismissed = sessionStorage.getItem("omni_notif_banner_dismissed");
      if (!dismissed) {
        setShowPromptBanner(true);
      }
    }

    // Subscribe to live incoming notifications
    const unsubscribe = notificationService.subscribeInApp((notif) => {
      setToasts((prev) => [...prev, notif]);

      // Auto dismiss after 6 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== notif.id));
      }, 6000);
    });

    return () => unsubscribe();
  }, []);

  const handleEnableNotifications = async () => {
    vibrate(25);
    sound.playClick();
    const result = await notificationService.requestPermission();
    setPermission(result);
    setShowPromptBanner(false);

    if (result === "granted") {
      notificationService.notify({
        title: "⚡ Notifications OMNI Activées",
        body: "Vous recevrez désormais vos réveils de routine, alarmes et alertes de focus en temps réel.",
      });
    }
  };

  const handleDismissBanner = () => {
    setShowPromptBanner(false);
    sessionStorage.setItem("omni_notif_banner_dismissed", "true");
  };

  return (
    <>
      {/* Opt-in Prompt Banner (if default) */}
      <AnimatePresence>
        {showPromptBanner && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            className="fixed top-4 left-4 right-4 md:left-auto md:right-8 z-50 md:max-w-md bg-gradient-to-r from-[#111118] to-[#181824] border border-indigo-500/40 rounded-2xl p-4 shadow-[0_10px_35px_rgba(99,102,241,0.25)] backdrop-blur-2xl flex items-start gap-3.5"
          >
            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 shrink-0">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>

            <div className="flex-1 text-xs">
              <h4 className="font-bold text-white text-sm">Activer les Notifications & Alarmes</h4>
              <p className="text-white/60 mt-1 leading-relaxed">
                Autorise les alertes sonores et vibrations pour les réveils matinaux, rappels de routine et fin de Deep Work.
              </p>

              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={handleEnableNotifications}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs font-mono flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all"
                >
                  <Check className="w-3.5 h-3.5" />
                  Activer
                </button>
                <button
                  onClick={handleDismissBanner}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white text-xs font-mono transition-all"
                >
                  Plus tard
                </button>
              </div>
            </div>

            <button
              onClick={handleDismissBanner}
              className="text-white/40 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating In-App Live Toasts */}
      <div className="fixed top-6 right-6 z-50 space-y-3 pointer-events-none max-w-sm w-full">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.95 }}
              className="pointer-events-auto bg-[#0c0d14]/95 border border-indigo-500/40 rounded-2xl p-4 shadow-[0_0_30px_rgba(99,102,241,0.35)] backdrop-blur-2xl flex items-start gap-3"
            >
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 shrink-0">
                <Clock className="w-5 h-5 animate-pulse" />
              </div>

              <div className="flex-1 text-xs">
                <h4 className="font-bold text-white text-sm">{t.title}</h4>
                <p className="text-white/70 mt-1 leading-relaxed">{t.body}</p>
              </div>

              <button
                onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
                className="text-white/40 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}
