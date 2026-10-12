import React, { createContext, useContext, useState, useEffect } from "react";
import { pinStorage } from "../utils/pinStorage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const [hasPin, setHasPin] = useState(false);
  const [needsPinSetup, setNeedsPinSetup] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const session = pinStorage.getSession();
    if (session) {
      setToken(session.token);
      setUser(session.user);
      if (pinStorage.hasPin()) {
        setHasPin(true);
        setIsLocked(true);
      } else {
        setNeedsPinSetup(true);
      }
    }
    setIsLoading(false);
  }, []);

  const login = (newToken, userInfo, role = "developer") => {
    const fullUser = { ...userInfo, role };
    setToken(newToken);
    setUser(fullUser);
    pinStorage.saveSession(newToken, fullUser);
    if (pinStorage.hasPin()) {
      setHasPin(true);
      setIsLocked(false);
    } else {
      setNeedsPinSetup(true);
    }
  };

  const setupPin = (pin) => {
    pinStorage.savePin(pin);
    setHasPin(true);
    setNeedsPinSetup(false);
    setIsLocked(false);
  };

  const verifyPin = (pin) => {
    const realPin = pinStorage.getPin();
    if (pin === realPin) {
      setIsLocked(false);
      return true;
    }
    return false;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setIsLocked(false);
    setHasPin(false);
    setNeedsPinSetup(false);
    pinStorage.clearAll();
  };

  const isDeveloper = Boolean(token && user && user.role === "developer");
  const isStudent = Boolean(token && user && user.role === "student");

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        developer: isDeveloper ? user : null,
        isDeveloper,
        isStudent,
        isLocked,
        hasPin,
        needsPinSetup,
        isLoading,
        login,
        logout,
        setupPin,
        verifyPin,
        clearPinOnly: () => {
          pinStorage.clearPin();
          setHasPin(false);
          setNeedsPinSetup(true);
          setIsLocked(false);
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    // Retourne un objet vide au lieu de null pour éviter le crash destructuring
    return null;
  }
  return ctx;
}
