import { useState, useEffect } from "react";
import { 
  Clock, 
  Plus, 
  Sun, 
  CheckCircle2, 
  Play, 
  Square, 
  RotateCcw, 
  Target as TargetIcon, 
  Sparkles,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Award
} from "lucide-react";
import { motion } from "motion/react";
import { vibrate } from "../lib/utils";
import { sound } from "../lib/sound";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { notificationService } from "../lib/notifications";
import { 
  getStoredAlarms, 
  saveStoredAlarms, 
  getStoredReminders, 
  saveStoredReminders, 
  RoutineAlarm, 
  QuickReminder 
} from "../lib/routineScheduler";
import { Bell, Check, Trash2, ToggleLeft, ToggleRight, AlertCircle } from "lucide-react";

export function Focus() {
  const { user, updateScore } = useAuth();
  const location = useLocation();
  const [initialDuration, setInitialDuration] = useState(25 * 60);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [ambience, setAmbience] = useState<"off" | "rain" | "waves" | "space" | "fire" | "bowl">("off");
  const [isZenMode, setIsZenMode] = useState(false);
  const [sessionCompletedNotice, setSessionCompletedNotice] = useState<string | null>(null);

  // Routines & Alarms State
  const [alarms, setAlarms] = useState<RoutineAlarm[]>([]);
  const [reminders, setReminders] = useState<QuickReminder[]>([]);
  const [newReminderTitle, setNewReminderTitle] = useState("");
  const [newReminderTime, setNewReminderTime] = useState("12:00");
  const [showAddReminder, setShowAddReminder] = useState(false);

  useEffect(() => {
    setAlarms(getStoredAlarms());
    setReminders(getStoredReminders());
  }, []);

  const toggleAlarm = (id: string) => {
    vibrate(25);
    sound.playClick();
    const updated = alarms.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a));
    setAlarms(updated);
    saveStoredAlarms(updated);
  };

  const handleTestAlarm = (alarm: RoutineAlarm) => {
    vibrate([100, 80, 100]);
    notificationService.ringAlarm(alarm.label);
  };

  const toggleReminder = (id: string) => {
    vibrate(20);
    sound.playClick();
    const updated = reminders.map((r) => (r.id === id ? { ...r, completed: !r.completed } : r));
    setReminders(updated);
    saveStoredReminders(updated);
  };

  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminderTitle.trim()) return;
    vibrate(20);
    sound.playNotification();

    const newRem: QuickReminder = {
      id: `rem-${Date.now()}`,
      title: newReminderTitle.trim(),
      time: newReminderTime,
      completed: false,
      category: "routine",
    };

    const updated = [newRem, ...reminders];
    setReminders(updated);
    saveStoredReminders(updated);
    setNewReminderTitle("");
    setShowAddReminder(false);
  };

  const handleDeleteReminder = (id: string) => {
    vibrate(20);
    const updated = reminders.filter((r) => r.id !== id);
    setReminders(updated);
    saveStoredReminders(updated);
  };

  // Si déclenché par Gemini
  useEffect(() => {
    if (location.state?.duration) {
      setInitialDuration(location.state.duration);
      setTimeLeft(location.state.duration);
    }
    if (location.state?.autoStart) {
      setIsActive(true);
      sound.playStart();
      vibrate(50);
    }
    if (location.state?.zen) {
      setIsZenMode(true);
    }
  }, [location.state]);

  useEffect(() => {
    fetch("/api/focus")
      .then(res => res.json())
      .then(data => setSessions(data))
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      clearInterval(interval);
      setIsActive(false);
      sound.playComplete();
      vibrate([100, 100, 100, 100, 100]);
      saveSession(initialDuration);
      updateScore(5); // +5 points OMNI pour chaque session Focus accomplie
      setSessionCompletedNotice("+5 points OMNI ! Session Deep Work accomplie avec succès.");
      
      // Dispatch high-priority web notification
      notificationService.notify({
        title: "🎯 Session Focus Terminée !",
        body: `Bravo ! Vous venez d'accomplir ${Math.round(initialDuration / 60)} minutes de Deep Work (+5 points OMNI). Prenez une courte pause.`,
        tag: "focus-session-completed",
      });

      setTimeout(() => setSessionCompletedNotice(null), 5000);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, initialDuration]);

  const saveSession = async (duration: number) => {
    const sessionObj = {
      id: Date.now().toString(),
      duration,
      completed_at: new Date().toISOString()
    };

    if (user) {
      try {
        await addDoc(collection(db, "users", user.uid, "focus_sessions"), {
          id: sessionObj.id,
          userId: user.uid,
          duration,
          completedAt: sessionObj.completed_at
        });
      } catch (e) {
        console.warn("Could not save to Firestore:", e);
      }
    }

    fetch("/api/focus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ duration })
    })
    .then(res => res.json())
    .then(newSession => {
      setSessions(prev => [newSession, ...prev].slice(0, 10));
      setTimeLeft(initialDuration);
    })
    .catch(err => {
      setSessions(prev => [sessionObj, ...prev].slice(0, 10));
      setTimeLeft(initialDuration);
    });
  };

  const toggleTimer = () => {
    vibrate(50);
    sound.playClick();
    if (!isActive) {
      sound.playStart();
    }
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    vibrate(50);
    sound.playClick();
    setIsActive(false);
    setTimeLeft(initialDuration);
  };

  const setPreset = (minutes: number) => {
    vibrate(30);
    sound.playClick();
    setIsActive(false);
    setInitialDuration(minutes * 60);
    setTimeLeft(minutes * 60);
  };

  const handleToggleAmbience = (mode: "rain" | "waves" | "space" | "fire" | "bowl") => {
    sound.playClick();
    const nextMode = ambience === mode ? "off" : mode;
    sound.setAmbience(nextMode);
    setAmbience(nextMode);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Progression en pourcentage
  const progressPercent = Math.min(100, Math.max(0, ((initialDuration - timeLeft) / (initialDuration || 1)) * 100));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto space-y-10 pb-24 md:pb-0"
    >
      {/* Fullscreen Zen Mode Overlay */}
      {isZenMode && (
        <div className="fixed inset-0 z-50 bg-[#050505] flex flex-col items-center justify-center p-8 backdrop-blur-3xl animate-in fade-in duration-300">
          <div className="absolute top-8 right-8">
            <button
              onClick={() => {
                sound.playClick();
                setIsZenMode(false);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-mono"
            >
              <Minimize2 className="w-4 h-4" />
              <span>Quitter le mode Zen</span>
            </button>
          </div>

          <div className="text-center max-w-xl space-y-8">
            <span className="text-xs font-mono uppercase tracking-[0.3em] text-emerald-400">
              IMMERSION TOTALE • ZÉRO DISTRACTION
            </span>
            <div className="text-8xl md:text-[140px] font-mono font-extralight tracking-tighter text-white drop-shadow-[0_0_50px_rgba(255,255,255,0.2)]">
              {formatTime(timeLeft)}
            </div>

            <div className="flex items-center justify-center gap-6">
              <button
                onClick={toggleTimer}
                className="w-24 h-24 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform shadow-[0_0_50px_rgba(255,255,255,0.4)]"
              >
                {isActive ? <Square className="w-9 h-9 fill-current" /> : <Play className="w-9 h-9 fill-current ml-1" />}
              </button>
              <button
                onClick={resetTimer}
                className="w-14 h-14 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white flex items-center justify-center hover:rotate-180 transition-all duration-500"
              >
                <RotateCcw className="w-6 h-6" />
              </button>
            </div>

            <p className="text-xs font-mono text-white/40">
              Ambiance sonore : <strong className="text-white/80">{ambience === "off" ? "Désactivée" : ambience.toUpperCase()}</strong>
            </p>
          </div>
        </div>
      )}

      {/* Toast Notice de session réussie */}
      {sessionCompletedNotice && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3 rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.5)] border border-emerald-400/30 flex items-center gap-3 text-sm font-medium"
        >
          <Award className="w-5 h-5 text-yellow-300" />
          <span>{sessionCompletedNotice}</span>
        </motion.div>
      )}

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 text-blue-400 mb-2">
            <TargetIcon className="w-5 h-5" />
            <span className="font-mono text-sm tracking-widest uppercase">Productivity Engine</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-light tracking-tight text-white/90">
            Focus
          </h1>
          <p className="text-white/50 mt-2 text-lg font-light">Maîtrise ton temps, coupe les distractions et gagne des points OMNI.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10 text-xs font-mono text-indigo-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Pilotable par Life OS</span>
          </div>
        </div>
      </header>

      {/* Barre de contrôle : Presets & Bruit d'ambiance audio */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white/[0.02] border border-white/5 p-4 rounded-2xl backdrop-blur-md">
        {/* Presets de durée */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono text-white/40 uppercase tracking-widest mr-1">Durée :</span>
          {[
            { label: "15m", full: "15 min (Sprint)", min: 15 },
            { label: "25m", full: "25 min (Pomodoro)", min: 25 },
            { label: "50m", full: "50 min (Deep Work)", min: 50 },
          ].map(p => (
            <button
              key={p.min}
              onClick={() => setPreset(p.min)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                initialDuration === p.min * 60 && !isActive 
                  ? "bg-blue-600/30 border-blue-500 text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.3)]" 
                  : "bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10"
              }`}
            >
              {p.full}
            </button>
          ))}
        </div>

        {/* Générateur d'ambiance Deep Work */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-white/40 uppercase tracking-widest mr-1 flex items-center gap-1">
            <Volume2 className="w-3.5 h-3.5 text-blue-400" />
            Ambiance :
          </span>
          {[
            { id: "rain", label: "🌧️ Pluie" },
            { id: "waves", label: "🌊 Vagues" },
            { id: "space", label: "🪐 Espace" },
            { id: "fire", label: "🔥 Foyer" },
            { id: "bowl", label: "🔔 Bols Zen" },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => handleToggleAmbience(item.id as any)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                ambience === item.id
                  ? "bg-indigo-600/30 border-indigo-400 text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.3)] animate-pulse"
                  : "bg-white/5 border-white/10 text-white/60 hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
          {ambience !== "off" && (
            <button
              onClick={() => handleToggleAmbience(ambience as any)}
              className="p-1 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
              title="Couper le son"
            >
              <VolumeX className="w-3.5 h-3.5" />
            </button>
          )}

          <div className="h-4 w-[1px] bg-white/10 mx-1 hidden sm:block" />

          {/* Zen Mode Button */}
          <button
            onClick={() => {
              vibrate(30);
              sound.playClick();
              setIsZenMode(!isZenMode);
            }}
            className={`px-3 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-all ${
              isZenMode
                ? "bg-emerald-500/20 border-emerald-400 text-emerald-300"
                : "bg-white/5 border-white/10 text-white/60 hover:text-white"
            }`}
          >
            {isZenMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span>{isZenMode ? "Quitter Zen" : "Mode Zen"}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Timer & Timeline */}
        <div className="md:col-span-2 space-y-8">
          {/* Active Timer */}
          <div className="rounded-3xl bg-black/40 border border-white/10 p-10 backdrop-blur-xl flex flex-col items-center justify-center relative overflow-hidden shadow-[inset_0_0_40px_rgba(255,255,255,0.02)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.15),transparent_60%)] pointer-events-none" />
            
            {/* Barre de progression circulaire / linéaire */}
            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mb-6 relative">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-1000 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between w-full mb-4 px-2">
              <h2 className="text-xs font-mono tracking-widest uppercase text-blue-400 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isActive ? "bg-emerald-400 animate-ping" : "bg-blue-400"}`} />
                {isActive ? "Deep Work en cours" : "Prêt à démarrer"}
              </h2>
              <span className="text-xs font-mono text-white/40">
                Progression : {Math.round(progressPercent)}%
              </span>
            </div>
            
            <div className="text-7xl md:text-9xl font-light tracking-tighter text-white mb-10 relative z-10 font-mono drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">
              {formatTime(timeLeft)}
            </div>
            
            <div className="flex items-center gap-6 relative z-10">
              <button 
                onClick={toggleTimer}
                className="w-20 h-20 rounded-full bg-white text-black flex items-center justify-center hover:bg-white/90 transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95"
              >
                {isActive ? <Square className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
              </button>
              <button 
                onClick={resetTimer}
                className="w-14 h-14 rounded-full bg-white/5 border border-white/10 text-white/70 flex items-center justify-center hover:bg-white/10 hover:text-white transition-all hover:rotate-180 duration-500"
                title="Réinitialiser"
              >
                <RotateCcw className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h2 className="text-xl font-medium tracking-wide text-white/90">Sessions Récentes</h2>
            <span className="text-xs font-mono text-white/40 uppercase">Gagne +5 pts par session</span>
          </div>

          <div className="relative pl-8 space-y-6 before:absolute before:inset-y-0 before:left-[11px] before:w-[1px] before:bg-gradient-to-b before:from-blue-500/50 before:to-transparent">
            {sessions.length === 0 ? (
              <div className="relative">
                <div className="absolute -left-[37px] top-1 w-6 h-6 rounded-full bg-[#050505] border border-white/20 flex items-center justify-center z-10">
                  <Sun className="w-3 h-3 text-white/50" />
                </div>
                <div className="rounded-2xl bg-black/40 border border-white/5 p-6 backdrop-blur-xl border-dashed">
                  <p className="text-white/40 text-center py-4 font-light">Aucune session enregistrée. Lance ton premier bloc Focus.</p>
                </div>
              </div>
            ) : (
              sessions.map((session, i) => (
                <div key={session.id || i} className="relative group">
                  <div className="absolute -left-[37px] top-1 w-6 h-6 rounded-full bg-[#050505] border border-blue-500/50 flex items-center justify-center z-10 group-hover:border-blue-400 transition-colors shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                    <CheckCircle2 className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="rounded-2xl bg-black/40 border border-white/5 p-5 backdrop-blur-xl flex justify-between items-center hover:bg-white/5 transition-colors shadow-[inset_0_0_20px_rgba(255,255,255,0.01)]">
                    <div>
                      <h3 className="font-medium text-white/90">Deep Work</h3>
                      <p className="text-xs font-mono text-white/40 mt-1 uppercase tracking-widest">{new Date(session.completed_at || session.completedAt || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    </div>
                    <div className="text-blue-400 font-mono text-sm bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                      +{Math.round(session.duration / 60)} min
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Smart Alarm & Routines & Reminders */}
        <div className="space-y-6">
          {/* Main AI Wakeup & Daily Alarms Card */}
          <div className="rounded-3xl bg-black/40 border border-white/10 p-6 backdrop-blur-xl shadow-[inset_0_0_40px_rgba(255,255,255,0.02)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />
            <div className="flex items-center justify-between mb-6 relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-white/95 text-base">Réveils & Routines</h3>
                  <p className="text-[11px] font-mono text-white/40">SYNCHRONISATION AUTO</p>
                </div>
              </div>
              <span className="text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Actif
              </span>
            </div>

            {/* List of routine alarms */}
            <div className="space-y-3 relative z-10">
              {alarms.map((alarm) => (
                <div
                  key={alarm.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    alarm.enabled
                      ? "bg-purple-500/[0.07] border-purple-500/30"
                      : "bg-white/[0.02] border-white/5 opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold font-mono text-white tracking-tight">
                          {alarm.time}
                        </span>
                        <span className="text-[10px] font-mono text-purple-300/80 px-2 py-0.5 rounded-md bg-purple-500/20 border border-purple-500/30">
                          {alarm.type === "wakeup" ? "IA Réveil" : alarm.type === "focus_session" ? "Focus" : "Pause"}
                        </span>
                      </div>
                      <p className="text-xs text-white/70 mt-1">{alarm.label}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTestAlarm(alarm)}
                        title="Tester la sonnerie et vibration"
                        className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-mono text-white/50 hover:text-white"
                      >
                        Tester
                      </button>
                      <button
                        onClick={() => toggleAlarm(alarm.id)}
                        className={`p-1 rounded-xl transition-colors ${
                          alarm.enabled ? "text-purple-400 hover:text-purple-300" : "text-white/30 hover:text-white"
                        }`}
                      >
                        {alarm.enabled ? (
                          <ToggleRight className="w-7 h-7" />
                        ) : (
                          <ToggleLeft className="w-7 h-7" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Tasks & Routine Reminders Card */}
          <div className="rounded-3xl bg-black/40 border border-white/10 p-6 backdrop-blur-xl shadow-[inset_0_0_40px_rgba(255,255,255,0.02)]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Bell className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-semibold text-white">Rappels de Journée</h4>
              </div>

              <button
                onClick={() => setShowAddReminder(!showAddReminder)}
                className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-[11px] font-mono text-indigo-400 flex items-center gap-1 border border-white/10"
              >
                <Plus className="w-3.5 h-3.5" />
                Ajouter
              </button>
            </div>

            {/* Add Reminder Input Form */}
            {showAddReminder && (
              <form onSubmit={handleAddReminder} className="mb-4 p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <input
                  type="text"
                  required
                  placeholder="Intitulé du rappel..."
                  value={newReminderTitle}
                  onChange={(e) => setNewReminderTitle(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500"
                />
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="time"
                    required
                    value={newReminderTime}
                    onChange={(e) => setNewReminderTime(e.target.value)}
                    className="bg-black/50 border border-white/10 rounded-xl px-2 py-1 text-xs text-white font-mono"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddReminder(false)}
                      className="px-3 py-1 rounded-lg text-[11px] font-mono text-white/50"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 rounded-lg bg-indigo-600 text-white text-[11px] font-mono font-medium shadow-md shadow-indigo-600/30"
                    >
                      Enregistrer
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* List of Reminders */}
            <div className="space-y-2">
              {reminders.map((rem) => (
                <div
                  key={rem.id}
                  className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                    rem.completed
                      ? "bg-white/[0.01] border-white/5 opacity-40 line-through"
                      : "bg-white/[0.03] border-white/10 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <button
                      onClick={() => toggleReminder(rem.id)}
                      className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 ${
                        rem.completed
                          ? "bg-emerald-500 border-emerald-400 text-black"
                          : "border-white/20 hover:border-white/40"
                      }`}
                    >
                      {rem.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>
                    <div>
                      <p className="text-xs text-white font-medium truncate">{rem.title}</p>
                      <span className="text-[10px] font-mono text-indigo-400 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {rem.time}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteReminder(rem.id)}
                    className="text-white/30 hover:text-rose-400 p-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

