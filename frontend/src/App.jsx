import { useAuth } from "./context/AuthContext";
import PinSetup from "./pages/PinSetup";
import PinLock from "./pages/PinLock";
// ... tes autres imports

function AppContent() {
  const { token, isLoading, isLocked, needsPinSetup, setupPin, verifyPin, logout } = useAuth();

  if (isLoading) return <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center text-white">Chargement...</div>;

  // 1. Si session existe mais PIN verrouillé
  if (token && isLocked) {
    return <PinLock onUnlock={verifyPin} onLogout={logout} />;
  }

  // 2. Si session existe mais pas de PIN encore créé
  if (token && needsPinSetup) {
    return <PinSetup onComplete={setupPin} onCancel={() => {}} />;
  }

  // 3. Sinon ton routing normal (WhoAreYou, Auth, Dashboard...)
  return <TonRoutingNormal />;
}