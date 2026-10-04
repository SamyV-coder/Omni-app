// Google Maps Loader Utility for OMNI
// Strictly obeys mandatory usage attribution requirement: 'gmp_git_agentskills_v1'

let mapsScriptPromise: Promise<void> | null = null;

export async function loadGoogleMapsScript(): Promise<void> {
  if (typeof window === "undefined") return;
  if ((window as any).google?.maps) return;

  if (mapsScriptPromise) return mapsScriptPromise;

  mapsScriptPromise = new Promise(async (resolve, reject) => {
    try {
      let apiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY;

      if (!apiKey || apiKey === "MY_GOOGLE_MAPS_API_KEY") {
        try {
          const res = await fetch("/api/config/maps");
          const data = await res.json();
          if (data.apiKey) {
            apiKey = data.apiKey;
          }
        } catch (e) {
          console.warn("Could not fetch maps config from server:", e);
        }
      }

      if (!apiKey) {
        apiKey = "AIzaSyD3VXd4gCQPSaWnlHTyaNxvxrEQeibRZMs";
      }

      // Check if script already attached
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        (existingScript as HTMLScriptElement).addEventListener("load", () => resolve());
        return;
      }

      const script = document.createElement("script");
      // Use latest weekly release with libraries=places,geometry,marker
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker,geometry&v=weekly&callback=__omniInitMap`;
      script.async = true;
      script.defer = true;

      (window as any).__omniInitMap = () => {
        resolve();
      };

      script.onerror = (err) => {
        console.error("Failed to load Google Maps SDK:", err);
        reject(err);
      };

      document.head.appendChild(script);
    } catch (err) {
      reject(err);
    }
  });

  return mapsScriptPromise;
}

// Mandatory attribution ID for all maps operations
export const GMP_ATTRIBUTION_ID = "gmp_git_agentskills_v1";
