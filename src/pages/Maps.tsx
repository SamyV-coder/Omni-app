import React, { useState, useEffect, useRef } from "react";
import { 
  MapPin, 
  Navigation, 
  Search, 
  Compass, 
  Layers, 
  Crosshair, 
  Sparkles, 
  Building2, 
  Coffee, 
  Laptop, 
  Activity,
  Maximize2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { loadGoogleMapsScript, GMP_ATTRIBUTION_ID } from "../lib/maps";
import { vibrate } from "../lib/utils";
import { sound } from "../lib/sound";

// Default coordinates: Paris / Europe Center
const DEFAULT_CENTER = { lat: 48.8566, lng: 2.3522 };

const PRESET_PLACES = [
  { name: "Coworking Tech Hub", lat: 48.8606, lng: 2.3376, type: "work", desc: "Espace ultra-rapide, écrans 4K & cabines insonorisées" },
  { name: "Café Deep Focus", lat: 48.8529, lng: 2.3499, type: "coffee", desc: "Ambiance calme, matcha latte & prises disponibles" },
  { name: "OMNI HQ Lab", lat: 48.8738, lng: 2.2950, type: "lab", desc: "QG d'innovation, bornes biométriques et serveurs neuraux" },
  { name: "Silent Library Zone", lat: 48.8462, lng: 2.3449, type: "quiet", desc: "Zéro bruit garanti pour sessions de deep work" },
];

export function Maps() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<any | null>(null);
  const [locating, setLocating] = useState(false);
  const [liveTracking, setLiveTracking] = useState(true);
  const [locationStatus, setLocationStatus] = useState<string>("Localisation en cours...");
  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
  const userAccuracyCircleRef = useRef<any>(null);
  const watchIdRef = useRef<number | null>(null);

  // Function to update or render user position marker and pulse circle
  const updateUserPositionOnMap = (map: any, coords: { lat: number; lng: number; accuracy?: number }, pan = true) => {
    const google = (window as any).google;
    if (!google?.maps || !map) return;

    setUserLocation(coords);

    if (pan) {
      map.panTo(coords);
      if (map.getZoom() < 14) {
        map.setZoom(15);
      }
    }

    // Update or create accuracy circle
    if (coords.accuracy) {
      if (userAccuracyCircleRef.current) {
        userAccuracyCircleRef.current.setCenter(coords);
        userAccuracyCircleRef.current.setRadius(coords.accuracy);
      } else {
        userAccuracyCircleRef.current = new google.maps.Circle({
          map,
          center: coords,
          radius: coords.accuracy,
          fillColor: "#10b981",
          fillOpacity: 0.12,
          strokeColor: "#10b981",
          strokeOpacity: 0.4,
          strokeWeight: 1,
          internalUsageAttributionIds: [GMP_ATTRIBUTION_ID],
        });
      }
    }

    // Update or create user avatar marker
    if (userMarkerRef.current) {
      userMarkerRef.current.setPosition(coords);
    } else {
      userMarkerRef.current = new google.maps.Marker({
        position: coords,
        map,
        title: "Votre position actuelle (OMNI)",
        zIndex: 9999,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 9,
          fillColor: "#10b981",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 3,
        },
        internalUsageAttributionIds: [GMP_ATTRIBUTION_ID],
      });
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function init() {
      try {
        await loadGoogleMapsScript();
        if (!isMounted || !mapContainerRef.current) return;

        const google = (window as any).google;
        if (!google || !google.maps) {
          throw new Error("Google Maps SDK not loaded");
        }

        // Initialize Map with mandatory internalUsageAttributionIds
        const map = new google.maps.Map(mapContainerRef.current, {
          center: DEFAULT_CENTER,
          zoom: 13,
          mapId: "OMNI_DARK_MAP",
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: true,
          fullscreenControl: false,
          internalUsageAttributionIds: [GMP_ATTRIBUTION_ID],
          styles: [
            { elementType: "geometry", stylers: [{ color: "#17171a" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#17171a" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
            {
              featureType: "administrative.locality",
              elementType: "labels.text.fill",
              stylers: [{ color: "#d59563" }]
            },
            {
              featureType: "poi",
              elementType: "labels.text.fill",
              stylers: [{ color: "#8b949e" }]
            },
            {
              featureType: "road",
              elementType: "geometry",
              stylers: [{ color: "#2d333b" }]
            },
            {
              featureType: "road",
              elementType: "geometry.stroke",
              stylers: [{ color: "#1f242c" }]
            },
            {
              featureType: "road.highway",
              elementType: "geometry",
              stylers: [{ color: "#6366f1" }]
            },
            {
              featureType: "water",
              elementType: "geometry",
              stylers: [{ color: "#0d1117" }]
            }
          ]
        });

        setMapInstance(map);
        setMapLoaded(true);

        // Place Preset Hub Markers
        PRESET_PLACES.forEach((p) => {
          const marker = new google.maps.Marker({
            position: { lat: p.lat, lng: p.lng },
            map,
            title: p.name,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: "#6366f1",
              fillOpacity: 0.9,
              strokeColor: "#ffffff",
              strokeWeight: 2,
            },
            internalUsageAttributionIds: [GMP_ATTRIBUTION_ID],
          });

          marker.addListener("click", () => {
            setSelectedPlace(p);
            map.panTo({ lat: p.lat, lng: p.lng });
            sound.playClick();
            vibrate(20);
          });

          markersRef.current.push(marker);
        });

        // AUTO-SYNC GEOLOCATION IMMEDIATELY
        if ("geolocation" in navigator) {
          setLocating(true);
          setLocationStatus("Synchronisation GPS...");

          // 1. Get initial fast position
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              if (!isMounted) return;
              setLocating(false);
              setLocationStatus("Position GPS synchronisée");
              const coords = {
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                accuracy: pos.coords.accuracy,
              };
              updateUserPositionOnMap(map, coords, true);
            },
            (err) => {
              if (!isMounted) return;
              setLocating(false);
              setLocationStatus("Position par défaut (Paris)");
              console.warn("Auto-geolocation error:", err.message);
            },
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
          );

          // 2. Watch position continuously if moving
          watchIdRef.current = navigator.geolocation.watchPosition(
            (pos) => {
              if (!isMounted) return;
              const coords = {
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                accuracy: pos.coords.accuracy,
              };
              updateUserPositionOnMap(map, coords, false);
            },
            (err) => console.warn("Watch position notice:", err.message),
            { enableHighAccuracy: true, maximumAge: 10000 }
          );
        } else {
          setLocationStatus("Géolocalisation non supportée");
        }

      } catch (err: any) {
        console.error("Map initialization failed:", err);
        setMapError(err.message || "Impossible de charger Google Maps");
      }
    }

    init();

    return () => {
      isMounted = false;
      if (watchIdRef.current !== null && "geolocation" in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
      if (userMarkerRef.current) userMarkerRef.current.setMap(null);
      if (userAccuracyCircleRef.current) userAccuracyCircleRef.current.setMap(null);
    };
  }, []);

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert("La géolocalisation n'est pas supportée par votre navigateur.");
      return;
    }
    setLocating(true);
    setLocationStatus("Recentrage GPS...");
    vibrate(20);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        setLocationStatus("Position GPS synchronisée");
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
        if (mapInstance) {
          updateUserPositionOnMap(mapInstance, coords, true);
          mapInstance.setZoom(16);
        }
      },
      (err) => {
        setLocating(false);
        setLocationStatus("Échec du signal GPS");
        console.warn("Geolocation error:", err);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const searchNearby = (type: "cafe" | "coworking" | "library") => {
    vibrate(25);
    sound.playClick();
    if (!mapInstance) return;

    const google = (window as any).google;
    const center = userLocation || DEFAULT_CENTER;

    if (google?.maps?.places?.PlacesService) {
      const service = new google.maps.places.PlacesService(mapInstance);
      const request = {
        location: center,
        radius: 3500,
        keyword: type === "cafe" ? "café calme travail" : type === "coworking" ? "espace coworking" : "bibliothèque",
      };

      service.nearbySearch(request, (results: any, status: any) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          results.slice(0, 8).forEach((place: any) => {
            const marker = new google.maps.Marker({
              position: place.geometry.location,
              map: mapInstance,
              title: place.name,
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 9,
                fillColor: type === "cafe" ? "#f59e0b" : "#8b5cf6",
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 2,
              },
              internalUsageAttributionIds: [GMP_ATTRIBUTION_ID],
            });

            marker.addListener("click", () => {
              setSelectedPlace({
                id: place.place_id,
                name: place.name,
                category: type === "cafe" ? "Café Productif" : "Espace Coworking",
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
                desc: place.vicinity || "Lieu de travail recommandé",
                rating: place.rating || 4.5,
              });
              mapInstance.panTo(place.geometry.location);
              sound.playClick();
            });

            markersRef.current.push(marker);
          });
          mapInstance.panTo(center);
          mapInstance.setZoom(14);
          sound.playNotification();
        }
      });
    } else {
      // Fallback geocoding search
      const geocoder = new google.maps.Geocoder();
      const query = type === "cafe" ? "Café de travail" : "Coworking";
      geocoder.geocode({ address: query, internalUsageAttributionIds: [GMP_ATTRIBUTION_ID] }, (res: any) => {
        if (res?.[0]) {
          mapInstance.panTo(res[0].geometry.location);
        }
      });
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !mapInstance) return;

    const google = (window as any).google;
    if (!google?.maps?.Geocoder) return;

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode(
      { address: searchQuery, internalUsageAttributionIds: [GMP_ATTRIBUTION_ID] },
      (results: any, status: any) => {
        if (status === "OK" && results[0]) {
          const loc = results[0].geometry.location;
          mapInstance.panTo(loc);
          mapInstance.setZoom(14);
          new google.maps.Marker({
            position: loc,
            map: mapInstance,
            title: results[0].formatted_address,
            internalUsageAttributionIds: [GMP_ATTRIBUTION_ID],
          });
          sound.playNotification();
        }
      }
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto h-[calc(100vh-140px)] flex flex-col">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <MapPin className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
                OMNI World Maps
              </h1>
              <p className="text-xs font-mono text-white/40 tracking-wider">
                CARTOGRAPHIE GLOBALE & HUBS DE PRODUCTIVITÉ
              </p>
            </div>
          </div>
        </div>

        {/* Quick Location Action & Live Status */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-[11px] font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white/70">{locationStatus}</span>
          </div>

          <button
            onClick={handleLocateMe}
            disabled={locating}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-xs font-mono tracking-wider text-emerald-300 transition-all hover:border-emerald-400"
          >
            <Crosshair className={`w-4 h-4 text-emerald-400 ${locating ? "animate-spin" : ""}`} />
            <span>{locating ? "Localisation..." : "Ma Position"}</span>
          </button>
        </div>
      </div>

      {/* Main Map Workspace */}
      <div className="relative flex-1 rounded-3xl border border-white/10 overflow-hidden bg-black/60 shadow-2xl flex flex-col">
        {/* Floating Search Bar */}
        <div className="absolute top-4 left-4 right-4 z-20 flex flex-col sm:flex-row gap-2 max-w-xl">
          <form onSubmit={handleSearchSubmit} className="flex-1 relative">
            <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une ville, une adresse, un café..."
              className="w-full bg-black/80 backdrop-blur-xl border border-white/15 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500 shadow-xl"
            />
          </form>

          {/* Quick presets and nearby search tags */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
            <button
              onClick={() => searchNearby("cafe")}
              className="whitespace-nowrap px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-[11px] font-mono text-amber-300 hover:bg-amber-500/30 transition-all flex items-center gap-1"
            >
              ☕ Cafés calmes
            </button>
            <button
              onClick={() => searchNearby("coworking")}
              className="whitespace-nowrap px-3 py-1.5 rounded-xl bg-purple-500/20 border border-purple-500/40 text-[11px] font-mono text-purple-300 hover:bg-purple-500/30 transition-all flex items-center gap-1"
            >
              💻 Coworkings
            </button>
            <button
              onClick={() => searchNearby("library")}
              className="whitespace-nowrap px-3 py-1.5 rounded-xl bg-blue-500/20 border border-blue-500/40 text-[11px] font-mono text-blue-300 hover:bg-blue-500/30 transition-all flex items-center gap-1"
            >
              📚 Bibliothèques
            </button>

            {PRESET_PLACES.map((p, i) => (
              <button
                key={i}
                onClick={() => {
                  if (mapInstance) {
                    mapInstance.panTo({ lat: p.lat, lng: p.lng });
                    mapInstance.setZoom(15);
                    setSelectedPlace(p);
                  }
                }}
                className="whitespace-nowrap px-3 py-1.5 rounded-xl bg-black/70 backdrop-blur-md border border-white/10 hover:border-indigo-500/40 text-[11px] font-mono text-white/80 hover:text-white transition-all shadow-md"
              >
                {p.name.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Map Canvas */}
        <div ref={mapContainerRef} className="w-full h-full flex-1 min-h-[400px]" />

        {/* Error Fallback */}
        {mapError && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-6 text-center z-30">
            <div className="p-4 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 mb-4">
              <MapPin className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Chargement de la Carte OMNI</h3>
            <p className="text-xs text-white/50 max-w-md font-mono">{mapError}</p>
          </div>
        )}

        {/* Place Card Overlay */}
        <AnimatePresence>
          {selectedPlace && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="absolute bottom-6 left-6 right-6 sm:right-auto sm:max-w-md bg-black/90 backdrop-blur-2xl border border-indigo-500/30 rounded-2xl p-5 shadow-2xl z-30"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Hub Recommandé
                  </span>
                  <h4 className="text-base font-bold text-white mt-1.5">{selectedPlace.name}</h4>
                  <p className="text-xs text-white/60 mt-1">{selectedPlace.desc}</p>
                </div>
                <button
                  onClick={() => setSelectedPlace(null)}
                  className="text-white/40 hover:text-white p-1 text-sm font-mono"
                >
                  ✕
                </button>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Connecté & Ouvert
                </span>
                <button
                  onClick={() => {
                    const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedPlace.lat},${selectedPlace.lng}`;
                    window.open(url, "_blank");
                  }}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono flex items-center gap-1.5 shadow-lg shadow-indigo-600/30"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  Itinéraire
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
