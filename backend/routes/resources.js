const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const multer = require("multer");
const db = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const MAX_PDF_SIZE = 20 * 1024 * 1024; // 20 Mo

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    // Nom de fichier aléatoire : on ne fait jamais confiance au nom fourni par le client.
    const unique = crypto.randomBytes(16).toString("hex");
    cb(null, `${unique}.pdf`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_PDF_SIZE },
  fileFilter: (req, file, cb) => {
    const hasPdfMime = file.mimetype === "application/pdf";
    const hasPdfExt = path.extname(file.originalname).toLowerCase() === ".pdf";
    if (!hasPdfMime || !hasPdfExt) {
      return cb(new Error("Seuls les fichiers PDF sont acceptés."));
    }
    cb(null, true);
  },
});

function isHttpUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function findSubject(subjectId) {
  return db.prepare("SELECT id FROM subjects WHERE id = ?").get(subjectId);
}

// GET /api/subjects/:subjectId/resources
// Consultation libre : tout le monde peut voir les ressources d'une matière.
router.get("/:subjectId/resources", (req, res) => {
  const { subjectId } = req.params;

  if (!findSubject(subjectId)) {
    return res.status(404).json({ error: "Matière introuvable." });
  }

  const resources = db
    .prepare(
      `SELECT id, subject_id, type, title, url, original_filename, created_at
       FROM subject_resources
       WHERE subject_id = ?
       ORDER BY created_at DESC`
    )
    .all(subjectId);

  res.json({ resources });
});

// POST /api/subjects/:subjectId/resources/pdf
// Upload d'un PDF pour une matière. Réservé au compte développeur.
router.post("/:subjectId/resources/pdf", requireAuth, (req, res) => {
  upload.single("file")(req, res, (uploadErr) => {
    if (uploadErr) {
      if (uploadErr.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ error: "Le fichier dépasse la taille maximale autorisée (20 Mo)." });
      }
      return res.status(400).json({ error: uploadErr.message || "Erreur lors de l'upload du fichier." });
    }

    const { subjectId } = req.params;
    const cleanup = () => {
      if (req.file) fs.unlink(req.file.path, () => {});
    };

    if (!findSubject(subjectId)) {
      cleanup();
      return res.status(404).json({ error: "Matière introuvable." });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Aucun fichier PDF fourni (champ \"file\" attendu)." });
    }

    const title = (req.body.title || req.file.originalname.replace(/\.pdf$/i, "")).trim();
    if (!title) {
      cleanup();
      return res.status(400).json({ error: "Le titre est requis." });
    }

    const publicUrl = `/uploads/${req.file.filename}`;

    const info = db
      .prepare(
        `INSERT INTO subject_resources (subject_id, type, title, url, file_path, original_filename)
         VALUES (?, 'pdf', ?, ?, ?, ?)`
      )
      .run(subjectId, title, publicUrl, req.file.filename, req.file.originalname);

    const created = db.prepare("SELECT * FROM subject_resources WHERE id = ?").get(info.lastInsertRowid);
    res.status(201).json({ message: "PDF ajouté.", resource: created });
  });
});

// POST /api/subjects/:subjectId/resources/link
// Ajout d'un lien de redirection pour une matière. Réservé au compte développeur.
router.post("/:subjectId/resources/link", requireAuth, (req, res) => {
  const { subjectId } = req.params;

  if (!findSubject(subjectId)) {
    return res.status(404).json({ error: "Matière introuvable." });
  }

  const { title, url } = req.body || {};

  if (!title || !title.trim()) {
    return res.status(400).json({ error: "Le titre est requis." });
  }
  if (!url || !isHttpUrl(url.trim())) {
    return res.status(400).json({ error: "Le lien doit être une URL valide (http:// ou https://)." });
  }

  const info = db
    .prepare(
      `INSERT INTO subject_resources (subject_id, type, title, url)
       VALUES (?, 'link', ?, ?)`
    )
    .run(subjectId, title.trim(), url.trim());

  const created = db.prepare("SELECT * FROM subject_resources WHERE id = ?").get(info.lastInsertRowid);
  res.status(201).json({ message: "Lien ajouté.", resource: created });
});

module.exports = { router, UPLOAD_DIR };
