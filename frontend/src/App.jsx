import GuideBot from "./components/GuideBot";
import React, { useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
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
import BottomNav from "./components/ui/BottomNav";

// Écrans connectés qui affichent la barre de navigation du bas.
// Eyes en est exclu : c'est un fil plein écran (comme une vidéo verticale) avec son propre en-tête.
const NAV_SCREENS = ["dashboard", "subjects", "schedule", "average", "checklist", "grades"];

// ───────── Animation de balayement entre les écrans (style iPhone) ─────────
// Le navigateur sait animer le passage d'un écran à l'autre (API « View Transitions »).
// Le style des animations est dans index.css (data-nav sur <html>).
// Sans cette API (très vieux téléphone) ou si l'utilisateur a désactivé les animations,
// l'écran change simplement, sans animation de sortie.

// Profondeur de chaque écran : on avance quand elle augmente (glisse vers la gauche),
// on revient quand elle diminue (glisse vers la droite).
const SCREEN_LEVEL = {
  who: 0,
  pinLock: 0,
  devAuth: 1,
  studentAuth: 1,
  pinForgot: 1,
  pinSetup: 2,
  dashboard: 2,
  subjects: 3,
  schedule: 3,
  average: 3,
  eyes: 3,
  checklist: 3,
  grades: 3,
};

const supportsViewTransitions = typeof document !== "undefined" && typeof document.startViewTransition === "function";
const prefersReducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

function transitionKind(from, to) {
  if (to === "eyes") return "up"; // Eyes s'ouvre comme une feuille qui monte
  if (from === "eyes") return "down";
  const a = SCREEN_LEVEL[from] ?? 0;
  const b = SCREEN_LEVEL[to] ?? 0;
  if (b > a) return "forward";
  if (b < a) return "back";
  return "fade";
}

let navToken = 0; // évite qu'une ancienne transition efface la direction de la nouvelle
function changeScreenAnimated(from, to, apply) {
  if (!supportsViewTransitions || prefersReducedMotion()) {
    apply();
    return;
  }
  const root = document.documentElement;
  const token = ++navToken;
  root.dataset.nav = transitionKind(from, to);
  const transition = document.startViewTransition(() => {
    flushSync(apply); // l'écran doit être à jour avant que le navigateur prenne la « photo » d'arrivée
  });
  transition.finished
    .catch(() => {})
    .finally(() => {
      if (token === navToken) delete root.dataset.nav;
    });
}
// Écrans possibles :
// "who" -> "devAuth" | "studentAuth" -> "dashboard" -> "subjects" | "schedule" | "average" | "eyes" | "checklist" | "grades"
// Élève avec appareil mémorisé : "pinLock" (saisie du PIN) | "pinForgot" (mot de passe) | "pinSetup" (nouveau PIN)
function AppContent() {
  // Si ce téléphone connaît déjà un élève (PIN défini), on démarre sur l'écran du code PIN.
  const [screen, setScreenNow] = useState(() => (getDevice() ? "pinLock" : "who"));
  const screenRef = useRef(screen);
  screenRef.current = screen;

  // Tous les changements d'écran passent par ici : ils sont animés automatiquement.
  const setScreen = (next) => {
    const from = screenRef.current;
    if (next === from) return;
    changeScreenAnimated(from, next, () => setScreenNow(next));
  };

  // Un nouvel écran démarre toujours en haut de page.
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [screen]);
  const { login, logout, isStudent } = useAuth();

  const handleLogout = () => {
    if (isStudent) clearDevice(); // un élève qui se déconnecte "oublie" l'appareil
    logout();
    setScreen("who");
  };

  const renderScreen = () => {
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
  };

  return (
    <>
      {supportsViewTransitions ? (
        renderScreen()
      ) : (
        <div key={screen} className="screen-enter">
          {renderScreen()}
        </div>
      )}
      {NAV_SCREENS.includes(screen) && <GuideBot screen={screen} onNavigate={setScreen} />}
      {NAV_SCREENS.includes(screen) && (
        <BottomNav
          canGoBack={screen !== "dashboard"}
          onBack={() => setScreen("dashboard")}
          onHome={() => setScreen("dashboard")}
          onLogout={handleLogout}
        />
      )}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
