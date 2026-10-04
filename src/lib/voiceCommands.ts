// OMNI Voice Command & Speech Recognition Engine
// Allows user to trigger custom voice commands or dictate to Life OS

import { sound } from "./sound";
import { vibrate } from "./utils";

export interface CustomVoiceCommand {
  id: string;
  triggerPhrase: string; // ex: "lance mon focus", "ouvre la carte", "café proche", "briefing"
  actionType: "NAVIGATE" | "START_FOCUS" | "DAILY_BRIEFING" | "FIND_PLACES" | "ZEN_MODE" | "CUSTOM_AI";
  targetRoute?: string;
  payload?: any;
  responseMessage: string;
  enabled: boolean;
}

const STORAGE_VOICE_COMMANDS_KEY = "omni_custom_voice_commands";

export const DEFAULT_VOICE_COMMANDS: CustomVoiceCommand[] = [
  {
    id: "vc-focus-25",
    triggerPhrase: "lance mon focus",
    actionType: "START_FOCUS",
    targetRoute: "/focus",
    payload: { duration: 25 * 60, autoStart: true },
    responseMessage: "Session Focus de 25 minutes lancée. Mode concentration activé.",
    enabled: true,
  },
  {
    id: "vc-briefing",
    triggerPhrase: "briefing du jour",
    actionType: "DAILY_BRIEFING",
    responseMessage: "Préparation de votre briefing vocal du matin...",
    enabled: true,
  },
  {
    id: "vc-open-maps",
    triggerPhrase: "trouve un café",
    actionType: "FIND_PLACES",
    targetRoute: "/maps",
    payload: { query: "café coworking" },
    responseMessage: "Ouverture de la cartographie pour les cafés et hubs de productivité.",
    enabled: true,
  },
  {
    id: "vc-zen-mode",
    triggerPhrase: "mode zen",
    actionType: "ZEN_MODE",
    targetRoute: "/focus",
    payload: { zen: true },
    responseMessage: "Mode Zen activé, interface épurée.",
    enabled: true,
  },
  {
    id: "vc-finance-rules",
    triggerPhrase: "académie financière",
    actionType: "NAVIGATE",
    targetRoute: "/wallet",
    responseMessage: "Ouverture de l'Academy Finance et des simulateurs.",
    enabled: true,
  },
  {
    id: "vc-open-gmail",
    triggerPhrase: "mes e-mails",
    actionType: "NAVIGATE",
    targetRoute: "/gmail",
    responseMessage: "Consultation de votre boîte de réception Gmail.",
    enabled: true,
  },
  {
    id: "vc-open-drive",
    triggerPhrase: "ouvre mon drive",
    actionType: "NAVIGATE",
    targetRoute: "/drive",
    responseMessage: "Accès à vos fichiers Google Drive.",
    enabled: true,
  },
];

export function getStoredVoiceCommands(): CustomVoiceCommand[] {
  try {
    const raw = localStorage.getItem(STORAGE_VOICE_COMMANDS_KEY);
    if (!raw) return DEFAULT_VOICE_COMMANDS;
    return JSON.parse(raw);
  } catch {
    return DEFAULT_VOICE_COMMANDS;
  }
}

export function saveStoredVoiceCommands(commands: CustomVoiceCommand[]) {
  try {
    localStorage.setItem(STORAGE_VOICE_COMMANDS_KEY, JSON.stringify(commands));
  } catch (e) {
    console.warn("Could not save custom voice commands:", e);
  }
}

// Text to Speech Synthesizer
export function speakText(text: string, onEnd?: () => void) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    if (onEnd) onEnd();
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "fr-FR";
  utterance.rate = 1.05;
  utterance.pitch = 1.0;

  utterance.onend = () => {
    if (onEnd) onEnd();
  };

  utterance.onerror = () => {
    if (onEnd) onEnd();
  };

  window.speechSynthesis.speak(utterance);
}

// Speech Recognition Engine Wrapper
export function createSpeechRecognizer(
  onResult: (text: string, isFinal: boolean) => void,
  onError?: (err: any) => void
) {
  if (typeof window === "undefined") return null;

  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = "fr-FR";

  recognition.onresult = (event: any) => {
    let interim = "";
    let final = "";

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        final += event.results[i][0].transcript;
      } else {
        interim += event.results[i][0].transcript;
      }
    }

    if (final) {
      onResult(final.trim(), true);
    } else if (interim) {
      onResult(interim.trim(), false);
    }
  };

  recognition.onerror = (e: any) => {
    if (onError) onError(e);
  };

  return recognition;
}
