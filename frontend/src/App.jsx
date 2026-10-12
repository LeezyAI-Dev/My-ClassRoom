import { useState } from "react";
import { useAuth } from "./context/AuthContext";
import PinSetup from "./pages/PinSetup";
import PinLock from "./pages/PinLock";
import WhoAreYou from "./pages/WhoAreYou";
import StudentAuth from "./pages/StudentAuth";
import DevAuth from "./pages/DevAuth";
import Dashboard from "./pages/Dashboard";
import Subjects from "./pages/Subjects";
import Schedule from "./pages/Schedule";
import AverageCalculator from "./pages/AverageCalculator";
import Eyes from "./pages/Eyes";

export default function App() {
  const auth = useAuth();
  const [authView, setAuthView] = useState("whoareyou");
  const [appView, setAppView] = useState("dashboard");

  if (!auth) return <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center text-white">Chargement...</div>;

  const { token, isLoading, isLocked, needsPinSetup, setupPin, verifyPin, logout } = auth;

  if (isLoading) return <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center text-white">Chargement...</div>;
  if (token && isLocked) return <PinLock onUnlock={verifyPin} onLogout={logout} />;
  if (token && needsPinSetup) return <PinSetup onComplete={setupPin} />;

  if (!token) {
    if (authView === "student") return <StudentAuth onBack={() => setAuthView("whoareyou")} onLoginSuccess={() => {}} />;
    if (authView === "developer") return <DevAuth onBack={() => setAuthView("whoareyou")} onLoginSuccess={() => {}} />;
    return <WhoAreYou onSelectStudent={() => setAuthView("student")} onSelectDeveloper={() => setAuthView("developer")} />;
  }

  // CONNECTÉ - Navigation réelle
  const goHome = () => setAppView("dashboard");
  const handleNavigate = (dest) => setAppView(dest);

  if (appView === "subjects") return <Subjects onBack={goHome} onNavigate={handleNavigate} />;
  if (appView === "schedule") return <Schedule onBack={goHome} onNavigate={handleNavigate} />;
  if (appView === "average") return <AverageCalculator onBack={goHome} onNavigate={handleNavigate} />;
  if (appView === "eyes") return <Eyes onBack={goHome} onNavigate={handleNavigate} />;

  return <Dashboard onNavigate={handleNavigate} onLogout={logout} />;
}
