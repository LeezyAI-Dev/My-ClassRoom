const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db");

const router = express.Router();
const SALT_ROUNDS = 12;

// POST /api/auth/student/register
router.post("/register", async (req, res) => {
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

  const existing = db.prepare("SELECT id FROM students WHERE username = ?").get(username.trim());
  if (existing) {
    return res.status(409).json({ error: "Cet identifiant est déjà utilisé." });
  }

  try {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const info = db
      .prepare("INSERT INTO students (username, password_hash) VALUES (?, ?)")
      .run(username.trim(), passwordHash);

    return res.status(201).json({
      message: "Compte élève créé avec succès.",
      student: { id: info.lastInsertRowid, username: username.trim() },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erreur serveur lors de l'inscription." });
  }
});

// POST /api/auth/student/login
router.post("/login", async (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: "Identifiant et mot de passe sont requis." });
  }

  const student = db.prepare("SELECT * FROM students WHERE username = ?").get(username.trim());
  if (!student) {
    return res.status(401).json({ error: "Identifiant ou mot de passe incorrect." });
  }

  const match = await bcrypt.compare(password, student.password_hash);
  if (!match) {
    return res.status(401).json({ error: "Identifiant ou mot de passe incorrect." });
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
});

module.exports = router;
