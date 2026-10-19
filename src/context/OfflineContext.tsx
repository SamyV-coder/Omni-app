import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { vibrate } from "../lib/utils";
import { sound } from "../lib/sound";

interface OfflineContextType {
  isOnline: boolean;
  forceOffline: boolean;
  isOffline: boolean;
  toggleForceOffline: () => void;
  setForceOffline: (val: boolean) => void;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

const OFFLINE_STORAGE_KEY = "omni_force_offline_mode";

export function OfflineProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== "undefined" ? navigator.onLine : true;
  });

  const [forceOffline, setForceOfflineState] = useState<boolean>(() => {
    try {
      return localStorage.getItem(OFFLINE_STORAGE_KEY) === "true";
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      vibrate(20);
      sound.playNotification();
    };

    const handleOffline = () => {
      setIsOnline(false);
      vibrate([40, 80, 40]);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const setForceOffline = (val: boolean) => {
    setForceOfflineState(val);
    vibrate(25);
    try {
      localStorage.setItem(OFFLINE_STORAGE_KEY, val ? "true" : "false");
    } catch (e) {}
  };

  const toggleForceOffline = () => {
    setForceOffline(!forceOffline);
  };

  const isOffline = !isOnline || forceOffline;

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        forceOffline,
        isOffline,
        toggleForceOffline,
        setForceOffline,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
}

export function useOffline() {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error("useOffline must be used within an OfflineProvider");
  }
  return context;
}
