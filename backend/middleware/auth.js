const jwt = require("jsonwebtoken");

function decodeToken(req) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return undefined; // token présent mais invalide/expiré
  }
}

// Réservé au compte développeur : toutes les routes de modification (créer/éditer/supprimer)
// doivent utiliser ce middleware. Un token élève valide est explicitement rejeté ici.
function requireAuth(req, res, next) {
  const payload = decodeToken(req);

  if (payload === null) {
    return res.status(401).json({ error: "Token manquant." });
  }
  if (payload === undefined) {
    return res.status(401).json({ error: "Token invalide ou expiré." });
  }
  if (payload.role !== "developer") {
    return res.status(403).json({ error: "Accès réservé au compte développeur." });
  }

  req.developer = payload;
  next();
}

// Réservé au compte élève : utilisé uniquement si une route doit être accessible
// aux élèves connectés mais pas au grand public non authentifié.
function requireStudentAuth(req, res, next) {
  const payload = decodeToken(req);

  if (payload === null) {
    return res.status(401).json({ error: "Token manquant." });
  }
  if (payload === undefined) {
    return res.status(401).json({ error: "Token invalide ou expiré." });
  }
  if (payload.role !== "student") {
    return res.status(403).json({ error: "Accès réservé au compte élève." });
  }

  req.student = payload;
  next();
}

// Réservé aux comptes connectés, développeur OU élève (ex: le fil "EYES", où
// les deux rôles peuvent publier et consulter). req.actor = { type, id, username }.
function requireAnyAuth(req, res, next) {
  const payload = decodeToken(req);

  if (payload === null) {
    return res.status(401).json({ error: "Token manquant." });
  }
  if (payload === undefined) {
    return res.status(401).json({ error: "Token invalide ou expiré." });
  }
  if (payload.role !== "developer" && payload.role !== "student") {
    return res.status(403).json({ error: "Accès réservé aux comptes connectés." });
  }

  req.actor = { type: payload.role, id: payload.id, username: payload.username };
  next();
}

module.exports = { requireAuth, requireStudentAuth, requireAnyAuth };
