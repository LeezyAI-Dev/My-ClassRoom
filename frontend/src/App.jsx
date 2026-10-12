import { useState } from "react";
import { useAuth } from "./context/AuthContext";
import PinSetup from "./pages/PinSetup";
import PinLock from "./pages/PinLock";
import WhoAreYou from "./pages/WhoAreYou";
import StudentAuth from "./pages/StudentAuth";
import DevAuth from "./pages/DevAuth";
import Dashboard from "./pages/Dashboard";
import Checklist from "./pages/Checklist";
import Subjects from "./pages/Subjects";
import Schedule from "./pages/Schedule";
import AverageCalculator from "./pages/AverageCalculator";
import Eyes from "./pages/Eyes";

export default function App() {
  const { token, isLoading, isLocked, needsPinSetup, setupPin, verifyPin, logout } = useAuth();
  const [view, setView] = useState("whoareyou");
  const [dashboardPage, setDashboardPage] = useState("dashboard");

  if (isLoading) return <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center text-white">Chargement...</div>;
  if (token && isLocked) return <PinLock onUnlock={verifyPin} onLogout={logout} />;
  if (token && needsPinSetup) return <PinSetup onComplete={setupPin} />;

  if (!token) {
    if (view === "student") return <StudentAuth onBack={() => setView("whoareyou")} onLoginSuccess={() => {}} />;
    if (view === "developer") return <DevAuth onBack={() => setView("whoareyou")} onLoginSuccess={() => {}} />;
    return <WhoAreYou onSelect={(type) => setView(type)} />;
  }

  // Une fois connecté, navigation interne
  if (dashboardPage === "checklist") return <Checklist onBack={() => setDashboardPage("dashboard")} />;
  if (dashboardPage === "subjects") return <Subjects onBack={() => setDashboardPage("dashboard")} />;
  if (dashboardPage === "schedule") return <Schedule onBack={() => setDashboardPage("dashboard")} />;
  if (dashboardPage === "average") return <AverageCalculator onBack={() => setDashboardPage("dashboard")} />;
  if (dashboardPage === "eyes") return <Eyes onBack={() => setDashboardPage("dashboard")} />;

  return <Dashboard onNavigate={setDashboardPage} onLogout={logout} />;
}