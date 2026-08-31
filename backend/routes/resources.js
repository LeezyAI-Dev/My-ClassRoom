const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const multer = require("multer");
const { client } = require("../db");
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

async function findSubject(subjectId) {
  const result = await client.execute({
    sql: "SELECT id FROM subjects WHERE id = ?",
    args: [subjectId],
  });
  return result.rows[0];
}

// GET /api/subjects/:subjectId/resources
router.get("/:subjectId/resources", async (req, res) => {
  try {
    const { subjectId } = req.params;

    if (!(await findSubject(subjectId))) {
      return res.status(404).json({ error: "Matière introuvable." });
    }

    const result = await client.execute({
      sql: `SELECT id, subject_id, type, title, url, original_filename, created_at
            FROM subject_resources
            WHERE subject_id = ?
            ORDER BY created_at DESC`,
      args: [subjectId],
    });

    res.json({ resources: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur lors de la récupération des ressources." });
  }
});

// POST /api/subjects/:subjectId/resources/pdf
router.post("/:subjectId/resources/pdf", requireAuth, (req, res) => {
  upload.single("file")(req, res, async (uploadErr) => {
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

    try {
      if (!(await findSubject(subjectId))) {
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

      const insertResult = await client.execute({
        sql: `INSERT INTO subject_resources (subject_id, type, title, url, file_path, original_filename)
              VALUES (?, 'pdf', ?, ?, ?, ?)`,
        args: [subjectId, title, publicUrl, req.file.filename, req.file.originalname],
      });

      const newId = Number(insertResult.lastInsertRowid);
      const created = await client.execute({
        sql: "SELECT * FROM subject_resources WHERE id = ?",
        args: [newId],
      });

      res.status(201).json({ message: "PDF ajouté.", resource: created.rows[0] });
    } catch (err) {
      cleanup();
      console.error(err);
      res.status(500).json({ error: "Erreur serveur lors de l'ajout du PDF." });
    }
  });
});

// POST /api/subjects/:subjectId/resources/link
router.post("/:subjectId/resources/link", requireAuth, async (req, res) => {
  try {
    const { subjectId } = req.params;

    if (!(await findSubject(subjectId))) {
      return res.status(404).json({ error: "Matière introuvable." });
    }

    const { title, url } = req.body || {};

    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Le titre est requis." });
    }
    if (!url || !isHttpUrl(url.trim())) {
      return res.status(400).json({ error: "Le lien doit être une URL valide (http:// ou https://)." });
    }

    const insertResult = await client.execute({
      sql: `INSERT INTO subject_resources (subject_id, type, title, url)
            VALUES (?, 'link', ?, ?)`,
      args: [subjectId, title.trim(), url.trim()],
    });

    const newId = Number(insertResult.lastInsertRowid);
    const created = await client.execute({
      sql: "SELECT * FROM subject_resources WHERE id = ?",
      args: [newId],
    });

    res.status(201).json({ message: "Lien ajouté.", resource: created.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur lors de l'ajout du lien." });
  }
});

module.exports = { router, UPLOAD_DIR };
