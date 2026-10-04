import { useState, useEffect } from "react";
import { 
  Briefcase, 
  ArrowRight, 
  HandHeart, 
  Search, 
  Filter, 
  Palette, 
  Code, 
  PenTool, 
  Wrench, 
  Megaphone, 
  LayoutGrid,
  Zap,
  Sparkles,
  Check,
  X,
  Star,
  Pin,
  Clock,
  User,
  Plus,
  Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn, vibrate } from "../lib/utils";
import { sound } from "../lib/sound";
import { useAuth } from "../context/AuthContext";
import { usePreferences } from "../context/PreferencesContext";

export interface ServiceListing {
  id: string;
  title: string;
  category: "design" | "tech" | "writing" | "marketing" | "everyday";
  description: string;
  authorName: string;
  authorAvatar?: string;
  price: string;
  rating: number;
  reviewsCount: number;
  isSponsored: boolean;
  isOwner?: boolean;
  type: "offer" | "request";
  createdAt: string;
}

// Initialement vide ou uniquement les vraies annonces créées par l'utilisateur
const INITIAL_SERVICES: ServiceListing[] = [];

const CATEGORIES = [
  { id: "all", label: "Tout explorer", icon: LayoutGrid },
  { id: "design", label: "Design & Création", icon: Palette },
  { id: "tech", label: "Tech & Dev", icon: Code },
  { id: "writing", label: "Rédaction", icon: PenTool },
  { id: "marketing", label: "Marketing", icon: Megaphone },
  { id: "everyday", label: "Aide quotidienne", icon: Wrench },
];

const TABS = [
  { id: "explore", label: "Marketplace" },
  { id: "my-offers", label: "Mes Services" },
  { id: "my-requests", label: "Mes Demandes" },
];

const BOOST_PLANS = [
  { id: "boost-24h", duration: "24 Heures", price: "2.99 €", badge: "Flash", highlight: false },
  { id: "boost-7d", duration: "7 Jours", price: "7.99 €", badge: "Le plus populaire", highlight: true },
  { id: "boost-30d", duration: "30 Jours", price: "19.99 €", badge: "Visibilité Max", highlight: false },
];

export function Service() {
  const { user } = useAuth();
  const { getCurrencySymbol } = usePreferences();
  const currencySym = getCurrencySymbol();

  const [activeTab, setActiveTab] = useState("explore");
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Services local state (purge les faux profils démo Alexandre et Sarah)
  const [services, setServices] = useState<ServiceListing[]>(() => {
    try {
      const saved = localStorage.getItem("omni_marketplace_services");
      if (saved) {
        const parsed: ServiceListing[] = JSON.parse(saved);
        // Filtrer strictement les faux profils de démo
        const cleaned = parsed.filter(
          (s) => !["Alexandre V.", "Sarah K.", "Marc L.", "Elena R."].includes(s.authorName) &&
                 !["srv-1", "srv-2", "srv-4", "srv-5"].includes(s.id)
        );
        localStorage.setItem("omni_marketplace_services", JSON.stringify(cleaned));
        return cleaned;
      }
      return INITIAL_SERVICES;
    } catch {
      return INITIAL_SERVICES;
    }
  });

  const handleDeleteService = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    vibrate(20);
    sound.playClick();
    const updated = services.filter((s) => s.id !== id);
    saveServices(updated);
  };

  // Modal Boost
  const [selectedServiceToBoost, setSelectedServiceToBoost] = useState<ServiceListing | null>(null);
  const [selectedPlan, setSelectedPlan] = useState("boost-7d");
  const [boostSuccess, setBoostSuccess] = useState(false);

  // Modal Nouvelle Annonce
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<any>("tech");
  const [newPrice, setNewPrice] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newType, setNewType] = useState<"offer" | "request">("offer");

  const saveServices = (updated: ServiceListing[]) => {
    setServices(updated);
    try {
      localStorage.setItem("omni_marketplace_services", JSON.stringify(updated));
    } catch (e) {
      console.warn("Storage error", e);
    }
  };

  const handleOpenBoost = (service: ServiceListing) => {
    vibrate(20);
    sound.playClick();
    setSelectedServiceToBoost(service);
    setBoostSuccess(false);
  };

  const handleConfirmBoost = () => {
    if (!selectedServiceToBoost) return;
    vibrate([40, 60, 40]);
    sound.playSuccess();
    
    // Épingler en haut et marquer Sponsorisé
    const updated = services.map(s => {
      if (s.id === selectedServiceToBoost.id) {
        return { ...s, isSponsored: true };
      }
      return s;
    });

    // Remettre les sponsorisés tout en haut
    const sorted = [...updated].sort((a, b) => {
      if (a.isSponsored && !b.isSponsored) return -1;
      if (!a.isSponsored && b.isSponsored) return 1;
      return 0;
    });

    saveServices(sorted);
    setBoostSuccess(true);
    setTimeout(() => {
      setSelectedServiceToBoost(null);
      setBoostSuccess(false);
    }, 1800);
  };

  const handleCreateService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    vibrate(30);
    sound.playSuccess();

    const created: ServiceListing = {
      id: `srv-${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      description: newDesc.trim() || "Service de qualité proposé par un membre certifié OMNI.",
      authorName: user?.displayName || "Toi (Agent OMNI)",
      authorAvatar: user?.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.uid || "OMNI"}`,
      price: newPrice.trim() ? `${newPrice.trim()} ${currencySym}` : "Sur devis",
      rating: 5.0,
      reviewsCount: 1,
      isSponsored: false,
      isOwner: true,
      type: newType,
      createdAt: "À l'instant"
    };

    saveServices([created, ...services]);
    setNewTitle("");
    setNewPrice("");
    setNewDesc("");
    setIsCreateModalOpen(false);
  };

  const filteredServices = services.filter(s => {
    if (activeTab === "my-offers" && (!s.isOwner || s.type !== "offer")) return false;
    if (activeTab === "my-requests" && (!s.isOwner || s.type !== "request")) return false;
    if (activeCategory !== "all" && s.category !== activeCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-6xl mx-auto space-y-8 pb-24 md:pb-10"
    >
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono uppercase bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full border border-indigo-500/20 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              100% Gratuit & Ouvert
            </span>
          </div>
          <h1 className="text-4xl font-light tracking-tight text-white/90">Marché de Services</h1>
          <p className="text-white/50 text-base mt-1">Publie, trouve de l'aide et développe ton réseau sans aucune commission obligatoire.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            onClick={() => {
              vibrate(20);
              sound.playClick();
              setNewType("request");
              setIsCreateModalOpen(true);
            }}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-all text-sm font-medium tracking-wide"
          >
            <HandHeart className="w-4 h-4 text-emerald-400" />
            <span>Demander</span>
          </button>
          <button 
            onClick={() => {
              vibrate(20);
              sound.playClick();
              setNewType("offer");
              setIsCreateModalOpen(true);
            }}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)] text-sm font-medium tracking-wide"
          >
            <Plus className="w-4 h-4" />
            <span>Proposer</span>
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-px overflow-x-auto hide-scrollbar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              vibrate(15);
              sound.playClick();
              setActiveTab(tab.id);
            }}
            className={cn(
              "px-6 py-3 text-sm font-medium tracking-wide transition-colors relative whitespace-nowrap",
              activeTab === tab.id ? "text-white" : "text-white/40 hover:text-white/70"
            )}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500"
              />
            )}
          </button>
        ))}
      </div>

      {/* Search & Categories */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un service, une compétence, une annonce..." 
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500/50 transition-colors text-sm"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex items-center gap-3 overflow-x-auto hide-scrollbar pb-2">
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => {
                vibrate(15);
                sound.playClick();
                setActiveCategory(category.id);
              }}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl border transition-all whitespace-nowrap",
                activeCategory === category.id
                  ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-300"
                  : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white"
              )}
            >
              <category.icon className="w-4 h-4" />
              <span className="text-sm font-medium">{category.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Listings Grid */}
      {filteredServices.length === 0 ? (
        <div className="rounded-3xl bg-white/5 border border-white/10 p-8 md:p-12 backdrop-blur-md flex flex-col items-center justify-center text-center min-h-[340px]">
          <div className="w-20 h-20 rounded-full bg-indigo-500/10 flex items-center justify-center mb-4 border border-indigo-500/20">
            <Briefcase className="w-8 h-8 text-indigo-400" />
          </div>
          <h2 className="text-xl font-medium tracking-wide mb-2">Aucune annonce trouvée</h2>
          <p className="text-white/40 max-w-sm mb-6 text-sm">
            Sois le premier à publier dans cette catégorie. La publication est 100% libre et gratuite.
          </p>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium flex items-center gap-2"
          >
            <span>Créer une annonce</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <motion.div
              key={service.id}
              layout
              className={cn(
                "rounded-3xl p-6 backdrop-blur-xl border transition-all flex flex-col justify-between relative overflow-hidden group",
                service.isSponsored 
                  ? "bg-gradient-to-b from-indigo-950/40 via-black/60 to-black/80 border-indigo-500/40 shadow-[0_0_30px_rgba(99,102,241,0.15)] ring-1 ring-indigo-500/30"
                  : "bg-black/40 border-white/10 hover:border-white/20"
              )}
            >
              {/* Header card with Sponsored badge */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  {service.isSponsored ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-medium tracking-wide bg-gradient-to-r from-amber-500/20 to-indigo-500/20 text-amber-300 border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                      <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
                      <span>Sponsorisé • En vedette</span>
                    </span>
                  ) : (
                    <span className="text-[11px] font-mono text-white/40 uppercase tracking-wider">
                      {service.type === "offer" ? "Offre" : "Demande"}
                    </span>
                  )}

                  <span className="text-xs font-mono text-white/40 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {service.createdAt}
                  </span>
                </div>

                <h3 className="text-lg font-medium text-white/90 group-hover:text-white transition-colors mb-2 line-clamp-2">
                  {service.title}
                </h3>
                
                <p className="text-white/50 text-xs leading-relaxed line-clamp-3 mb-6">
                  {service.description}
                </p>
              </div>

              {/* Footer card */}
              <div className="pt-4 border-t border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img 
                      src={service.authorAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${service.authorName}`} 
                      alt={service.authorName} 
                      className="w-7 h-7 rounded-lg bg-black border border-white/10 object-cover"
                    />
                    <div>
                      <p className="text-xs text-white/80 font-medium truncate max-w-[120px]">{service.authorName}</p>
                      <div className="flex items-center gap-1 text-[10px] text-amber-400 font-mono">
                        <Star className="w-3 h-3 fill-amber-400" />
                        <span>{service.rating}</span>
                        <span className="text-white/40">({service.reviewsCount})</span>
                      </div>
                    </div>
                  </div>

                  <span className="text-base font-mono font-medium text-emerald-400">
                    {service.price}
                  </span>
                </div>

                {/* Actions: Contact or Boost / Delete if owner */}
                <div className="flex items-center gap-2">
                  {service.isOwner ? (
                    <>
                      <button
                        onClick={() => handleOpenBoost(service)}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-indigo-500/20 hover:from-amber-500/30 hover:to-indigo-500/30 border border-amber-500/40 text-amber-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-all shadow-[0_0_15px_rgba(245,158,11,0.15)] group/btn"
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-400 group-hover/btn:scale-110 transition-transform" />
                        <span>{service.isSponsored ? "Boosté" : "Boost"}</span>
                      </button>
                      <button
                        onClick={(e) => handleDeleteService(service.id, e)}
                        title="Supprimer mon annonce"
                        className="p-2.5 rounded-xl bg-white/5 hover:bg-rose-500/20 text-white/40 hover:text-rose-400 border border-white/10 hover:border-rose-500/30 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        vibrate(15);
                        sound.playClick();
                        alert(`Contacter ${service.authorName} pour le service : "${service.title}"`);
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white text-xs font-medium transition-all flex items-center justify-center gap-1.5"
                    >
                      <User className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Contacter</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* MODAL BOOST ANNONCE */}
      <AnimatePresence>
        {selectedServiceToBoost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-3xl bg-[#0c0c12] border border-amber-500/30 p-6 md:p-8 relative shadow-[0_0_50px_rgba(245,158,11,0.2)]"
            >
              <button
                onClick={() => setSelectedServiceToBoost(null)}
                className="absolute top-5 right-5 p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <Zap className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xl font-medium text-white">Mettre en avant ton annonce</h3>
                  <p className="text-xs text-white/50">Multiplie tes contacts et ta visibilité jusqu'à x5</p>
                </div>
              </div>

              {boostSuccess ? (
                <div className="py-10 text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                    <Check className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-medium text-white">Annonce propulsée avec succès !</h4>
                  <p className="text-xs text-white/60">
                    Ton annonce apparaît désormais épinglée en haut de la Marketplace avec le badge <strong className="text-amber-300">Sponsorisé</strong>.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                    <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest block mb-1">Annonce ciblée :</span>
                    <p className="text-sm font-medium text-white truncate">{selectedServiceToBoost.title}</p>
                  </div>

                  {/* Avantages */}
                  <div className="grid grid-cols-3 gap-3 text-center text-xs">
                    <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                      <Pin className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                      <span className="text-white/80 font-medium">Top du fil</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                      <Sparkles className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                      <span className="text-white/80 font-medium">Badge Doré</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                      <Star className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                      <span className="text-white/80 font-medium">+300% Clics</span>
                    </div>
                  </div>

                  {/* Choix des formules */}
                  <div className="space-y-3">
                    <label className="text-xs font-mono text-white/60 uppercase tracking-wider block">Choisis ta formule :</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {BOOST_PLANS.map((plan) => (
                        <div
                          key={plan.id}
                          onClick={() => {
                            vibrate(15);
                            sound.playClick();
                            setSelectedPlan(plan.id);
                          }}
                          className={cn(
                            "p-3.5 rounded-2xl border text-center cursor-pointer transition-all relative flex flex-col justify-between",
                            selectedPlan === plan.id
                              ? "bg-amber-500/15 border-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.25)]"
                              : "bg-white/5 border-white/10 text-white/70 hover:border-white/20"
                          )}
                        >
                          {plan.highlight && (
                            <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[9px] font-mono uppercase bg-amber-500 text-black font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                              {plan.badge}
                            </span>
                          )}
                          <p className="text-xs font-medium mt-1">{plan.duration}</p>
                          <p className="text-base font-mono font-bold text-amber-300 mt-2">{plan.price}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Notice non-intrusive */}
                  <p className="text-[11px] text-white/40 leading-relaxed text-center">
                    💡 La publication standard reste gratuite pour tous. Ce boost optionnel finance l'hébergement serveur et les serveurs OMNI.
                  </p>

                  <button
                    onClick={handleConfirmBoost}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-black font-semibold text-sm flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(245,158,11,0.3)] transition-all"
                  >
                    <Zap className="w-4 h-4 fill-black" />
                    <span>Activer la mise en avant maintenant</span>
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL CRÉER UNE ANNONCE */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-3xl bg-[#0c0c12] border border-white/15 p-6 md:p-8 relative shadow-2xl"
            >
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="absolute top-5 right-5 p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-6">
                <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest">Publication Gratuite</span>
                <h3 className="text-2xl font-light text-white mt-1">
                  {newType === "offer" ? "Proposer un service" : "Déposer une demande"}
                </h3>
              </div>

              <form onSubmit={handleCreateService} className="space-y-4">
                <div>
                  <label className="text-xs font-mono text-white/60 uppercase block mb-1.5">Titre de l'annonce</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Création de logo, Cours de maths, Audit web..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-mono text-white/60 uppercase block mb-1.5">Catégorie</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as any)}
                      className="w-full bg-black/60 border border-white/10 rounded-xl py-2.5 px-3 text-white text-sm focus:outline-none focus:border-indigo-500"
                    >
                      <option value="tech">Tech & Dev</option>
                      <option value="design">Design & Création</option>
                      <option value="writing">Rédaction</option>
                      <option value="marketing">Marketing</option>
                      <option value="everyday">Aide quotidienne</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-mono text-white/60 uppercase block mb-1.5">Tarif suggéré</label>
                    <input
                      type="text"
                      placeholder="Ex: 50 € ou 25 € / h"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-mono text-white/60 uppercase block mb-1.5">Description & Précisions</label>
                  <textarea
                    rows={3}
                    placeholder="Détaille tes compétences, tes disponibilités et ton expérience..."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-sm transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] mt-2"
                >
                  Publier l'annonce gratuitement
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
