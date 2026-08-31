const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { client } = require("../db");

const router = express.Router();
const SALT_ROUNDS = 12;

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const existingCountResult = await client.execute("SELECT COUNT(*) as count FROM developers");
    const existingCount = existingCountResult.rows[0].count;
    if (existingCount >= 1) {
      return res.status(403).json({ error: "Un compte développeur existe déjà. Les inscriptions sont fermées." });
    }

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
      sql: "SELECT id FROM developers WHERE username = ?",
      args: [username.trim()],
    });
    if (existingResult.rows.length > 0) {
      return res.status(409).json({ error: "Cet identifiant est déjà utilisé." });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const insertResult = await client.execute({
      sql: "INSERT INTO developers (username, password_hash) VALUES (?, ?)",
      args: [username.trim(), passwordHash],
    });

    return res.status(201).json({
      message: "Compte développeur créé avec succès.",
      developer: { id: Number(insertResult.lastInsertRowid), username: username.trim() },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erreur serveur lors de l'inscription." });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({ error: "Identifiant et mot de passe sont requis." });
    }

    const result = await client.execute({
      sql: "SELECT * FROM developers WHERE username = ?",
      args: [username.trim()],
    });
    const developer = result.rows[0];

    if (!developer) {
      return res.status(401).json({ error: "Identifiant ou mot de passe incorrect." });
    }

    const match = await bcrypt.compare(password, developer.password_hash);
    if (!match) {
      return res.status(401).json({ error: "Identifiant ou mot de passe incorrect." });
    }

    const token = jwt.sign(
      { id: developer.id, username: developer.username, role: "developer" },
      process.env.JWT_SECRET,
      { expiresIn: "12h" }
    );

    return res.json({
      message: "Connexion réussie.",
      token,
      developer: { id: developer.id, username: developer.username },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erreur serveur lors de la connexion." });
  }
});

module.exports = router;
