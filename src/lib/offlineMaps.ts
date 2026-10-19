// Offline Map & Geolocation Utilities for OMNI

export interface OfflinePlace {
  id: string;
  name: string;
  category: "coworking" | "cafe" | "library" | "quiet" | "emergency";
  lat: number;
  lng: number;
  desc: string;
  address?: string;
  amenities?: string[];
  savedAt?: number;
}

const STORAGE_KEY = "omni_offline_places";
const LAST_LOCATION_KEY = "omni_last_location";

// Default pre-seeded places for global availability
export const DEFAULT_OFFLINE_PLACES: OfflinePlace[] = [
  {
    id: "hub-global-1",
    name: "OMNI Global Innovation Hub",
    category: "coworking",
    lat: 48.8566,
    lng: 2.3522,
    desc: "Espace ultra-rapide, prises, cabines insonorisées et Wi-Fi 6",
    address: "Central Tech Hub",
    amenities: ["Wi-Fi 6", "Écrans 4K", "Café"],
  },
  {
    id: "hub-global-2",
    name: "Nomad Focus Lounge",
    category: "cafe",
    lat: 37.7749,
    lng: -122.4194,
    desc: "Ambiance studieuse et calme pour sessions Deep Work",
    address: "Digital Nomad Boulevard",
    amenities: ["Prises", "Matcha Latte", "Silencieux"],
  },
  {
    id: "hub-global-3",
    name: "Cyber Lab & Study Space",
    category: "library",
    lat: 51.5074,
    lng: -0.1278,
    desc: "Espace de recherche connecté, documentation et silence garanti",
    address: "Science & Innovation Quarter",
    amenities: ["Livres", "Climatisation", "Zéro bruit"],
  },
  {
    id: "hub-global-4",
    name: "Silicon Oasis Coworking",
    category: "coworking",
    lat: 25.2048,
    lng: 55.2708,
    desc: "Hub international pour fondateurs, créateurs et développeurs",
    address: "Downtown Oasis",
    amenities: ["Open 24/7", "Fibre 1Gbps", "Salles de réunion"],
  },
  {
    id: "hub-global-5",
    name: "Shibuya Deep Work Vault",
    category: "quiet",
    lat: 35.6762,
    lng: 139.6503,
    desc: "Cabines individuelles isolées avec contrôle de température",
    address: "Tokyo Tech Crossing",
    amenities: ["Pods individuels", "Chargeurs universels"],
  },
  {
    id: "hub-global-6",
    name: "Casablanca Marina Hub",
    category: "coworking",
    lat: 33.6033,
    lng: -7.6326,
    desc: "Vue sur mer, bureaux partagés et espace networking",
    address: "Marina Business Center",
    amenities: ["Vue Mer", "Café de spécialité", "Terrasse"],
  },
];

export function getStoredOfflinePlaces(): OfflinePlace[] {
  if (typeof localStorage === "undefined") return DEFAULT_OFFLINE_PLACES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_OFFLINE_PLACES));
      return DEFAULT_OFFLINE_PLACES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_OFFLINE_PLACES;
  } catch (e) {
    console.warn("Could not load offline places from localStorage", e);
    return DEFAULT_OFFLINE_PLACES;
  }
}

export function saveOfflinePlace(place: Omit<OfflinePlace, "id">): OfflinePlace {
  const current = getStoredOfflinePlaces();
  const newPlace: OfflinePlace = {
    ...place,
    id: `place-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    savedAt: Date.now(),
  };
  const updated = [newPlace, ...current];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn("Could not save place to localStorage", e);
  }
  return newPlace;
}

export function removeOfflinePlace(id: string): void {
  const current = getStoredOfflinePlaces();
  const updated = current.filter((p) => p.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn("Could not remove place", e);
  }
}

export function getCachedUserLocation(): { lat: number; lng: number } | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(LAST_LOCATION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed.lat === "number" && typeof parsed.lng === "number") {
        return parsed;
      }
    }
  } catch (e) {}
  return null;
}

export function cacheUserLocation(coords: { lat: number; lng: number }): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(LAST_LOCATION_KEY, JSON.stringify(coords));
  } catch (e) {}
}

/**
 * Great-circle distance between two points on a sphere (Haversine Formula)
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Format distance according to unit system (km / m vs mi / ft)
 */
export function formatDistance(distanceKm: number, unitSystem: "metric" | "imperial" = "metric"): string {
  if (unitSystem === "imperial") {
    const miles = distanceKm * 0.621371;
    if (miles < 0.1) {
      const feet = Math.round(miles * 5280);
      return `${feet} ft`;
    }
    return `${miles.toFixed(1)} mi`;
  }
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}

/**
 * Calculates initial compass bearing from point 1 to point 2 (0-360 degrees)
 */
export function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const y = Math.sin(((lon2 - lon1) * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.cos(((lon2 - lon1) * Math.PI) / 180);
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

/**
 * Returns 8-point cardinal abbreviation (N, NE, E, SE, S, SW, W, NW)
 */
export function getCardinalDirection(bearing: number): string {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
}

/**
 * Estimates walking time in minutes based on average 4.8 km/h walking speed
 */
export function estimateWalkingMinutes(distanceKm: number): number {
  const hours = distanceKm / 4.8;
  return Math.max(1, Math.round(hours * 60));
}
