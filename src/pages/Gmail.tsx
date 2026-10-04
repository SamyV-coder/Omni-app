import React, { useState, useEffect } from "react";
import { 
  Mail, 
  Send, 
  Inbox, 
  RefreshCw, 
  Star, 
  Tag, 
  Lock, 
  ExternalLink, 
  PenSquare, 
  AlertCircle,
  CheckCircle2,
  Calendar,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../context/AuthContext";
import { fetchGmailMessages, sendGmailMessage, GmailMessage } from "../lib/workspace";
import { vibrate } from "../lib/utils";
import { sound } from "../lib/sound";

export function Gmail() {
  const { user, accessToken, signInWithGoogle } = useAuth();
  const [messages, setMessages] = useState<GmailMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<GmailMessage | null>(null);

  // Compose State
  const [isComposing, setIsComposing] = useState(false);
  const [toInput, setToInput] = useState("");
  const [subjectInput, setSubjectInput] = useState("");
  const [bodyInput, setBodyInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  useEffect(() => {
    if (accessToken) {
      loadMessages();
    }
  }, [accessToken]);

  const loadMessages = async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchGmailMessages(accessToken, 12);
      setMessages(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erreur de chargement Gmail");
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !toInput.trim() || !subjectInput.trim()) return;

    setSending(true);
    setError(null);
    vibrate(20);

    try {
      await sendGmailMessage(accessToken, toInput, subjectInput, bodyInput);
      setSendSuccess(true);
      sound.playNotification();
      setTimeout(() => {
        setSendSuccess(false);
        setIsComposing(false);
        setToInput("");
        setSubjectInput("");
        setBodyInput("");
      }, 1500);
      loadMessages();
    } catch (err: any) {
      setError(err.message || "Échec de l'envoi");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-rose-200 to-rose-400 bg-clip-text text-transparent">
              OMNI Mail (Gmail)
            </h1>
            <p className="text-xs font-mono text-white/40 tracking-wider">
              BOÎTE DE RÉCEPTION CONNECTÉE & EXPÉDITION SÉCURISÉE
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {accessToken ? (
            <>
              <button
                onClick={loadMessages}
                disabled={loading}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-all"
                title="Actualiser"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-rose-400" : ""}`} />
              </button>
              <button
                onClick={() => setIsComposing(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-mono tracking-wider shadow-lg shadow-rose-600/30 transition-all"
              >
                <PenSquare className="w-4 h-4" />
                Nouveau Message
              </button>
            </>
          ) : (
            <button
              onClick={() => signInWithGoogle()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black font-semibold text-xs hover:bg-white/90 transition-all shadow-lg"
            >
              <Mail className="w-4 h-4 text-rose-600" />
              Connecter Gmail
            </button>
          )}
        </div>
      </div>

      {/* Main Container */}
      {!accessToken ? (
        <div className="p-12 rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-6">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Authentification Requise</h2>
          <p className="text-sm text-white/60 max-w-md font-mono mb-8">
            Connectez votre compte Google pour synchroniser vos e-mails Gmail en temps réel avec token chiffré en mémoire.
          </p>
          <button
            onClick={() => signInWithGoogle()}
            className="flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-white hover:bg-white/90 text-black font-semibold text-sm transition-all shadow-xl hover:scale-105"
          >
            <Mail className="w-5 h-5 text-rose-600" />
            Sign in with Google
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Messages List */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between px-2 text-xs font-mono text-white/40">
              <span className="flex items-center gap-1.5">
                <Inbox className="w-3.5 h-3.5" /> Boîte de Réception ({messages.length})
              </span>
              {loading && <span className="text-rose-400 animate-pulse">Synchronisation...</span>}
            </div>

            {error && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {messages.length === 0 && !loading && (
                <div className="p-8 rounded-2xl border border-white/5 bg-white/[0.02] text-center text-xs font-mono text-white/40">
                  Aucun message trouvé ou boîte vide.
                </div>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  onClick={() => {
                    setSelectedMessage(msg);
                    sound.playClick();
                    vibrate(15);
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    selectedMessage?.id === msg.id
                      ? "bg-rose-500/10 border-rose-500/40 shadow-lg"
                      : "bg-white/[0.02] hover:bg-white/[0.05] border-white/5"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-white/90 truncate max-w-[200px]">
                      {msg.from.split("<")[0]}
                    </span>
                    <span className="text-[10px] font-mono text-white/40">
                      {msg.date ? new Date(msg.date).toLocaleDateString() : ""}
                    </span>
                  </div>
                  <h4 className="text-xs font-medium text-white mb-1 truncate">{msg.subject}</h4>
                  <p className="text-[11px] text-white/50 line-clamp-2 leading-relaxed">
                    {msg.snippet}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Message Viewer / Empty State */}
          <div className="lg:col-span-7 rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl p-6 min-h-[450px] flex flex-col">
            {selectedMessage ? (
              <div className="flex-1 flex flex-col">
                <div className="pb-4 border-b border-white/10 mb-4">
                  <h3 className="text-lg font-bold text-white mb-2">{selectedMessage.subject}</h3>
                  <div className="flex items-center justify-between text-xs font-mono text-white/60">
                    <span>De : <strong className="text-white">{selectedMessage.from}</strong></span>
                    <span>{selectedMessage.date}</span>
                  </div>
                </div>
                <div className="flex-1 bg-white/[0.02] p-5 rounded-2xl border border-white/5 text-sm text-white/80 leading-relaxed font-sans whitespace-pre-line">
                  {selectedMessage.snippet}
                </div>
                <div className="mt-4 pt-4 border-t border-white/10 flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setToInput(selectedMessage.from.match(/<([^>]+)>/)?.[1] || selectedMessage.from);
                      setSubjectInput(`Re: ${selectedMessage.subject}`);
                      setIsComposing(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-mono"
                  >
                    Répondre
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <Mail className="w-12 h-12 text-white/20 mb-3" />
                <h3 className="text-sm font-semibold text-white/60 mb-1">Sélectionnez un e-mail</h3>
                <p className="text-xs text-white/40 font-mono">
                  Cliquez sur un message dans la liste pour afficher son contenu complet.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Compose Modal */}
      <AnimatePresence>
        {isComposing && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-[#0e0e11] border border-white/10 rounded-3xl p-6 shadow-2xl relative"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <PenSquare className="w-4 h-4 text-rose-400" />
                  Nouveau Message Gmail
                </h3>
                <button
                  onClick={() => setIsComposing(false)}
                  className="text-white/40 hover:text-white text-sm"
                >
                  ✕
                </button>
              </div>

              {sendSuccess ? (
                <div className="py-12 flex flex-col items-center text-center">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-2 animate-bounce" />
                  <p className="text-sm font-medium text-white">E-mail envoyé avec succès !</p>
                </div>
              ) : (
                <form onSubmit={handleSend} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-mono text-white/50 mb-1">Destinataire</label>
                    <input
                      type="email"
                      required
                      value={toInput}
                      onChange={(e) => setToInput(e.target.value)}
                      placeholder="contact@exemple.com"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-white/50 mb-1">Sujet</label>
                    <input
                      type="text"
                      required
                      value={subjectInput}
                      onChange={(e) => setSubjectInput(e.target.value)}
                      placeholder="Objet de votre e-mail"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-white/50 mb-1">Message</label>
                    <textarea
                      rows={5}
                      required
                      value={bodyInput}
                      onChange={(e) => setBodyInput(e.target.value)}
                      placeholder="Écrivez votre message..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-rose-500 resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsComposing(false)}
                      className="px-4 py-2.5 rounded-xl bg-white/5 text-white/70 hover:text-white text-xs font-mono"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={sending}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 text-white font-medium text-xs shadow-lg shadow-rose-600/30 hover:scale-105 transition-all disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {sending ? "Envoi..." : "Envoyer"}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
