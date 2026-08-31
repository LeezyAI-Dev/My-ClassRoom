const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { client } = require("../db");

const router = express.Router();
const SALT_ROUNDS = 12;

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

module.exports = router;