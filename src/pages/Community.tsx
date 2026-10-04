import { useState, useEffect } from "react";
import { 
  Users, 
  ShieldCheck, 
  MessageSquarePlus, 
  Search, 
  Network, 
  Heart, 
  MessageCircle, 
  Share2, 
  X, 
  Send,
  Trash2,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { vibrate } from "../lib/utils";
import { sound } from "../lib/sound";
import { useAuth } from "../context/AuthContext";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  increment 
} from "firebase/firestore";
import { useLocation } from "react-router-dom";

interface Post {
  id: string;
  authorId: string;
  author: string;
  avatar: string;
  title: string;
  content: string;
  likes: number;
  comments: number;
  tag: string;
  createdAt: string;
}

export function Community() {
  const { user, signInWithGoogle, updateScore } = useAuth();
  const location = useLocation();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newTag, setNewTag] = useState("Général");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");

  useEffect(() => {
    if (location.state?.openModal) {
      setIsCreating(true);
    }
  }, [location.state]);

  // Firestore Real-time synchronization
  useEffect(() => {
    const q = query(collection(db, "community_posts"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loaded: Post[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        loaded.push({
          id: d.id,
          authorId: data.authorId || "anonymous",
          author: data.author || "Membre OMNI",
          avatar: data.avatar || "https://api.dicebear.com/7.x/bottts/svg?seed=Omni",
          title: data.title || "",
          content: data.content || "",
          likes: data.likes || 0,
          comments: data.comments || 0,
          tag: data.tag || "Général",
          createdAt: data.createdAt || new Date().toISOString()
        });
      });
      setPosts(loaded);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "community_posts");
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleCreatePost = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    vibrate(40);

    const postData: Omit<Post, "id"> = {
      authorId: user ? user.uid : "anon-" + Date.now(),
      author: user?.displayName || "Agent OMNI",
      avatar: user?.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.uid || Date.now()}`,
      title: newTitle.trim(),
      content: newContent.trim(),
      likes: 0,
      comments: 0,
      tag: newTag,
      createdAt: new Date().toISOString()
    };

    try {
      if (user) {
        await addDoc(collection(db, "community_posts"), postData);
        updateScore(5);
      } else {
        const localPost: Post = { id: Date.now().toString(), ...postData };
        setPosts([localPost, ...posts]);
        updateScore(5);
      }
      sound.playComplete();
      setIsCreating(false);
      setNewTitle("");
      setNewContent("");
      setNewTag("Général");
    } catch (e) {
      console.warn("Could not save to Firestore:", e);
      const localPost: Post = { id: Date.now().toString(), ...postData };
      setPosts([localPost, ...posts]);
      updateScore(5);
      sound.playComplete();
      setIsCreating(false);
    }
  };

  const handleLike = async (postId: string) => {
    vibrate(20);
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: p.likes + 1 } : p));
    if (user && !postId.startsWith("seed-")) {
      try {
        await updateDoc(doc(db, "community_posts", postId), {
          likes: increment(1)
        });
      } catch (err) {
        console.warn("Like update failed:", err);
      }
    }
  };

  const handleDelete = async (postId: string) => {
    vibrate(40);
    setPosts(prev => prev.filter(p => p.id !== postId));
    if (user && !postId.startsWith("seed-")) {
      try {
        await deleteDoc(doc(db, "community_posts", postId));
      } catch (err) {
        console.warn("Delete failed:", err);
      }
    }
  };

  const handleAddComment = (postId: string) => {
    if (!commentText.trim()) return;
    vibrate(30);
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: p.comments + 1 } : p));
    setCommentText("");
    setActiveCommentPostId(null);
  };

  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.tag.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-6xl mx-auto space-y-8 pb-24 md:pb-0 h-full flex flex-col relative"
    >
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 shrink-0">
        <div>
          <div className="flex items-center gap-3 text-orange-400 mb-2">
            <Network className="w-5 h-5" />
            <span className="font-mono text-sm tracking-widest uppercase">Global Network OMNI</span>
          </div>
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-4xl md:text-5xl font-light tracking-tight text-white/90">Communauté</h1>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-mono tracking-widest uppercase">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Modéré par Gemini</span>
            </div>
          </div>
          <p className="text-white/50 text-lg font-light">Espace d'échange, d'entraide et de partage entre membres.</p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un sujet..." 
              className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-orange-500/50 transition-colors backdrop-blur-xl font-light"
            />
          </div>
          <button 
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)] text-sm font-medium tracking-wide shrink-0 text-white"
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>Nouveau Sujet</span>
          </button>
        </div>
      </header>

      <div className="flex-1 rounded-3xl bg-black/40 border border-white/10 p-4 md:p-8 backdrop-blur-xl overflow-y-auto relative shadow-[inset_0_0_40px_rgba(255,255,255,0.02)] custom-scrollbar">
        {filteredPosts.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center h-full relative">
            <div className="w-24 h-24 rounded-full bg-orange-500/10 flex items-center justify-center mb-6 border border-orange-500/20">
              <Users className="w-10 h-10 text-orange-400" />
            </div>
            <h2 className="text-2xl font-light tracking-tight mb-2 text-white/90">Aucun sujet trouvé</h2>
            <p className="text-white/50 max-w-md mx-auto mb-8 font-light text-sm">
              {searchQuery ? "Ajuste tes critères de recherche." : "Sois le premier à lancer une discussion dans la communauté !"}
            </p>
            <button 
              onClick={() => setIsCreating(true)}
              className="px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 text-white text-sm font-medium flex items-center gap-2"
            >
              <MessageSquarePlus className="w-4 h-4" />
              Créer le premier sujet
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 max-w-4xl mx-auto">
            {filteredPosts.map((post) => (
              <motion.div 
                key={post.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl bg-white/[0.03] border border-white/10 p-6 hover:bg-white/[0.06] hover:border-orange-500/30 transition-all group shadow-[inset_0_0_20px_rgba(255,255,255,0.01)]"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <img src={post.avatar} alt={post.author} className="w-10 h-10 rounded-xl bg-black border border-white/10 object-cover" />
                    <div>
                      <h3 className="text-sm font-medium text-white/95">{post.author}</h3>
                      <p className="text-xs font-mono text-white/40">
                        {new Date(post.createdAt).toLocaleDateString([], { day: "numeric", month: "short" })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 text-xs font-mono tracking-widest uppercase">
                      {post.tag}
                    </span>
                    {user && user.uid === post.authorId && (
                      <button 
                        onClick={() => handleDelete(post.id)}
                        className="p-1.5 text-white/30 hover:text-red-400 transition-colors"
                        title="Supprimer mon sujet"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                
                <h4 className="text-lg font-medium text-white/95 mb-2">{post.title}</h4>
                <p className="text-white/60 font-light leading-relaxed mb-6 text-sm">
                  {post.content}
                </p>
                
                <div className="flex items-center gap-6 border-t border-white/10 pt-4">
                  <button 
                    onClick={() => handleLike(post.id)}
                    className="flex items-center gap-2 text-white/50 hover:text-orange-400 transition-colors group/btn"
                  >
                    <Heart className="w-4 h-4 group-hover/btn:fill-orange-400/20" />
                    <span className="text-xs font-mono">{post.likes}</span>
                  </button>
                  <button 
                    onClick={() => setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id)}
                    className="flex items-center gap-2 text-white/50 hover:text-blue-400 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-xs font-mono">{post.comments} commentaires</span>
                  </button>
                </div>

                {/* Inline Comment Box */}
                {activeCommentPostId === post.id && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddComment(post.id)}
                      placeholder="Ajouter une réponse constructive..."
                      className="flex-1 bg-black/60 border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-orange-500/50"
                      autoFocus
                    />
                    <button
                      onClick={() => handleAddComment(post.id)}
                      disabled={!commentText.trim()}
                      className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-medium disabled:opacity-40"
                    >
                      Envoyer
                    </button>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create Post Modal */}
      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl bg-[#0d0d12] border border-orange-500/30 rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400">
                    <MessageSquarePlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-medium text-white">Nouveau Sujet de Discussion</h2>
                    <p className="text-xs text-white/40">Partage avec le réseau OMNI</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsCreating(false)}
                  className="p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-xs font-mono tracking-widest text-white/50 uppercase mb-2">Titre du sujet</label>
                  <input 
                    type="text" 
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Ex: Comment optimiser son temps avec Gemini ?"
                    className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-white/30 focus:outline-none focus:border-orange-500/50 transition-colors font-light text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-mono tracking-widest text-white/50 uppercase mb-2">Catégorie</label>
                  <select 
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-orange-500/50 transition-colors font-light appearance-none text-sm"
                  >
                    <option value="Général">Général</option>
                    <option value="Productivité">Productivité & Focus</option>
                    <option value="Finance">Finance & Academy</option>
                    <option value="Compétences">Compétences & Side Hustles</option>
                    <option value="Feedback">Feedback & Suggestions</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-mono tracking-widest text-white/50 uppercase mb-2">Message</label>
                  <textarea 
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Exprime tes pensées, pose une question ou partage une victoire..."
                    rows={5}
                    className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-white/30 focus:outline-none focus:border-orange-500/50 transition-colors font-light resize-none text-sm"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10 bg-white/[0.02]">
                <button 
                  onClick={() => setIsCreating(false)}
                  className="px-5 py-2.5 rounded-xl hover:bg-white/10 text-white/70 transition-colors text-xs font-medium"
                >
                  Annuler
                </button>
                <button 
                  onClick={handleCreatePost}
                  disabled={!newTitle.trim() || !newContent.trim()}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 disabled:opacity-40 transition-all text-xs font-medium text-white shadow-[0_0_15px_rgba(249,115,22,0.3)]"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Publier le sujet</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
