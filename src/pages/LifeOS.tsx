import { useState, useRef, useEffect } from "react";
import { 
  Sparkles, 
  Send, 
  Image as ImageIcon, 
  Loader2, 
  Cpu, 
  ArrowRight, 
  Target, 
  BookOpen, 
  Users, 
  Briefcase, 
  Settings as SettingsIcon,
  CheckCircle,
  ExternalLink,
  Zap,
  Trash2,
  Mic,
  MicOff,
  Volume2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usePreferences } from "../context/PreferencesContext";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";
import { vibrate } from "../lib/utils";
import { sound } from "../lib/sound";
import { 
  getStoredVoiceCommands, 
  speakText, 
  createSpeechRecognizer 
} from "../lib/voiceCommands";

interface ActionPayload {
  type: "NAVIGATE" | "START_FOCUS" | "LEARN_FINANCE" | "CREATE_POST" | "VIEW_SERVICES" | "OPEN_SETTINGS";
  target: string;
  title: string;
  detail?: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isImage?: boolean;
  imageUrl?: string;
  action?: ActionPayload;
  timestamp?: string;
}

const QUICK_ACTIONS = [
  { label: "⚡ Lancer Focus 25m", prompt: "Lance une session Focus de 25 minutes pour m'aider à avancer." },
  { label: "📍 Voir les Hubs Maps", prompt: "Ouvre Google Maps et montre-moi les hubs de coworking et cafés de travail." },
  { label: "📬 Consulter Gmail", prompt: "Ouvre ma boîte Gmail pour voir mes derniers messages." },
  { label: "📁 Explorer Google Drive", prompt: "Ouvre mon Drive pour accéder à mes documents et fichiers de travail." },
  { label: "💰 Gérer mon argent (50/30/20)", prompt: "Explique-moi comment appliquer concrètement la règle des 50/30/20 pour mon budget." },
  { label: "🎨 Générer un visuel futuriste", prompt: "/image cybernetic neon command center hologram 4k" },
];

export function LifeOS() {
  const { user } = useAuth();
  const { language, currency, nationality } = usePreferences();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechInterim, setSpeechInterim] = useState("");
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check matching custom voice commands
  const checkCustomVoiceCommand = (text: string): boolean => {
    const clean = text.toLowerCase().trim();
    const customCommands = getStoredVoiceCommands();
    const matched = customCommands.find(
      (c) => c.enabled && (clean.includes(c.triggerPhrase) || c.triggerPhrase.includes(clean))
    );

    if (matched) {
      sound.playSuccess();
      vibrate([50, 50, 100]);
      speakText(matched.responseMessage);

      const assistantMsg: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: `🎙️ **Commande Vocale Personnalisée Reconnaît** : « *${matched.triggerPhrase}* »\n\n${matched.responseMessage}`,
        action: matched.actionType === "START_FOCUS" ? {
          type: "START_FOCUS",
          target: "/focus",
          title: "Session Focus 25 min",
          detail: "25"
        } : matched.targetRoute ? {
          type: "NAVIGATE",
          target: matched.targetRoute,
          title: matched.triggerPhrase,
          detail: "route"
        } : undefined,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };

      if (!user) setMessages((prev) => [...prev, assistantMsg]);
      else saveMessage(assistantMsg);

      if (matched.actionType === "START_FOCUS") {
        setTimeout(() => {
          navigate("/focus", { state: { duration: 25 * 60, autoStart: true } });
        }, 1200);
      } else if (matched.actionType === "DAILY_BRIEFING") {
        const morningBriefing = "Bonjour ! Voici votre briefing OMNI du jour : Système à jour, 3 rappels programmés. Préparez votre première session Deep Work de 25 minutes pour maximiser vos points.";
        speakText(morningBriefing);
      } else if (matched.targetRoute) {
        setTimeout(() => {
          navigate(matched.targetRoute!);
        }, 1000);
      }
      return true;
    }
    return false;
  };

  const toggleListening = () => {
    vibrate(30);
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const recognizer = createSpeechRecognizer(
      (transcript, isFinal) => {
        setSpeechInterim(transcript);
        if (isFinal) {
          setIsListening(false);
          setSpeechInterim("");
          // Check if matches custom voice command
          const matched = checkCustomVoiceCommand(transcript);
          if (!matched) {
            handleSend(transcript);
          }
        }
      },
      (err) => {
        console.warn("Speech recognition error:", err);
        setIsListening(false);
        setSpeechInterim("");
      }
    );

    if (!recognizer) {
      alert("La reconnaissance vocale n'est pas supportée sur ce navigateur.");
      return;
    }

    recognitionRef.current = recognizer;
    recognizer.start();
    setIsListening(true);
    sound.playStart();
  };

  // Charger l'historique depuis Firestore si connecté, sinon localStorage
  useEffect(() => {
    if (user) {
      const q = query(
        collection(db, "users", user.uid, "gemini_messages"),
        orderBy("createdAt", "asc")
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const loaded: Message[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          loaded.push({
            id: doc.id,
            role: data.role,
            content: data.content,
            isImage: Boolean(data.imageUrl),
            imageUrl: data.imageUrl,
            action: data.actionPayload ? JSON.parse(data.actionPayload) : undefined,
            timestamp: data.createdAt ? new Date(data.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : undefined
          });
        });
        if (loaded.length > 0) {
          setMessages(loaded);
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/gemini_messages`);
      });
      return () => unsubscribe();
    } else {
      const saved = localStorage.getItem("omni_gemini_history");
      if (saved) {
        try {
          setMessages(JSON.parse(saved));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Sauvegarder dans Firestore ou localStorage
  const saveMessage = async (msg: Message) => {
    if (user) {
      try {
        await addDoc(collection(db, "users", user.uid, "gemini_messages"), {
          id: msg.id,
          userId: user.uid,
          role: msg.role,
          content: msg.content,
          actionType: msg.action?.type || "",
          actionPayload: msg.action ? JSON.stringify(msg.action) : "",
          imageUrl: msg.imageUrl || "",
          createdAt: new Date().toISOString(),
        });
      } catch (error) {
        console.warn("Could not save to Firestore:", error);
      }
    } else {
      setMessages((prev) => {
        const updated = [...prev, msg];
        localStorage.setItem("omni_gemini_history", JSON.stringify(updated.slice(-30)));
        return updated;
      });
    }
  };

  const parseAction = (text: string): { cleanText: string; action?: ActionPayload } => {
    const actionRegex = /:::action\s*(\{.*?\})\s*:::/s;
    const match = text.match(actionRegex);
    if (match && match[1]) {
      try {
        const actionData = JSON.parse(match[1]);
        const cleanText = text.replace(actionRegex, "").trim();
        return { cleanText, action: actionData };
      } catch (e) {
        console.error("Action parse error:", e);
      }
    }
    return { cleanText: text };
  };

  const executeAction = (action: ActionPayload) => {
    vibrate(40);
    if (action.type === "START_FOCUS") {
      navigate("/focus", { state: { autoStart: true, duration: action.detail ? parseInt(action.detail, 10) * 60 : 25 * 60 } });
    } else if (action.type === "LEARN_FINANCE") {
      navigate("/wallet", { state: { prefilledTopic: action.detail } });
    } else if (action.type === "CREATE_POST") {
      navigate("/community", { state: { openModal: true, initialTag: "General" } });
    } else if (action.target) {
      navigate(action.target);
    }
  };

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || input;
    if (!textToSend.trim() || isTyping) return;

    vibrate(30);
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    if (!user) {
      setMessages((prev) => [...prev, userMsg]);
    } else {
      await saveMessage(userMsg);
    }

    if (!customPrompt) setInput("");
    sound.playClick();
    setIsTyping(true);

    const isImageRequest = textToSend.toLowerCase().startsWith("/image ");

    if (isImageRequest) {
      const prompt = textToSend.slice(7).trim();
      try {
        const res = await fetch("/api/gemini/image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        });
        const data = await res.json();
        if (data.imageUrl) {
          const assistantMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: `Visuel généré pour : "${prompt}"`,
            isImage: true,
            imageUrl: data.imageUrl,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          };
          if (!user) setMessages(prev => [...prev, assistantMsg]);
          else await saveMessage(assistantMsg);
        } else {
          throw new Error(data.error || "Génération impossible");
        }
      } catch (error: any) {
        const errorMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `⚠️ Erreur lors de la génération visuelle: ${error.message || "Service indisponible"}`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        };
        if (!user) setMessages(prev => [...prev, errorMsg]);
        else await saveMessage(errorMsg);
      } finally {
        setIsTyping(false);
      }
      return;
    }

    // Chat standard
    try {
      const conversationHistory = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: conversationHistory,
          currentTab: "LIFE OS",
          language,
          currency,
          nationality,
        }),
      });

      const data = await res.json();
      const rawReply = data.reply || "Commande traitée par Life OS.";
      const { cleanText, action } = parseAction(rawReply);
      sound.playComplete();

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: cleanText,
        action,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };

      if (!user) setMessages(prev => [...prev, assistantMsg]);
      else await saveMessage(assistantMsg);

    } catch (error: any) {
      console.error(error);
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Désolé, une anomalie temporaire s'est produite lors de la communication avec le serveur Gemini.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      if (!user) setMessages(prev => [...prev, assistantMsg]);
      else await saveMessage(assistantMsg);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearHistory = () => {
    vibrate(40);
    setMessages([]);
    localStorage.removeItem("omni_gemini_history");
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.99 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.99 }}
      className="max-w-5xl mx-auto h-[calc(100vh-6rem)] md:h-[calc(100vh-5rem)] flex flex-col relative"
    >
      {/* Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.12),transparent_70%)] pointer-events-none" />

      {/* Header */}
      <header className="flex items-center justify-between shrink-0 mb-4 z-10">
        <div className="flex items-center gap-4">
          <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-blue-500/20 border border-indigo-500/30 shadow-[0_0_25px_rgba(99,102,241,0.3)]">
            <div className="absolute inset-0 rounded-2xl bg-indigo-500/10 animate-ping opacity-25" />
            <Sparkles className="w-6 h-6 text-indigo-400 relative z-10" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-light tracking-tight text-white/95">LIFE OS</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-widest uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Propulsé par Gemini
              </span>
            </div>
            <p className="text-white/40 text-xs font-mono tracking-widest uppercase mt-0.5">
              Super-App Central Intelligence
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {messages.length > 0 && (
            <button
              onClick={handleClearHistory}
              title="Effacer la conversation"
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-red-400 border border-white/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <div className="flex items-center gap-3 text-xs font-mono tracking-widest uppercase bg-white/5 px-4 py-2 rounded-full border border-white/10">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-white/60">Contrôle Actif</span>
          </div>
        </div>
      </header>

      {/* Quick Actions Carousel */}
      <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-3 shrink-0 z-10">
        {QUICK_ACTIONS.map((action, i) => (
          <button
            key={i}
            onClick={() => handleSend(action.prompt)}
            disabled={isTyping}
            className="px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white/70 hover:text-white transition-all whitespace-nowrap font-light hover:border-indigo-500/30 flex items-center gap-1.5"
          >
            <span>{action.label}</span>
          </button>
        ))}
      </div>

      {/* Chat Area */}
      <div className="flex-1 rounded-3xl bg-black/50 border border-white/10 backdrop-blur-2xl overflow-hidden flex flex-col z-10 shadow-[inset_0_0_40px_rgba(255,255,255,0.02)]">
        <div className="flex-1 overflow-y-auto p-5 md:p-8 space-y-6 custom-scrollbar">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-purple-500 blur-3xl opacity-30 rounded-full" />
                <div className="w-20 h-20 rounded-3xl bg-black/60 border border-indigo-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.2)] relative z-10">
                  <Cpu className="w-10 h-10 text-indigo-400" />
                </div>
              </div>
              <h2 className="text-2xl md:text-3xl font-light tracking-wide text-white/95 mb-2">
                Je suis <span className="font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">LIFE OS</span>.
              </h2>
              <p className="text-white/50 text-sm max-w-md mx-auto mb-8 font-light leading-relaxed">
                Le système d'exploitation intelligent d'OMNI propulsé par Gemini. Je contrôle tous tes modules : Focus, Academy financière, Communauté, Services et Paramètres.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl w-full text-left">
                <button
                  onClick={() => handleSend("Lance une session Focus de 25 minutes.")}
                  className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/30 transition-all group"
                >
                  <div className="flex items-center gap-3 text-blue-400 mb-1">
                    <Target className="w-4 h-4" />
                    <span className="text-xs font-mono tracking-widest uppercase">Contrôler Focus</span>
                  </div>
                  <p className="text-sm text-white/80 font-light">"Lance un timer Pomodoro de 25 min"</p>
                </button>

                <button
                  onClick={() => handleSend("Quelles sont les meilleures règles d'or pour gérer mon argent ?")}
                  className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-500/30 transition-all group"
                >
                  <div className="flex items-center gap-3 text-emerald-400 mb-1">
                    <BookOpen className="w-4 h-4" />
                    <span className="text-xs font-mono tracking-widest uppercase">Academy Financière</span>
                  </div>
                  <p className="text-sm text-white/80 font-light">"Conseille-moi sur la gestion de mon budget"</p>
                </button>

                <button
                  onClick={() => handleSend("Ouvre la communauté OMNI et propose-moi une idée de post.")}
                  className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-orange-500/30 transition-all group"
                >
                  <div className="flex items-center gap-3 text-orange-400 mb-1">
                    <Users className="w-4 h-4" />
                    <span className="text-xs font-mono tracking-widest uppercase">Communauté</span>
                  </div>
                  <p className="text-sm text-white/80 font-light">"Publie un message ou explore les discussions"</p>
                </button>

                <button
                  onClick={() => handleSend("/image A futuristic cyberpunk workstation hologram 4k ultra-detailed")}
                  className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/30 transition-all group"
                >
                  <div className="flex items-center gap-3 text-purple-400 mb-1">
                    <ImageIcon className="w-4 h-4" />
                    <span className="text-xs font-mono tracking-widest uppercase">Génération d'images</span>
                  </div>
                  <p className="text-sm text-white/80 font-light">"/image Créer un visuel cyberpunk"</p>
                </button>
              </div>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] md:max-w-[78%] rounded-3xl p-5 md:p-6 relative group ${
                      msg.role === "user"
                        ? "bg-gradient-to-r from-indigo-600/30 to-purple-600/30 border border-indigo-500/30 text-white shadow-[0_0_25px_rgba(99,102,241,0.15)] rounded-tr-none"
                        : "bg-white/[0.04] border border-white/10 text-white/95 shadow-[inset_0_0_20px_rgba(255,255,255,0.02)] rounded-tl-none"
                    }`}
                  >
                    {msg.role === "assistant" && (
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center shadow-[0_0_10px_rgba(99,102,241,0.5)]">
                          <Sparkles className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-xs font-mono tracking-widest uppercase text-indigo-300">OMNI LIFE OS</span>
                        {msg.timestamp && (
                          <span className="text-[10px] font-mono text-white/30 ml-auto">{msg.timestamp}</span>
                        )}
                      </div>
                    )}

                    {msg.isImage && msg.imageUrl ? (
                      <div className="space-y-3">
                        <p className="text-sm opacity-90 font-light">{msg.content}</p>
                        <img
                          src={msg.imageUrl}
                          alt="Généré par Gemini"
                          className="rounded-2xl max-w-full h-auto shadow-2xl border border-white/10"
                        />
                      </div>
                    ) : (
                      <div className="markdown-body text-sm font-light leading-relaxed prose prose-invert max-w-none">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    )}

                    {/* Interactive Action Pill */}
                    {msg.action && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-4 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-indigo-500/10 p-4 rounded-2xl border border-indigo-500/20"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center border border-indigo-500/30">
                            <Zap className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-mono text-indigo-300 uppercase tracking-widest block">Action Prête</span>
                            <span className="text-sm font-medium text-white">{msg.action.title}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => executeAction(msg.action!)}
                          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-medium tracking-wide flex items-center gap-2 shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all hover:scale-105 active:scale-95 whitespace-nowrap w-full sm:w-auto justify-center"
                        >
                          <span>Exécuter l'action</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </motion.div>
                    )}

                    {msg.role === "user" && msg.timestamp && (
                      <div className="text-[10px] font-mono text-white/30 text-right mt-2">
                        {msg.timestamp}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}

          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="rounded-2xl px-5 py-3 bg-white/5 border border-white/10 flex items-center gap-3 text-indigo-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-xs font-mono tracking-widest uppercase">Life OS analyse et prépare la réponse...</span>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-black/70 border-t border-white/10 shrink-0 backdrop-blur-2xl">
          {/* Active Listening Indicator */}
          {isListening && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-2 px-3 py-1.5 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-mono flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                <span>Microphone actif : {speechInterim || "En écoute... parlez"}</span>
              </div>
              <button
                onClick={toggleListening}
                className="text-[10px] text-purple-200 hover:text-white uppercase font-bold"
              >
                Arrêter
              </button>
            </motion.div>
          )}

          <div className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="Commande Life OS ou parle au micro (ex: 'Lance mon focus')..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-6 pr-24 text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500/50 transition-colors shadow-inner font-light text-sm md:text-base"
              disabled={isTyping}
            />

            <div className="absolute right-2.5 flex items-center gap-1.5">
              {/* Mic Dictation Button */}
              <button
                type="button"
                onClick={toggleListening}
                title={isListening ? "Arrêter l'écoute" : "Commande vocale (Micro)"}
                className={`p-3 rounded-xl border transition-all ${
                  isListening
                    ? "bg-purple-600 border-purple-400 text-white animate-pulse shadow-[0_0_20px_rgba(168,85,247,0.5)]"
                    : "bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10"
                }`}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isTyping}
                className="p-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500 disabled:opacity-30 transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)]"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between mt-2.5 px-2 text-[11px] font-mono text-white/30">
            <span>Clique sur le micro 🎙️ pour tester tes commandes vocales personnalisées</span>
            <span className="hidden sm:inline">Entrée pour envoyer</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
