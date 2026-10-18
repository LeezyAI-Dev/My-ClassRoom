const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { client } = require("../db");
const { requireStudentAuth } = require("../middleware/auth");

const router = express.Router();
const SALT_ROUNDS = 12;

// --- Code PIN ---
const PIN_REGEX = /^\d{4}$/;
const MAX_PIN_ATTEMPTS = 5; // essais ratés avant blocage
const PIN_LOCK_MINUTES = 5; // durée du blocage
const DEVICE_TOKEN_DAYS = 90; // durée de vie du "jeton d'appareil"

router.post("/register", async (req, res) => {
  try {
    const { username, password, confirmPassword } = req.body || {};

    if (!username || !password || !confirmPassword) {
      return res.status(400).json({ error: "Identifiant, mot de passe et confirmation sont requis." });
    }
    if (username.trim().length < 3) {
      return res.status(400).json({ error: "L'identifiant doit contenir au moins 3 caractères." });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "Le mot de passe doit contenir au moins 8 caractères." });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Les mots de passe ne correspondent pas." });
    }

    const existingResult = await client.execute({
      sql: "SELECT id FROM students WHERE username = ?",
      args: [username.trim()],
    });
    if (existingResult.rows.length > 0) {
      return res.status(409).json({ error: "Cet identifiant est déjà utilisé." });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const insertResult = await client.execute({
      sql: "INSERT INTO students (username, password_hash) VALUES (?, ?)",
      args: [username.trim(), passwordHash],
    });

    return res.status(201).json({
      message: "Compte élève créé avec succès.",
      student: { id: Number(insertResult.lastInsertRowid), username: username.trim() },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erreur serveur lors de l'inscription." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({ error: "Identifiant et mot de passe sont requis." });
    }

    const result = await client.execute({
      sql: "SELECT * FROM students WHERE username = ?",
      args: [username.trim()],
    });
    const student = result.rows[0];

    if (!student) {
      return res.status(401).json({ error: "Identifiant ou mot de passe incorrect." });
    }

    const match = await bcrypt.compare(password, student.password_hash);
    if (!match) {
      return res.status(401).json({ error: "Identifiant ou mot de passe incorrect." });
    }

    if (student.suspended) {
      return res.status(403).json({ error: "Compte suspendu. Contactez l'administration." });
    }

    const token = jwt.sign(
      { id: student.id, username: student.username, role: "student" },
      process.env.JWT_SECRET,
      { expiresIn: "12h" }
    );

    return res.json({
      message: "Connexion réussie.",
      token,
      student: { id: student.id, username: student.username },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erreur serveur lors de la connexion." });
  }
});

// Définir (ou redéfinir) son code PIN. Exige une session élève valide, donc un mot de passe
// tout juste saisi : c'est aussi ce qui sert au "PIN oublié".
// Renvoie un jeton d'appareil (90 jours) que le téléphone garde pour les prochaines ouvertures.
router.post("/pin/set", requireStudentAuth, async (req, res) => {
  try {
    const { pin } = req.body || {};
    if (typeof pin !== "string" || !PIN_REGEX.test(pin)) {
      return res.status(400).json({ error: "Le code PIN doit contenir exactement 4 chiffres." });
    }

    const result = await client.execute({
      sql: "SELECT id, username, suspended FROM students WHERE id = ?",
      args: [req.student.id],
    });
    const student = result.rows[0];
    if (!student) {
      return res.status(401).json({ error: "Compte introuvable." });
    }
    if (student.suspended) {
      return res.status(403).json({ error: "Compte suspendu. Contactez l'administration." });
    }

    const pinHash = await bcrypt.hash(pin, SALT_ROUNDS);
    await client.execute({
      sql: "UPDATE students SET pin_hash = ?, pin_failed_attempts = 0, pin_locked_until = NULL WHERE id = ?",
      args: [pinHash, student.id],
    });

    const deviceToken = jwt.sign(
      { id: student.id, username: student.username, role: "student_device" },
      process.env.JWT_SECRET,
      { expiresIn: `${DEVICE_TOKEN_DAYS}d` }
    );

    return res.json({ message: "Code PIN enregistré.", deviceToken });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erreur serveur lors de l'enregistrement du code PIN." });
  }
});

// Connexion par code PIN : le téléphone envoie son jeton d'appareil (en-tête Authorization)
// et le PIN saisi. Le jeton d'appareil seul ne donne accès à rien d'autre (rôle "student_device").
router.post("/pin/login", async (req, res) => {
  try {
    const header = req.headers.authorization || "";
    const deviceToken = header.startsWith("Bearer ") ? header.slice(7) : null;

    let device = null;
    if (deviceToken) {
      try {
        const payload = jwt.verify(deviceToken, process.env.JWT_SECRET);
        if (payload.role === "student_device") device = payload;
      } catch (err) {
        device = null;
      }
    }
    if (!device) {
      return res.status(401).json({
        error: "Appareil non reconnu. Connecte-toi avec ton mot de passe.",
        code: "DEVICE_INVALID",
      });
    }

    const { pin } = req.body || {};
    if (typeof pin !== "string" || !PIN_REGEX.test(pin)) {
      return res.status(400).json({ error: "Le code PIN doit contenir exactement 4 chiffres." });
    }

    const result = await client.execute({
      sql: "SELECT * FROM students WHERE id = ?",
      args: [device.id],
    });
    const student = result.rows[0];

    if (!student || !student.pin_hash) {
      return res.status(401).json({
        error: "Appareil non reconnu. Connecte-toi avec ton mot de passe.",
        code: "DEVICE_INVALID",
      });
    }
    if (student.suspended) {
      return res.status(403).json({
        error: "Compte suspendu. Contactez l'administration.",
        code: "SUSPENDED",
      });
    }

    const now = Date.now();
    const lockedUntil = Number(student.pin_locked_until || 0);
    if (lockedUntil > now) {
      const minutes = Math.ceil((lockedUntil - now) / 60000);
      return res.status(429).json({
        error: `Trop d'essais. Réessaie dans ${minutes} min, ou utilise « Code PIN oublié ? ».`,
        code: "LOCKED",
        retryAfterSeconds: Math.ceil((lockedUntil - now) / 1000),
      });
    }

    const match = await bcrypt.compare(pin, student.pin_hash);
    if (!match) {
      const attempts = Number(student.pin_failed_attempts || 0) + 1;
      if (attempts >= MAX_PIN_ATTEMPTS) {
        await client.execute({
          sql: "UPDATE students SET pin_failed_attempts = 0, pin_locked_until = ? WHERE id = ?",
          args: [now + PIN_LOCK_MINUTES * 60000, student.id],
        });
        return res.status(429).json({
          error: `Trop d'essais. Réessaie dans ${PIN_LOCK_MINUTES} min, ou utilise « Code PIN oublié ? ».`,
          code: "LOCKED",
          retryAfterSeconds: PIN_LOCK_MINUTES * 60,
        });
      }
      await client.execute({
        sql: "UPDATE students SET pin_failed_attempts = ? WHERE id = ?",
        args: [attempts, student.id],
      });
      const remaining = MAX_PIN_ATTEMPTS - attempts;
      return res.status(401).json({
        error: `Code PIN incorrect. Il te reste ${remaining} essai${remaining > 1 ? "s" : ""}.`,
        code: "WRONG_PIN",
        remaining,
      });
    }

    await client.execute({
      sql: "UPDATE students SET pin_failed_attempts = 0, pin_locked_until = NULL WHERE id = ?",
      args: [student.id],
    });

    const token = jwt.sign(
      { id: student.id, username: student.username, role: "student" },
      process.env.JWT_SECRET,
      { expiresIn: "12h" }
    );

    return res.json({
      message: "Connexion réussie.",
      token,
      student: { id: student.id, username: student.username },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erreur serveur lors de la connexion par code PIN." });
  }
});

module.exports = router;