// Mémoire de l'appareil : identifiant de l'élève + jeton d'appareil (90 jours).
// Le mot de passe n'est JAMAIS stocké ici. Le jeton seul ne sert qu'à la connexion par code PIN.
const TOKEN_KEY = "mc_device_token";
const USER_KEY = "mc_device_username";

export function getDevice() {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const username = localStorage.getItem(USER_KEY);
    return token && username ? { token, username } : null;
  } catch (err) {
    return null;
  }
}

export function saveDevice(token, username) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, username);
  } catch (err) {
    // stockage indisponible : on continue, l'élève devra se reconnecter par mot de passe
  }
}

export function clearDevice() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch (err) {
    // rien à faire
  }
}
