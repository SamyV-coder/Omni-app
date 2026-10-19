import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Hub } from "./pages/Hub";
import { Focus } from "./pages/Focus";
import { Wallet } from "./pages/Wallet";
import { Community } from "./pages/Community";
import { Service } from "./pages/Service";
import { LifeOS } from "./pages/LifeOS";
import { Settings } from "./pages/Settings";
import { Onboarding } from "./pages/Onboarding";
import { Help } from "./pages/Help";
import { Maps } from "./pages/Maps";
import { Gmail } from "./pages/Gmail";
import { Drive } from "./pages/Drive";
import { Upgrade } from "./pages/Upgrade";
import { AuthProvider } from "./context/AuthContext";
import { PreferencesProvider } from "./context/PreferencesContext";
import { OfflineProvider } from "./context/OfflineContext";

function AppContent() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Hub />} />
          <Route path="focus" element={<Focus />} />
          <Route path="wallet" element={<Wallet />} />
          <Route path="community" element={<Community />} />
          <Route path="service" element={<Service />} />
          <Route path="life-os" element={<LifeOS />} />
          <Route path="gemini" element={<Navigate to="/life-os" replace />} />
          <Route path="upgrade" element={<Upgrade />} />
          <Route path="maps" element={<Maps />} />
          <Route path="gmail" element={<Gmail />} />
          <Route path="drive" element={<Drive />} />
          <Route path="settings" element={<Settings />} />
          <Route path="help" element={<Help />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default function App() {
  const [hasOnboarded, setHasOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    const onboarded = localStorage.getItem("omni_onboarded");
    setHasOnboarded(onboarded === "true");
  }, []);

  if (hasOnboarded === null) return null; // Wait for localStorage check

  return (
    <AuthProvider>
      <PreferencesProvider>
        <OfflineProvider>
          {!hasOnboarded ? (
            <Onboarding 
              onComplete={() => {
                localStorage.setItem("omni_onboarded", "true");
                setHasOnboarded(true);
              }} 
            />
          ) : (
            <AppContent />
          )}
        </OfflineProvider>
      </PreferencesProvider>
    </AuthProvider>
  );
}
