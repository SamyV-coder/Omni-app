// Routine & Alarm Scheduler Engine
// Persists active alarms and reminders in localStorage and verifies every minute or second

import { notificationService } from "./notifications";

export interface RoutineAlarm {
  id: string;
  label: string;
  time: string; // HH:mm format (e.g. "07:00")
  days: number[]; // 0 = Dimanche, 1 = Lundi, etc. (empty = everyday)
  enabled: boolean;
  type: "wakeup" | "focus_session" | "deep_work_break" | "evening_winddown";
  actionTarget?: string;
}

export interface QuickReminder {
  id: string;
  title: string;
  time: string; // HH:mm
  completed: boolean;
  category: "work" | "health" | "routine";
}

const STORAGE_ALARMS_KEY = "omni_routine_alarms";
const STORAGE_REMINDERS_KEY = "omni_quick_reminders";

export const DEFAULT_ROUTINES: RoutineAlarm[] = [
  {
    id: "wakeup-ai",
    label: "Réveil Intelligent Optimal",
    time: "07:00",
    days: [1, 2, 3, 4, 5],
    enabled: true,
    type: "wakeup",
    actionTarget: "/focus",
  },
  {
    id: "morning-deep-work",
    label: "Bloc Focus Matinal (Deep Work)",
    time: "09:00",
    days: [1, 2, 3, 4, 5],
    enabled: true,
    type: "focus_session",
    actionTarget: "/focus",
  },
  {
    id: "posture-break",
    label: "Pause & Hydratation",
    time: "11:30",
    days: [1, 2, 3, 4, 5, 6, 0],
    enabled: true,
    type: "deep_work_break",
  },
  {
    id: "afternoon-sprint",
    label: "Sprint Focus Après-Midi (Pomodoro)",
    time: "14:30",
    days: [1, 2, 3, 4, 5],
    enabled: false,
    type: "focus_session",
    actionTarget: "/focus",
  },
  {
    id: "evening-review",
    label: "Bilan & Déconnexion du Soir",
    time: "21:00",
    days: [1, 2, 3, 4, 5, 6, 0],
    enabled: true,
    type: "evening_winddown",
  },
];

export const DEFAULT_REMINDERS: QuickReminder[] = [
  {
    id: "rem-1",
    title: "Vérifier la boîte de réception Gmail",
    time: "10:00",
    completed: false,
    category: "work",
  },
  {
    id: "rem-2",
    title: "Session Deep Work de 25 min",
    time: "14:00",
    completed: false,
    category: "routine",
  },
  {
    id: "rem-3",
    title: "Marcher 10 min & boire de l'eau",
    time: "16:00",
    completed: false,
    category: "health",
  },
];

export function getStoredAlarms(): RoutineAlarm[] {
  try {
    const raw = localStorage.getItem(STORAGE_ALARMS_KEY);
    if (!raw) return DEFAULT_ROUTINES;
    return JSON.parse(raw);
  } catch {
    return DEFAULT_ROUTINES;
  }
}

export function saveStoredAlarms(alarms: RoutineAlarm[]) {
  try {
    localStorage.setItem(STORAGE_ALARMS_KEY, JSON.stringify(alarms));
  } catch (e) {
    console.warn("Could not save alarms to localStorage:", e);
  }
}

export function getStoredReminders(): QuickReminder[] {
  try {
    const raw = localStorage.getItem(STORAGE_REMINDERS_KEY);
    if (!raw) return DEFAULT_REMINDERS;
    return JSON.parse(raw);
  } catch {
    return DEFAULT_REMINDERS;
  }
}

export function saveStoredReminders(reminders: QuickReminder[]) {
  try {
    localStorage.setItem(STORAGE_REMINDERS_KEY, JSON.stringify(reminders));
  } catch (e) {
    console.warn("Could not save reminders:", e);
  }
}

// Background scheduler checker
let schedulerInitialized = false;
let lastTriggeredMinute = "";

export function initRoutineScheduler() {
  if (typeof window === "undefined" || schedulerInitialized) return;
  schedulerInitialized = true;

  const checkAlarms = () => {
    const now = new Date();
    const currentHH = String(now.getHours()).padStart(2, "0");
    const currentMM = String(now.getMinutes()).padStart(2, "0");
    const currentTimeStr = `${currentHH}:${currentMM}`;
    const currentDay = now.getDay();

    if (lastTriggeredMinute === currentTimeStr) return;

    const alarms = getStoredAlarms();
    alarms.forEach((alarm) => {
      if (!alarm.enabled) return;
      if (alarm.time === currentTimeStr) {
        if (alarm.days.length === 0 || alarm.days.includes(currentDay)) {
          lastTriggeredMinute = currentTimeStr;
          notificationService.ringAlarm(alarm.label);
        }
      }
    });

    const reminders = getStoredReminders();
    reminders.forEach((rem) => {
      if (rem.completed) return;
      if (rem.time === currentTimeStr) {
        lastTriggeredMinute = currentTimeStr;
        notificationService.notify({
          title: `🔔 Rappel OMNI : ${rem.title}`,
          body: `Il est ${rem.time} — Heure de réaliser votre tâche planifiée.`,
          tag: `rem-${rem.id}`,
        });
      }
    });
  };

  // Check every 10 seconds to catch the exact minute
  setInterval(checkAlarms, 10000);
  checkAlarms();
}
