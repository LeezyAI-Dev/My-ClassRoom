import { useState } from "react";
import { useAuth } from "./context/AuthContext";
import PinSetup from "./pages/PinSetup";
import PinLock from "./pages/PinLock";
import WhoAreYou from "./pages/WhoAreYou";
import StudentAuth from "./pages/StudentAuth";
import DevAuth from "./pages/DevAuth";
import Dashboard from "./pages/Dashboard";

export default function App() {
  const { token, isLoading, isLocked, needsPinSetup, setupPin, verifyPin, logout } = useAuth();
  const [view, setView] = useState("whoareyou"); // whoareyou | student | developer

  if (isLoading) {
    return <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center text-white">Chargement...</div>;
  }

  // 1. Verrouillé par PIN
  if (token && isLocked) {
    return <PinLock onUnlock={verifyPin} onLogout={logout} />;
  }

  // 2. Première connexion -> créer PIN
  if (token && needsPinSetup) {
    return <PinSetup onComplete={setupPin} />;
  }

  // 3. Pas connecté -> WhoAreYou
  if (!token) {
    if (view === "student") {
      return <StudentAuth onBack={() => setView("whoareyou")} onLoginSuccess={() => setView("whoareyou")} />;
    }
    if (view === "developer") {
      return <DevAuth onBack={() => setView("whoareyou")} onLoginSuccess={() => setView("whoareyou")} />;
    }
    return (
      <WhoAreYou
        onSelectStudent={() => setView("student")}
        onSelectDeveloper={() => setView("developer")}
      />
    );
  }

  // 4. Connecté et déverrouillé
  return <Dashboard />;
}
