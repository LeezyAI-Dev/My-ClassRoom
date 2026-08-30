import React, { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  // user = { id, username, role } où role vaut "developer" ou "student"
  const [user, setUser] = useState(null);

  // Conserve l'API historique (login(token, developerInfo)) utilisée par DevAuth :
  // si aucun rôle n'est précisé, on considère qu'il s'agit d'un compte développeur.
  const login = (newToken, userInfo, role = "developer") => {
    setToken(newToken);
    setUser({ ...userInfo, role });
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  const isDeveloper = Boolean(token && user && user.role === "developer");
  const isStudent = Boolean(token && user && user.role === "student");

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        // Alias conservé pour ne pas casser le code existant qui utilise "developer".
        developer: isDeveloper ? user : null,
        isDeveloper,
        isStudent,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
