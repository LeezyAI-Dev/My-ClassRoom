// Stockage qui marche sur Web (localStorage) et sur Android (Capacitor WebView)
const KEYS = {
  TOKEN: "mc_token",
  USER: "mc_user",
  PIN: "mc_pin",
  USERNAME: "mc_username",
  ROLE: "mc_role",
};

export const pinStorage = {
  saveSession: (token, user) => {
    localStorage.setItem(KEYS.TOKEN, token);
    localStorage.setItem(KEYS.USER, JSON.stringify(user));
    localStorage.setItem(KEYS.USERNAME, user.username);
    localStorage.setItem(KEYS.ROLE, user.role);
  },
  getSession: () => {
    const token = localStorage.getItem(KEYS.TOKEN);
    const userRaw = localStorage.getItem(KEYS.USER);
    if (!token || !userRaw) return null;
    try {
      return { token, user: JSON.parse(userRaw) };
    } catch {
      return null;
    }
  },
  clearSession: () => {
    localStorage.removeItem(KEYS.TOKEN);
    localStorage.removeItem(KEYS.USER);
    // on garde username/role pour le flow forgot pin
  },
  savePin: (pin) => {
    // on stocke en clair mais obfusqué (base64) pour éviter lecture directe
    localStorage.setItem(KEYS.PIN, btoa(pin));
  },
  getPin: () => {
    const stored = localStorage.getItem(KEYS.PIN);
    if (!stored) return null;
    try {
      return atob(stored);
    } catch {
      return stored;
    }
  },
  hasPin: () => !!localStorage.getItem(KEYS.PIN),
  clearPin: () => {
    localStorage.removeItem(KEYS.PIN);
  },
  getUsername: () => localStorage.getItem(KEYS.USERNAME),
  getRole: () => localStorage.getItem(KEYS.ROLE),
  clearAll: () => {
    Object.values(KEYS).forEach(k => localStorage.removeItem(k));
  }
};
