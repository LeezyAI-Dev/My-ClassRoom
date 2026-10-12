import { useState } from "react";
import { useAuth } from "./context/AuthContext";
import PinSetup from "./pages/PinSetup";
import PinLock from "./pages/PinLock";
import WhoAreYou from "./pages/WhoAreYou";
import StudentAuth from "./pages/StudentAuth";
import DevAuth from "./pages/DevAuth";
import Dashboard from "./pages/Dashboard";

export default function App() {
  const auth = useAuth();
  if (!auth) {
    return <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center text-white">Chargement auth...</div>;
  }
  const { token, isLoading, isLocked, needsPinSetup, setupPin, verifyPin, logout } = auth;
  const [view, setView] = useState("whoareyou");

  if (isLoading) {
    return <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center text-white">Chargement...</div>;
  }

  if (token && isLocked) {
    return <PinLock onUnlock={verifyPin} onLogout={logout} />;
  }

  if (token && needsPinSetup) {
    return <PinSetup onComplete={setupPin} />;
  }

  if (!token) {
    if (view === "student") {
      return <StudentAuth onBack={() => setView("whoareyou")} onLoginSuccess={() => {}} />;
    }
    if (view === "developer") {
      return <DevAuth onBack={() => setView("whoareyou")} onLoginSuccess={() => {}} />;
    }
    return (
      <WhoAreYou
        onSelectStudent={() => setView("student")}
        onSelectDeveloper={() => setView("developer")}
      />
    );
  }

  return <Dashboard />;
}
