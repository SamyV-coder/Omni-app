import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Register Service Worker for 100% Offline Resilience
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    // Register SW in production or when supported
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("OMNI Service Worker registered with scope:", registration.scope);
      })
      .catch((error) => {
        console.warn("Service Worker registration notice:", error);
      });
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
