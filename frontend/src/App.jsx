import { useState } from "react";
import { useAuth } from "./context/AuthContext";
import PinSetup from "./pages/PinSetup";
import PinLock from "./pages/PinLock";
import WhoAreYou from "./pages/WhoAreYou";
import StudentAuth from "./pages/StudentAuth";
import DevAuth from "./pages/DevAuth";
import Dashboard from "./pages/Dashboard";
import StudentDashboard from "./pages/StudentDashboard";
import Eyes from "./pages/Eyes";

export default function App() {
  const { token, user, isLoading, isLocked, needsPinSetup, setupPin, verifyPin, logout, isDeveloper, isStudent } = useAuth();
  const [view, setView] = useState("whoareyou"); // whoareyou | student | developer

  if (isLoading) {
    return <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center text-white">Chargement...</div>;
  }

  // 1. VERROUILLÉ PAR PIN - on demande seulement le PIN
  if (token && isLocked) {
    return <PinLock onUnlock={verifyPin} onLogout={logout} />;
  }

  // 2. PREMIÈRE CONNEXION - on doit créer le PIN
  if (token && needsPinSetup) {
    return <PinSetup onComplete={setupPin} />;
  }

  // 3. PAS CONNECTÉ
  if (!token) {
    if (view === "student") {
      return <StudentAuth onBack={() => setView("whoareyou")} onLoginSuccess={() => {}} />;
    }
    if (view === "developer") {
      return <DevAuth onBack={() => setView("whoareyou")} onLoginSuccess={() => {}} />;
    }
    return <WhoAreYou onSelect={(type) => setView(type)} />;
  }

  // 4. CONNECTÉ ET DEVERROUILLÉ
  if (isDeveloper) return <Dashboard />;
  if (isStudent) return <StudentDashboard />;
  
  return <Dashboard />;
}
