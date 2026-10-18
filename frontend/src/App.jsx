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
import Checklist from "./pages/Checklist";
import GradesRegister from "./pages/GradesRegister";
import PinLock from "./pages/PinLock";
import PinSetup from "./pages/PinSetup";
import PinForgot from "./pages/PinForgot";
import { getDevice, clearDevice } from "./deviceStore";

// Écrans possibles :
// "who" -> "devAuth" | "studentAuth" -> "dashboard" -> "subjects" | "schedule" | "average" | "eyes" | "checklist" | "grades"
// Élève avec appareil mémorisé : "pinLock" (saisie du PIN) | "pinForgot" (mot de passe) | "pinSetup" (nouveau PIN)
function AppContent() {
  // Si ce téléphone connaît déjà un élève (PIN défini), on démarre sur l'écran du code PIN.
  const [screen, setScreen] = useState(() => (getDevice() ? "pinLock" : "who"));
  const { login, logout, isStudent } = useAuth();

  const handleLogout = () => {
    if (isStudent) clearDevice(); // un élève qui se déconnecte "oublie" l'appareil
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
        onLoginSuccess={() => setScreen("pinSetup")}
      />
    );
  }

  if (screen === "pinLock") {
    const device = getDevice();
    if (!device) return <WhoAreYou onSelectDeveloper={() => setScreen("devAuth")} onSelectStudent={() => setScreen("studentAuth")} />;
    return (
      <PinLock
        username={device.username}
        onSuccess={(data) => {
          login(data.token, data.student, "student");
          setScreen("dashboard");
        }}
        onForgot={() => setScreen("pinForgot")}
        onSwitchAccount={() => {
          clearDevice();
          setScreen("who");
        }}
        onDeviceInvalid={() => setScreen("who")}
      />
    );
  }

  if (screen === "pinForgot") {
    const device = getDevice();
    return (
      <PinForgot
        username={device ? device.username : ""}
        onBack={() => setScreen(device ? "pinLock" : "who")}
        onVerified={() => setScreen("pinSetup")}
      />
    );
  }

  if (screen === "pinSetup") {
    return <PinSetup onDone={() => setScreen("dashboard")} onCancel={handleLogout} />;
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

  if (screen === "checklist") {
    return <Checklist onBack={() => setScreen("dashboard")} />;
  }

  if (screen === "grades") {
    return <GradesRegister onBack={() => setScreen("dashboard")} />;
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
