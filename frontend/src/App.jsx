import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import WhoAreYou from "./pages/WhoAreYou";
import DevAuth from "./pages/DevAuth";
import StudentAuth from "./pages/StudentAuth";
import Dashboard from "./pages/Dashboard";
import Subjects from "./pages/Subjects";
import Schedule from "./pages/Schedule";
import AverageCalculator from "./pages/AverageCalculator";
import Eyes from "./pages/Eyes";

// Écrans possibles :
// "who" -> "devAuth" | "studentAuth" -> "dashboard" -> "subjects" | "schedule" | "average" | "eyes"
function AppContent() {
  const [screen, setScreen] = useState("who");
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    setScreen("who");
  };

  if (screen === "who") {
    return (
      <WhoAreYou
        onSelectDeveloper={() => setScreen("devAuth")}
        onSelectStudent={() => setScreen("studentAuth")}
      />
    );
  }

  if (screen === "devAuth") {
    return (
      <DevAuth
        onBack={() => setScreen("who")}
        onLoginSuccess={() => setScreen("dashboard")}
      />
    );
  }

  if (screen === "studentAuth") {
    return (
      <StudentAuth
        onBack={() => setScreen("who")}
        onLoginSuccess={() => setScreen("dashboard")}
      />
    );
  }

  if (screen === "subjects") {
    return <Subjects onBack={() => setScreen("dashboard")} />;
  }

  if (screen === "schedule") {
    return <Schedule onBack={() => setScreen("dashboard")} />;
  }

  if (screen === "average") {
    return <AverageCalculator onBack={() => setScreen("dashboard")} />;
  }

  if (screen === "eyes") {
    return <Eyes onBack={() => setScreen("dashboard")} />;
  }

  return <Dashboard onNavigate={(key) => setScreen(key)} onLogout={handleLogout} />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
