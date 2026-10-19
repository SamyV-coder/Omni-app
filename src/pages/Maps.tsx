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
  Maximize2,
  Wifi,
  WifiOff,
  Download,
  BookmarkPlus,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { loadGoogleMapsScript, GMP_ATTRIBUTION_ID } from "../lib/maps";
import { vibrate } from "../lib/utils";
import { sound } from "../lib/sound";
import { usePreferences } from "../context/PreferencesContext";
import { useOffline } from "../context/OfflineContext";
import { 
  OfflinePlace, 
  getStoredOfflinePlaces, 
  saveOfflinePlace, 
  getCachedUserLocation, 
  cacheUserLocation, 
  formatDistance, 
  calculateDistanceKm 
} from "../lib/offlineMaps";
import { OfflineRadarMap } from "../components/OfflineRadarMap";

// Fallback initial center if no GPS or cache available
const DEFAULT_GLOBAL_CENTER = { lat: 20.0, lng: 0.0 };

export function Maps() {
  const { t, unitSystem, language } = usePreferences();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  
  // Geolocation & User position state
  const [userLocation, setUserLocation] = useState<{ 
    lat: number; 
    lng: number; 
    accuracy?: number; 
    altitude?: number | null; 
    heading?: number | null; 
    speed?: number | null 
  } | null>(() => {
    const cached = getCachedUserLocation();
    return cached ? { lat: cached.lat, lng: cached.lng } : null;
  });
  const [locating, setLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string>("Recherche du signal GPS...");
  const [permissionDenied, setPermissionDenied] = useState(false);

  // Search & Places
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [selectedPlace, setSelectedPlace] = useState<any | null>(null);
  
  // Offline Mode State from centralized OfflineContext
  const { isOffline: effectiveOffline, forceOffline, toggleForceOffline, isOnline, setForceOffline } = useOffline();
  const [offlinePlaces, setOfflinePlaces] = useState<OfflinePlace[]>(() => getStoredOfflinePlaces());
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);
  const [customPlaceName, setCustomPlaceName] = useState("");
  const [customPlaceCategory, setCustomPlaceCategory] = useState<OfflinePlace["category"]>("coworking");
  const [customPlaceDesc, setCustomPlaceDesc] = useState("");
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);

  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
  const userAccuracyCircleRef = useRef<any>(null);
  const watchIdRef = useRef<number | null>(null);

  // Function to update or render user position marker and accuracy circle on Google Map
  const updateUserPositionOnMap = (map: any, coords: { lat: number; lng: number; accuracy?: number }, pan = true) => {
    const google = (window as any).google;
    if (!google?.maps || !map) return;

    setUserLocation(coords);
    cacheUserLocation(coords);

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
        title: "Votre position GPS (OMNI)",
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

  // Immediate Geolocation permission request & GPS position acquisition
  const requestUserLocation = (panMap = true) => {
    if (!("geolocation" in navigator)) {
      setLocationStatus("Géolocalisation non supportée");
      return;
    }

    setLocating(true);
    setLocationStatus("Recherche du signal GPS...");
    vibrate(20);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        setPermissionDenied(false);
        setLocationStatus("GPS synchronisé");

        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          altitude: pos.coords.altitude,
          heading: pos.coords.heading,
          speed: pos.coords.speed,
        };

        setUserLocation(coords);
        cacheUserLocation(coords);

        if (mapInstance) {
          updateUserPositionOnMap(mapInstance, coords, panMap);
        }
      },
      (err) => {
        setLocating(false);
        console.warn("Geolocation permission/error notice:", err.message);
        if (err.code === 1) { // PERMISSION_DENIED
          setPermissionDenied(true);
          setLocationStatus("Autorisation GPS requise");
        } else {
          setLocationStatus("Signal GPS temporairement indisponible");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // On mount: Immediately request current geolocation & initialize continuous live tracking
  useEffect(() => {
    // 1. Immediately request location to center view on user coordinates
    requestUserLocation(true);

    // 2. Watch position continuously if user is moving
    if ("geolocation" in navigator) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const coords = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            altitude: pos.coords.altitude,
            heading: pos.coords.heading,
            speed: pos.coords.speed,
          };
          setUserLocation(coords);
          cacheUserLocation(coords);
          if (mapInstance) {
            updateUserPositionOnMap(mapInstance, coords, false);
          }
        },
        (err) => console.warn("Watch position notice:", err.message),
        { enableHighAccuracy: true, maximumAge: 10000 }
      );
    }

    return () => {
      if (watchIdRef.current !== null && "geolocation" in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [mapInstance]);

  // Google Maps Initialization (when online and not forced offline)
  useEffect(() => {
    if (effectiveOffline) return;

    let isMounted = true;

    async function initMap() {
      try {
        await loadGoogleMapsScript();
        if (!isMounted || !mapContainerRef.current) return;

        const google = (window as any).google;
        if (!google || !google.maps) {
          throw new Error("Google Maps SDK non disponible");
        }

        // Center priority: live user location > cached user location > global default
        const cached = getCachedUserLocation();
        const initialCenter = userLocation 
          ? { lat: userLocation.lat, lng: userLocation.lng }
          : cached 
          ? { lat: cached.lat, lng: cached.lng } 
          : DEFAULT_GLOBAL_CENTER;

        const initialZoom = (userLocation || cached) ? 15 : 3;

        const map = new google.maps.Map(mapContainerRef.current, {
          center: initialCenter,
          zoom: initialZoom,
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

        // Place markers for offline places / international hubs
        offlinePlaces.forEach((p) => {
          const marker = new google.maps.Marker({
            position: { lat: p.lat, lng: p.lng },
            map,
            title: p.name,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: p.category === "cafe" ? "#f59e0b" : "#6366f1",
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

        // If user coordinates already acquired, render marker immediately
        if (userLocation) {
          updateUserPositionOnMap(map, userLocation, false);
        }

      } catch (err: any) {
        console.warn("Google Maps load notice (switching to Offline Radar Mode):", err.message);
        setMapError(err.message || "Mode Hors-Ligne activé");
        // Seamless fallback to Offline Mode
        setForceOffline(true);
      }
    }

    initMap();

    return () => {
      isMounted = false;
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
      if (userMarkerRef.current) userMarkerRef.current.setMap(null);
      if (userAccuracyCircleRef.current) userAccuracyCircleRef.current.setMap(null);
    };
  }, [effectiveOffline]);

  // Online Place Search
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    if (effectiveOffline) {
      // Offline local search handled dynamically
      return;
    }

    if (!mapInstance) return;

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

  // Nearby Category Search on Google Maps
  const searchNearby = (type: "cafe" | "coworking" | "library") => {
    vibrate(25);
    sound.playClick();

    if (effectiveOffline) {
      setActiveFilter(type);
      return;
    }

    if (!mapInstance) return;

    const google = (window as any).google;
    const center = userLocation || getCachedUserLocation() || DEFAULT_GLOBAL_CENTER;

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
                category: type === "cafe" ? "cafe" : type === "coworking" ? "coworking" : "library",
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
                desc: place.vicinity || "Lieu de travail recommandé",
                address: place.vicinity,
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
    }
  };

  // Save current location as custom offline place
  const handleSaveCurrentLocation = () => {
    if (!userLocation) {
      requestUserLocation(true);
    }
    setCustomPlaceName("Mon Emplacement Repère");
    setCustomPlaceDesc(`Position GPS: ${userLocation?.lat.toFixed(4)}, ${userLocation?.lng.toFixed(4)}`);
    setShowAddCustomModal(true);
  };

  const handleConfirmSavePlace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPlaceName.trim() || !userLocation) return;

    vibrate([30, 60, 30]);
    sound.playSuccess();

    const created = saveOfflinePlace({
      name: customPlaceName.trim(),
      category: customPlaceCategory,
      lat: userLocation.lat,
      lng: userLocation.lng,
      desc: customPlaceDesc.trim() || "Point de repère personnel enregistré hors-ligne",
      address: `GPS (${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)})`,
    });

    setOfflinePlaces(getStoredOfflinePlaces());
    setSelectedPlace(created);
    setShowAddCustomModal(false);
  };

  // Download / Update Offline Hubs Pack
  const handleDownloadOfflinePack = () => {
    vibrate(30);
    sound.playSuccess();
    setDownloadNotice("Pack cartographique et 20+ hubs mondiaux sauvegardés en mémoire locale !");
    setTimeout(() => setDownloadNotice(null), 4000);
  };

  // Filtered places for offline mode
  const filteredOfflinePlaces = offlinePlaces.filter((p) => {
    const matchesFilter = activeFilter === "all" || p.category === activeFilter;
    const matchesSearch = 
      !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.address && p.address.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-4 max-w-7xl mx-auto h-[calc(100vh-130px)] flex flex-col">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl border transition-colors ${
              effectiveOffline 
                ? "bg-amber-500/10 border-amber-500/30 text-amber-400" 
                : "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
            }`}>
              <MapPin className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  OMNI Maps
                </h1>
                {effectiveOffline ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-amber-500/15 border border-amber-500/30 text-amber-300 flex items-center gap-1">
                    <WifiOff className="w-3 h-3" />
                    Hors-Ligne
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center gap-1">
                    <Wifi className="w-3 h-3" />
                    En Ligne (Google 1P)
                  </span>
                )}
              </div>
              <p className="text-[11px] font-mono text-white/50 tracking-wider">
                {effectiveOffline 
                  ? "RADAR GPS MATÉRIEL & POINTS D'INTÉRÊT LOCAUX (AUCUN RÉSEAU REQUIS)" 
                  : "GÉOLOCALISATION IMMÉDIATE & HUBS DE PRODUCTIVITÉ MONDIAUX"}
              </p>
            </div>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* GPS Status Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-[11px] font-mono">
            <span className={`w-2 h-2 rounded-full ${
              userLocation ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
            }`} />
            <span className="text-white/70 max-w-[150px] truncate">{locationStatus}</span>
          </div>

          {/* Offline Mode Toggle Button */}
          <button
            type="button"
            onClick={toggleForceOffline}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono border transition-all cursor-pointer ${
              forceOffline
                ? "bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.25)]"
                : "bg-white/5 hover:bg-white/10 border-white/10 text-white/70 hover:text-white"
            }`}
            title="Activer ou désactiver le mode hors-ligne"
          >
            {forceOffline ? <WifiOff className="w-3.5 h-3.5 text-amber-400" /> : <Wifi className="w-3.5 h-3.5" />}
            <span>{forceOffline ? "Mode Hors-Ligne" : "Hors-Ligne"}</span>
          </button>

          {/* Quick Locate & Center Button */}
          <button
            type="button"
            onClick={() => requestUserLocation(true)}
            disabled={locating}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-xs font-mono tracking-wider text-emerald-300 transition-all hover:border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
            title="Centrer la vue sur vos coordonnées GPS actuelles"
          >
            <Crosshair className={`w-3.5 h-3.5 text-emerald-400 ${locating ? "animate-spin" : ""}`} />
            <span>{locating ? "Localisation..." : "Ma Position"}</span>
          </button>
        </div>
      </div>

      {/* Geolocation Permission Request Banner (if prompt needed or denied) */}
      {permissionDenied && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-between gap-3 text-xs text-amber-200"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              La géolocalisation est nécessaire pour centrer la carte sur votre position exacte. Veuillez autoriser l'accès GPS.
            </span>
          </div>
          <button
            type="button"
            onClick={() => requestUserLocation(true)}
            className="px-3 py-1.5 rounded-xl bg-amber-500 text-black font-semibold text-xs whitespace-nowrap hover:bg-amber-400"
          >
            Autoriser le GPS
          </button>
        </motion.div>
      )}

      {/* Download pack notification */}
      {downloadNotice && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{downloadNotice}</span>
        </motion.div>
      )}

      {/* Main Map Workspace */}
      <div className="relative flex-1 rounded-3xl border border-white/10 overflow-hidden bg-black/60 shadow-2xl flex flex-col">
        {/* Floating Search & Category Filter Bar */}
        <div className="absolute top-4 left-4 right-4 z-20 flex flex-col sm:flex-row gap-2 max-w-2xl">
          <form onSubmit={handleSearchSubmit} className="flex-1 relative">
            <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                effectiveOffline 
                  ? "Rechercher parmi les lieux et hubs hors-ligne..." 
                  : "Rechercher une ville, adresse, café..."
              }
              className="w-full bg-black/85 backdrop-blur-xl border border-white/15 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500 shadow-xl"
            />
          </form>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-none">
            <button
              type="button"
              onClick={() => {
                setActiveFilter("all");
                if (!effectiveOffline) searchNearby("coworking");
              }}
              className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-[11px] font-mono transition-all flex items-center gap-1 ${
                activeFilter === "all"
                  ? "bg-indigo-600/30 border border-indigo-500 text-indigo-300"
                  : "bg-black/70 backdrop-blur-md border border-white/10 text-white/70 hover:text-white"
              }`}
            >
              Tous
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveFilter("cafe");
                if (!effectiveOffline) searchNearby("cafe");
              }}
              className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-[11px] font-mono transition-all flex items-center gap-1 ${
                activeFilter === "cafe"
                  ? "bg-amber-500/30 border border-amber-500 text-amber-300"
                  : "bg-black/70 backdrop-blur-md border border-white/10 text-white/70 hover:text-white"
              }`}
            >
              ☕ Cafés
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveFilter("coworking");
                if (!effectiveOffline) searchNearby("coworking");
              }}
              className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-[11px] font-mono transition-all flex items-center gap-1 ${
                activeFilter === "coworking"
                  ? "bg-purple-500/30 border border-purple-500 text-purple-300"
                  : "bg-black/70 backdrop-blur-md border border-white/10 text-white/70 hover:text-white"
              }`}
            >
              💻 Coworkings
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveFilter("library");
                if (!effectiveOffline) searchNearby("library");
              }}
              className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-[11px] font-mono transition-all flex items-center gap-1 ${
                activeFilter === "library"
                  ? "bg-blue-500/30 border border-blue-500 text-blue-300"
                  : "bg-black/70 backdrop-blur-md border border-white/10 text-white/70 hover:text-white"
              }`}
            >
              📚 Bibliothèques
            </button>

            {effectiveOffline && (
              <button
                type="button"
                onClick={handleDownloadOfflinePack}
                className="whitespace-nowrap px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-[11px] font-mono text-emerald-300 hover:bg-emerald-500/30 transition-all flex items-center gap-1"
                title="Mettre en cache les lieux mondiaux"
              >
                <Download className="w-3 h-3" />
                Pack Offline
              </button>
            )}
          </div>
        </div>

        {/* Viewport: Either Online Google Maps or High-Tech Offline Radar Map */}
        {effectiveOffline ? (
          <OfflineRadarMap
            userLocation={userLocation}
            places={filteredOfflinePlaces}
            selectedPlace={selectedPlace}
            onSelectPlace={(place) => setSelectedPlace(place)}
            onSaveCurrentLocationAsPlace={handleSaveCurrentLocation}
            unitSystem={unitSystem}
          />
        ) : (
          <div ref={mapContainerRef} className="w-full h-full flex-1 min-h-[400px]" />
        )}

        {/* Online Place Card Overlay */}
        {!effectiveOffline && (
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
                      {selectedPlace.category || "Hub Recommandé"}
                    </span>
                    <h4 className="text-base font-bold text-white mt-1.5">{selectedPlace.name}</h4>
                    <p className="text-xs text-white/60 mt-1">{selectedPlace.desc}</p>
                    {userLocation && (
                      <p className="text-[11px] font-mono text-emerald-400 mt-2">
                        Distance directe: {formatDistance(
                          calculateDistanceKm(userLocation.lat, userLocation.lng, selectedPlace.lat, selectedPlace.lng),
                          unitSystem
                        )}
                      </p>
                    )}
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
                    Point d'intérêt actif
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        saveOfflinePlace({
                          name: selectedPlace.name,
                          category: selectedPlace.category || "coworking",
                          lat: selectedPlace.lat,
                          lng: selectedPlace.lng,
                          desc: selectedPlace.desc || "",
                          address: selectedPlace.address || "",
                        });
                        setOfflinePlaces(getStoredOfflinePlaces());
                        vibrate(25);
                        sound.playSuccess();
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-mono flex items-center gap-1 border border-white/10"
                      title="Sauvegarder pour consultation hors-ligne"
                    >
                      <BookmarkPlus className="w-3.5 h-3.5" />
                      <span>Sauvegarder</span>
                    </button>
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
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Modal: Save custom current location offline */}
      <AnimatePresence>
        {showAddCustomModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-[#0c0d14] border border-white/15 rounded-3xl p-6 shadow-2xl relative"
            >
              <h3 className="text-base font-semibold text-white mb-1">
                Enregistrer ce point hors-ligne
              </h3>
              <p className="text-xs text-white/50 mb-4 font-mono">
                Accessible sur le radar sans aucune connexion internet
              </p>

              <form onSubmit={handleConfirmSavePlace} className="space-y-4">
                <div>
                  <label className="text-[11px] font-mono uppercase text-white/60 mb-1 block">Nom du lieu</label>
                  <input
                    type="text"
                    required
                    value={customPlaceName}
                    onChange={(e) => setCustomPlaceName(e.target.value)}
                    placeholder="Ex: Mon Coworking, Hôtel, Café favori..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono uppercase text-white/60 mb-1 block">Catégorie</label>
                  <select
                    value={customPlaceCategory}
                    onChange={(e) => setCustomPlaceCategory(e.target.value as any)}
                    className="w-full bg-black border border-white/10 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  >
                    <option value="coworking">💻 Coworking / Bureau</option>
                    <option value="cafe">☕ Café / Salon de thé</option>
                    <option value="library">📚 Bibliothèque / Étude</option>
                    <option value="quiet">🎧 Espace Calme / Pod</option>
                    <option value="emergency">🏥 Urgence / Point de secours</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-mono uppercase text-white/60 mb-1 block">Notes / Description</label>
                  <input
                    type="text"
                    value={customPlaceDesc}
                    onChange={(e) => setCustomPlaceDesc(e.target.value)}
                    placeholder="Code porte, étage, horaires..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {userLocation && (
                  <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-[10px] font-mono text-emerald-400">
                    Coordonnées GPS: {userLocation.lat.toFixed(5)}°, {userLocation.lng.toFixed(5)}°
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddCustomModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-white/70 font-mono"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow-lg shadow-emerald-600/30"
                  >
                    Enregistrer
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
