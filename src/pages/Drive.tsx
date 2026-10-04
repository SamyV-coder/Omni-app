import React, { useState, useEffect } from "react";
import { 
  FolderGit2, 
  FileText, 
  Upload, 
  ExternalLink, 
  RefreshCw, 
  Lock, 
  Plus, 
  FileCode, 
  FileCheck, 
  HardDrive, 
  Clock,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../context/AuthContext";
import { fetchDriveFiles, createDriveFile, DriveFile } from "../lib/workspace";
import { sound } from "../lib/sound";
import { vibrate } from "../lib/utils";

export function Drive() {
  const { user, accessToken, signInWithGoogle } = useAuth();
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New File State
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [newFileContent, setNewFileContent] = useState("");
  const [creating, setCreating] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);

  useEffect(() => {
    if (accessToken) {
      loadFiles();
    }
  }, [accessToken]);

  const loadFiles = async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDriveFiles(accessToken, 20);
      setFiles(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Impossible de charger les fichiers Drive");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !newFileName.trim()) return;

    setCreating(true);
    setError(null);
    vibrate(20);

    try {
      const finalName = newFileName.endsWith(".txt") ? newFileName : `${newFileName}.txt`;
      await createDriveFile(accessToken, finalName, newFileContent);
      setCreateSuccess(true);
      sound.playNotification();

      setTimeout(() => {
        setCreateSuccess(false);
        setIsCreating(false);
        setNewFileName("");
        setNewFileContent("");
      }, 1500);

      loadFiles();
    } catch (err: any) {
      setError(err.message || "Erreur de création de fichier");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-amber-200 to-amber-400 bg-clip-text text-transparent">
              OMNI Drive (Google Drive)
            </h1>
            <p className="text-xs font-mono text-white/40 tracking-wider">
              STOCKAGE CLOUD DÉCENTRALISÉ & ACCÈS FICHIERS SÉCURISÉ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {accessToken ? (
            <>
              <button
                onClick={loadFiles}
                disabled={loading}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-all"
                title="Actualiser"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-amber-400" : ""}`} />
              </button>
              <button
                onClick={() => setIsCreating(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white text-xs font-mono tracking-wider shadow-lg shadow-amber-600/30 transition-all"
              >
                <Plus className="w-4 h-4" />
                Nouveau Document
              </button>
            </>
          ) : (
            <button
              onClick={() => signInWithGoogle()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black font-semibold text-xs hover:bg-white/90 transition-all shadow-lg"
            >
              <HardDrive className="w-4 h-4 text-amber-600" />
              Connecter Google Drive
            </button>
          )}
        </div>
      </div>

      {/* Main Drive View */}
      {!accessToken ? (
        <div className="p-12 rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-6">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Authentification Requise</h2>
          <p className="text-sm text-white/60 max-w-md font-mono mb-8">
            Connectez votre compte Google pour explorer vos fichiers Google Drive, créer des notes et synchroniser vos documents.
          </p>
          <button
            onClick={() => signInWithGoogle()}
            className="flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-white hover:bg-white/90 text-black font-semibold text-sm transition-all shadow-xl hover:scale-105"
          >
            <HardDrive className="w-5 h-5 text-amber-600" />
            Sign in with Google
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {error && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Files Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {files.map((file) => (
              <div
                key={file.id}
                onClick={() => {
                  if (file.webViewLink) window.open(file.webViewLink, "_blank");
                }}
                className="p-5 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-amber-500/30 transition-all cursor-pointer group flex flex-col justify-between min-h-[140px]"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
                      <FileText className="w-5 h-5" />
                    </div>
                    {file.webViewLink && (
                      <ExternalLink className="w-4 h-4 text-white/30 group-hover:text-white/80 transition-colors" />
                    )}
                  </div>
                  <h4 className="text-xs font-semibold text-white/90 truncate group-hover:text-amber-300 transition-colors">
                    {file.name}
                  </h4>
                  <p className="text-[10px] font-mono text-white/40 mt-1 truncate">
                    {file.mimeType.split(".").pop() || "Document"}
                  </p>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-white/40">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString() : ""}
                  </span>
                  <span>Drive</span>
                </div>
              </div>
            ))}
          </div>

          {files.length === 0 && !loading && (
            <div className="p-12 rounded-3xl border border-white/5 bg-black/40 text-center flex flex-col items-center">
              <FileCheck className="w-12 h-12 text-white/20 mb-3" />
              <p className="text-xs font-mono text-white/40">Aucun fichier trouvé sur votre Google Drive.</p>
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {isCreating && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-[#0e0e11] border border-white/10 rounded-3xl p-6 shadow-2xl relative"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-amber-400" />
                  Créer un document Google Drive
                </h3>
                <button
                  onClick={() => setIsCreating(false)}
                  className="text-white/40 hover:text-white text-sm"
                >
                  ✕
                </button>
              </div>

              {createSuccess ? (
                <div className="py-12 flex flex-col items-center text-center">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-2 animate-bounce" />
                  <p className="text-sm font-medium text-white">Document créé dans Google Drive !</p>
                </div>
              ) : (
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-mono text-white/50 mb-1">Nom du fichier</label>
                    <input
                      type="text"
                      required
                      value={newFileName}
                      onChange={(e) => setNewFileName(e.target.value)}
                      placeholder="Note-OMNI-2026.txt"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-white/50 mb-1">Contenu texte</label>
                    <textarea
                      rows={6}
                      required
                      value={newFileContent}
                      onChange={(e) => setNewFileContent(e.target.value)}
                      placeholder="Tapez le contenu de votre note ou document..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500 resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsCreating(false)}
                      className="px-4 py-2.5 rounded-xl bg-white/5 text-white/70 hover:text-white text-xs font-mono"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={creating}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 text-white font-medium text-xs shadow-lg shadow-amber-600/30 hover:scale-105 transition-all disabled:opacity-50"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      {creating ? "Enregistrement..." : "Créer sur Drive"}
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
