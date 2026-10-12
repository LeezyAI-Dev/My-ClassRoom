const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const { client } = require("../db");

const router = express.Router();

// --- Crée la table grades au démarrage si elle n'existe pas ---
(async () => {
  try {
    await client.execute(`CREATE TABLE IF NOT EXISTS grades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_type TEXT NOT NULL CHECK (user_type IN ('developer', 'student')),
      user_id INTEGER NOT NULL,
      subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
      date_received TEXT NOT NULL,
      note_value TEXT NOT NULL,
      photo_url TEXT,
      file_path TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_type, user_id, subject_id)
    )`);
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_grades_user ON grades(user_type, user_id)`);
    console.log("✅ Table grades OK");
  } catch (e) {
    console.error("❌ Erreur création table grades:", e.message);
  }
})();

const uploadDir = path.join(__dirname, "..", "uploads", "grades");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `grade-${Date.now()}-${Math.round(Math.random()*1e9)}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpeg|png|webp|jpg)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error("Seules les images JPG/PNG/WEBP"));
  },
});

// --- AUTH souple : supporte developer et student ---
function authFlex(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.replace("Bearer ", "").trim();
    if (!token) return res.status(401).json({ error: "Non authentifié" });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // payload peut contenir { id, role } ou { userId, userType } ou { id, type }
    req.user = {
      id: payload.id || payload.userId || payload.user_id,
      userId: payload.id || payload.userId || payload.user_id,
      role: payload.role || payload.userType || payload.user_type || payload.type,
      userType: payload.role || payload.userType || payload.user_type || payload.type,
    };
    // normalise role
    if (!req.user.role) req.user.role = "student";
    if (req.user.role === "developer" || req.user.role === "dev") req.user.role = "developer";
    else req.user.role = req.user.role === "developer" ? "developer" : "student";
    req.user.userType = req.user.role;
    next();
  } catch (e) {
    return res.status(401).json({ error: "Token invalide" });
  }
}

// GET /api/grades
router.get("/", authFlex, async (req, res) => {
  try {
    const uid = req.user.id || req.user.userId;
    const utype = req.user.role || req.user.userType;
    const { rows } = await client.execute({
      sql: `SELECT g.*, s.name as subject_name, s.category as subject_category FROM grades g JOIN subjects s ON s.id = g.subject_id WHERE g.user_type = ? AND g.user_id = ?`,
      args: [utype, uid],
    });
    res.json({ grades: rows });
  } catch (e) {
    console.error("GET grades error:", e);
    res.status(500).json({ error: "Erreur chargement notes: " + e.message });
  }
});

// POST /api/grades
router.post("/", authFlex, upload.single("photo"), async (req, res) => {
  try {
    const uid = req.user.id || req.user.userId;
    const utype = req.user.role || req.user.userType;
    const { subject_id, date_received, note_value } = req.body;

    if (!subject_id || !date_received || !note_value) {
      return res.status(400).json({ error: "Matière, date et note obligatoires" });
    }
    if (!String(note_value).includes("/")) {
      return res.status(400).json({ error: "La note doit contenir un / exemple: 14/20" });
    }

    const existing = await client.execute({
      sql: "SELECT id FROM grades WHERE user_type = ? AND user_id = ? AND subject_id = ?",
      args: [utype, uid, Number(subject_id)],
    });
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "Cette matière a déjà une note verrouillée." });
    }

    let photoUrl = null;
    let filePath = null;
    if (req.file) {
      filePath = path.join("uploads", "grades", req.file.filename).replace(/\\/g, "/");
      photoUrl = `/uploads/grades/${req.file.filename}`;
    }

    const result = await client.execute({
      sql: `INSERT INTO grades (user_type, user_id, subject_id, date_received, note_value, photo_url, file_path) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [utype, uid, Number(subject_id), String(date_received), String(note_value), photoUrl, filePath],
    });

    const { rows } = await client.execute({
      sql: `SELECT g.*, s.name as subject_name, s.category as subject_category FROM grades g JOIN subjects s ON s.id = g.subject_id WHERE g.id = ?`,
      args: [Number(result.lastInsertRowid)],
    });

    res.status(201).json({ grade: rows[0] });
  } catch (e) {
    console.error("POST grades error:", e);
    res.status(500).json({ error: e.message || "Erreur création" });
  }
});

// DELETE /api/grades/:id
router.delete("/:id", authFlex, async (req, res) => {
  try {
    const uid = req.user.id || req.user.userId;
    const utype = req.user.role || req.user.userType;
    const id = Number(req.params.id);

    const { rows } = await client.execute({ sql: "SELECT * FROM grades WHERE id = ?", args: [id] });
    if (!rows.length) return res.status(404).json({ error: "Note introuvable" });
    const grade = rows[0];

    if (utype !== "developer" && (grade.user_id !== uid || grade.user_type !== utype)) {
      return res.status(403).json({ error: "Non autorisé" });
    }

    if (grade.file_path) {
      const full = path.join(__dirname, "..", grade.file_path);
      if (fs.existsSync(full)) fs.unlinkSync(full);
    }

    await client.execute({ sql: "DELETE FROM grades WHERE id = ?", args: [id] });
    res.json({ ok: true });
  } catch (e) {
    console.error("DELETE grades error:", e);
    res.status(500).json({ error: "Erreur suppression" });
  }
});

module.exports = router;
