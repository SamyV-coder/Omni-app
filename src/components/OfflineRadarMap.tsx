import React, { useState, useRef, useEffect, useMemo } from "react";
import { 
  Navigation, 
  Compass, 
  ZoomIn, 
  ZoomOut, 
  Crosshair, 
  MapPin, 
  Bookmark, 
  ExternalLink,
  Layers,
  Sparkles,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  OfflinePlace, 
  calculateDistanceKm, 
  calculateBearing, 
  getCardinalDirection, 
  formatDistance, 
  estimateWalkingMinutes 
} from "../lib/offlineMaps";
import { vibrate } from "../lib/utils";
import { sound } from "../lib/sound";

interface OfflineRadarMapProps {
  userLocation: { lat: number; lng: number; accuracy?: number; altitude?: number | null; heading?: number | null } | null;
  places: OfflinePlace[];
  selectedPlace: OfflinePlace | null;
  onSelectPlace: (place: OfflinePlace | null) => void;
  onSaveCurrentLocationAsPlace?: () => void;
  unitSystem?: "metric" | "imperial";
}

export function OfflineRadarMap({
  userLocation,
  places,
  selectedPlace,
  onSelectPlace,
  onSaveCurrentLocationAsPlace,
  unitSystem = "metric",
}: OfflineRadarMapProps) {
  // Zoom range in km for the outer ring (e.g., 1km, 2.5km, 5km, 10km, 25km)
  const [radarRangeKm, setRadarRangeKm] = useState<number>(5);
  const [mapOffset, setMapOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Default coordinate if user location not yet acquired (fallback to neutral center)
  const centerLat = userLocation?.lat ?? 48.8566;
  const centerLng = userLocation?.lng ?? 2.3522;

  // Zoom steps in km
  const RANGES = [0.5, 1, 2.5, 5, 10, 20];

  const handleZoomIn = () => {
    vibrate(15);
    const currentIndex = RANGES.indexOf(radarRangeKm);
    if (currentIndex > 0) {
      setRadarRangeKm(RANGES[currentIndex - 1]);
    } else if (radarRangeKm > 0.5) {
      setRadarRangeKm(Math.max(0.5, radarRangeKm / 2));
    }
  };

  const handleZoomOut = () => {
    vibrate(15);
    const currentIndex = RANGES.indexOf(radarRangeKm);
    if (currentIndex >= 0 && currentIndex < RANGES.length - 1) {
      setRadarRangeKm(RANGES[currentIndex + 1]);
    } else {
      setRadarRangeKm(Math.min(50, radarRangeKm * 2));
    }
  };

  const handleResetCenter = () => {
    vibrate(20);
    setMapOffset({ x: 0, y: 0 });
  };

  // Convert place GPS coordinates to relative pixel coordinates on the radar
  // Returns { x, y, distKm, bearing, inView }
  const mappedPlaces = useMemo(() => {
    return places.map((place) => {
      const distKm = calculateDistanceKm(centerLat, centerLng, place.lat, place.lng);
      const bearing = calculateBearing(centerLat, centerLng, place.lat, place.lng);

      // Convert polar coordinates (dist, bearing) to Cartesian (x, y)
      // 0 deg bearing is North (up: -y)
      const angleRad = ((bearing - 90) * Math.PI) / 180;
      const normalizedDist = distKm / radarRangeKm; // 0 to 1 = inside circle

      // Map to 100% radius container (radius = 45% of container width)
      const xPercent = 50 + normalizedDist * 42 * Math.cos(angleRad);
      const yPercent = 50 + normalizedDist * 42 * Math.sin(angleRad);

      const inView = normalizedDist <= 1.25;

      return {
        ...place,
        distKm,
        bearing,
        cardinal: getCardinalDirection(bearing),
        walkingMin: estimateWalkingMinutes(distKm),
        xPercent,
        yPercent,
        inView,
      };
    });
  }, [places, centerLat, centerLng, radarRangeKm]);

  // Selected place calculations
  const selectedDetails = useMemo(() => {
    if (!selectedPlace) return null;
    const distKm = calculateDistanceKm(centerLat, centerLng, selectedPlace.lat, selectedPlace.lng);
    const bearing = calculateBearing(centerLat, centerLng, selectedPlace.lat, selectedPlace.lng);
    return {
      distKm,
      distFormatted: formatDistance(distKm, unitSystem),
      bearing: Math.round(bearing),
      cardinal: getCardinalDirection(bearing),
      walkingMin: estimateWalkingMinutes(distKm),
    };
  }, [selectedPlace, centerLat, centerLng, unitSystem]);

  return (
    <div className="relative w-full h-full flex flex-col bg-[#08080d] select-none overflow-hidden">
      {/* Top Telemetry / Status Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-black/80 border border-emerald-500/30 text-emerald-300 font-mono text-[11px] backdrop-blur-md shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>RADAR GPS HORS-LIGNE</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-xl bg-black/60 border border-white/10 text-white/70 font-mono text-[10px] backdrop-blur-md">
            <span>Rayon: {formatDistance(radarRangeKm, unitSystem)}</span>
          </div>
        </div>

        {/* Real-time coordinates */}
        {userLocation && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-xl bg-black/70 border border-white/10 font-mono text-[10px] text-white/60 backdrop-blur-md pointer-events-auto">
            <span>LAT: {userLocation.lat.toFixed(5)}°</span>
            <span className="text-white/20">•</span>
            <span>LNG: {userLocation.lng.toFixed(5)}°</span>
            {userLocation.accuracy && (
              <>
                <span className="text-white/20">•</span>
                <span className="text-emerald-400/90">±{Math.round(userLocation.accuracy)}m</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Main Radar Screen Viewport */}
      <div 
        className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={(e) => {
          setIsDragging(true);
          dragStartRef.current = { x: e.clientX - mapOffset.x, y: e.clientY - mapOffset.y };
        }}
        onMouseMove={(e) => {
          if (!isDragging) return;
          setMapOffset({
            x: e.clientX - dragStartRef.current.x,
            y: e.clientY - dragStartRef.current.y,
          });
        }}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
      >
        {/* Radar Map Canvas Container with Pan Offset */}
        <div 
          className="relative w-[340px] h-[340px] sm:w-[500px] sm:h-[500px] md:w-[600px] md:h-[600px] rounded-full transition-transform duration-75 ease-out flex items-center justify-center"
          style={{
            transform: `translate(${mapOffset.x}px, ${mapOffset.y}px)`,
          }}
        >
          {/* Outer Radar Glow Ring */}
          <div className="absolute inset-0 rounded-full border border-emerald-500/25 bg-[radial-gradient(circle,rgba(16,185,129,0.04)_0%,transparent_75%)] pointer-events-none shadow-[0_0_50px_rgba(16,185,129,0.06)]" />

          {/* Concentric Distance Range Rings (100%, 75%, 50%, 25%) */}
          <div className="absolute inset-[12%] rounded-full border border-dashed border-emerald-500/20 pointer-events-none" />
          <div className="absolute inset-[25%] rounded-full border border-emerald-500/25 pointer-events-none" />
          <div className="absolute inset-[37%] rounded-full border border-dashed border-emerald-500/20 pointer-events-none" />
          <div className="absolute inset-[50%] rounded-full border border-emerald-500/30 pointer-events-none" />

          {/* Distance Labels on Rings */}
          <span className="absolute top-[3%] left-1/2 -translate-x-1/2 text-[9px] font-mono text-emerald-400/60 pointer-events-none">
            {formatDistance(radarRangeKm, unitSystem)}
          </span>
          <span className="absolute top-[26%] left-1/2 -translate-x-1/2 text-[9px] font-mono text-emerald-400/40 pointer-events-none">
            {formatDistance(radarRangeKm * 0.5, unitSystem)}
          </span>

          {/* Crosshair Axes (N-S and E-W) */}
          <div className="absolute inset-y-0 left-1/2 w-[1px] bg-gradient-to-b from-emerald-500/30 via-emerald-500/10 to-emerald-500/30 pointer-events-none" />
          <div className="absolute inset-x-0 top-1/2 h-[1px] bg-gradient-to-r from-emerald-500/30 via-emerald-500/10 to-emerald-500/30 pointer-events-none" />

          {/* Cardinal Directions */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] font-mono font-bold text-emerald-400 flex flex-col items-center pointer-events-none">
            <span className="text-xs">▲</span>
            <span>N</span>
          </div>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-mono font-semibold text-emerald-400/60 pointer-events-none">
            S
          </div>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono font-semibold text-emerald-400/60 pointer-events-none">
            E
          </div>
          <div className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-mono font-semibold text-emerald-400/60 pointer-events-none">
            W
          </div>

          {/* Radar Sweep Effect */}
          <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
            <div className="w-full h-full animate-[spin_8s_linear_infinite] origin-center bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0_300deg,rgba(16,185,129,0.15)_360deg)]" />
          </div>

          {/* User Location Center Dot */}
          <div className="relative z-20 flex items-center justify-center">
            {/* Accuracy Pulse Ring */}
            <div className="absolute w-12 h-12 rounded-full bg-emerald-400/20 border border-emerald-400/50 animate-ping pointer-events-none" />
            <div className="w-5 h-5 rounded-full bg-emerald-500 border-2 border-white shadow-[0_0_15px_#10b981] flex items-center justify-center z-10">
              <div className="w-1.5 h-1.5 rounded-full bg-white" />
            </div>

            {/* Heading indicator arrow if heading available */}
            {userLocation?.heading !== null && userLocation?.heading !== undefined && (
              <div 
                className="absolute w-8 h-8 pointer-events-none transition-transform duration-300"
                style={{ transform: `rotate(${userLocation.heading}deg)` }}
              >
                <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[8px] border-b-emerald-400 absolute top-[-6px] left-1/2 -translate-x-1/2" />
              </div>
            )}
          </div>

          {/* Plotted Offline Place Pins */}
          {mappedPlaces.map((place) => {
            if (!place.inView) return null;
            const isSelected = selectedPlace?.id === place.id;

            return (
              <motion.button
                key={place.id}
                type="button"
                whileHover={{ scale: 1.25 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  vibrate(20);
                  sound.playClick();
                  onSelectPlace(isSelected ? null : place);
                }}
                className={`absolute z-30 -translate-x-1/2 -translate-y-1/2 transition-all p-1.5 rounded-full flex items-center justify-center shadow-lg group ${
                  isSelected
                    ? "bg-indigo-600 ring-4 ring-indigo-500/40 text-white z-40 scale-110"
                    : place.category === "cafe"
                    ? "bg-amber-500 hover:bg-amber-400 text-black ring-2 ring-black/80"
                    : place.category === "coworking"
                    ? "bg-purple-600 hover:bg-purple-500 text-white ring-2 ring-black/80"
                    : place.category === "library"
                    ? "bg-blue-600 hover:bg-blue-500 text-white ring-2 ring-black/80"
                    : "bg-emerald-600 hover:bg-emerald-500 text-white ring-2 ring-black/80"
                }`}
                style={{
                  left: `${place.xPercent}%`,
                  top: `${place.yPercent}%`,
                }}
                title={`${place.name} • ${formatDistance(place.distKm, unitSystem)}`}
              >
                <MapPin className="w-3.5 h-3.5" />

                {/* Floating Micro-Badge */}
                <div className={`absolute bottom-full mb-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md text-[9px] font-mono whitespace-nowrap pointer-events-none transition-opacity ${
                  isSelected ? "opacity-100 bg-indigo-900 border border-indigo-500 text-white shadow-md" : "opacity-0 group-hover:opacity-100 bg-black/90 border border-white/20 text-white"
                }`}>
                  <span>{place.name}</span>
                  <span className="text-emerald-400 ml-1">({formatDistance(place.distKm, unitSystem)})</span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Floating Radar Controls (Bottom Right) */}
      <div className="absolute right-4 bottom-6 z-30 flex flex-col gap-2">
        <button
          type="button"
          onClick={handleZoomIn}
          className="p-2.5 rounded-xl bg-black/80 hover:bg-black border border-white/15 text-white/80 hover:text-white transition-colors backdrop-blur-md shadow-xl"
          title="Zoomer (+)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={handleZoomOut}
          className="p-2.5 rounded-xl bg-black/80 hover:bg-black border border-white/15 text-white/80 hover:text-white transition-colors backdrop-blur-md shadow-xl"
          title="Dézoomer (-)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={handleResetCenter}
          className={`p-2.5 rounded-xl border transition-colors backdrop-blur-md shadow-xl ${
            mapOffset.x !== 0 || mapOffset.y !== 0
              ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
              : "bg-black/80 hover:bg-black border-white/15 text-white/80 hover:text-white"
          }`}
          title="Recentrer le radar"
        >
          <Crosshair className="w-4 h-4" />
        </button>

        {onSaveCurrentLocationAsPlace && (
          <button
            type="button"
            onClick={onSaveCurrentLocationAsPlace}
            className="p-2.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-300 transition-colors backdrop-blur-md shadow-xl"
            title="Enregistrer cette position hors-ligne"
          >
            <Bookmark className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Selected Waypoint Card Overlay */}
      <AnimatePresence>
        {selectedPlace && selectedDetails && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="absolute bottom-6 left-4 right-16 sm:right-auto sm:max-w-md bg-[#0e0f17]/95 backdrop-blur-2xl border border-indigo-500/40 rounded-3xl p-4 shadow-2xl z-40"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="overflow-hidden">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {selectedPlace.category}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                    <Compass className="w-3 h-3 text-emerald-400" />
                    {selectedDetails.cardinal} ({selectedDetails.bearing}°)
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-white truncate">{selectedPlace.name}</h4>
                <p className="text-xs text-white/60 line-clamp-2 mt-0.5">{selectedPlace.desc}</p>
              </div>

              <button
                type="button"
                onClick={() => onSelectPlace(null)}
                className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            {/* Offline GPS Distance & Walking Estimate */}
            <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {selectedDetails.distFormatted}
                </span>
                <span className="text-[11px] font-mono text-white/40 ml-2">
                  ~{selectedDetails.walkingMin} min à pied
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const coords = `${selectedPlace.lat},${selectedPlace.lng}`;
                    navigator.clipboard?.writeText(coords);
                    vibrate([30, 60, 30]);
                    sound.playSuccess();
                  }}
                  className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-[11px] font-mono"
                  title="Copier les coordonnées GPS"
                >
                  GPS: {selectedPlace.lat.toFixed(4)}, {selectedPlace.lng.toFixed(4)}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
