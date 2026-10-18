const express = require("express");
const multer = require("multer");
const { client } = require("../db");
const { requireAnyAuth } = require("../middleware/auth");

// Registre de notes : PRIVÉ. Chaque utilisateur (développeur ou élève) ne voit, ne modifie
// et ne supprime que ses propres notes. L'identité vient TOUJOURS du jeton (req.actor),
// jamais d'un paramètre envoyé par l'appli : impossible de demander les notes d'un autre.
const router = express.Router();
router.use(requireAnyAuth);

const MAX_PHOTO_SIZE = 4 * 1024 * 1024; // 4 Mo (l'appli compresse déjà la photo à ~300 Ko)

// Photo gardée en mémoire puis stockée dans Turso (le disque de Render est éphémère).
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_PHOTO_SIZE, files: 1 },
});

function parseUpload(req, res, next) {
  upload.single("file")(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ error: "La photo dépasse la taille maximale autorisée (4 Mo)." });
      }
      return res.status(400).json({ error: err.message || "Erreur lors de l'envoi de la photo." });
    }
    next();
  });
}

// On vérifie le contenu réel du fichier (pas seulement ce que prétend le navigateur).
function detectImageMime(buf) {
  if (!buf || buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  return null;
}

function parseScale(raw) {
  const n = Number(raw);
  return n === 10 || n === 20 ? n : null;
}

function parseScore(raw, scale) {
  const text = String(raw ?? "").trim().replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(text)) return null;
  const n = Number(text);
  return n >= 0 && n <= scale ? n : null;
}

function parseId(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

const PUBLIC_COLUMNS = `id, subject_id, score, scale,
  (photo_data IS NOT NULL) AS has_photo, created_at, updated_at`;

function toPublic(row) {
  return {
    id: Number(row.id),
    subject_id: Number(row.subject_id),
    score: Number(row.score),
    scale: Number(row.scale),
    has_photo: Boolean(Number(row.has_photo)),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

async function subjectExists(subjectId) {
  const r = await client.execute({ sql: "SELECT id FROM subjects WHERE id = ?", args: [subjectId] });
  return r.rows.length > 0;
}

async function findOwnGrade(req, gradeId) {
  const r = await client.execute({
    sql: `SELECT ${PUBLIC_COLUMNS} FROM grade_entries WHERE id = ? AND owner_type = ? AND owner_id = ?`,
    args: [gradeId, req.actor.type, req.actor.id],
  });
  return r.rows[0] || null;
}

// GET /api/grades/counts -> { counts: { "<subjectId>": nombre } }
router.get("/counts", async (req, res) => {
  try {
    const r = await client.execute({
      sql: `SELECT subject_id, COUNT(*) AS n FROM grade_entries
            WHERE owner_type = ? AND owner_id = ? GROUP BY subject_id`,
      args: [req.actor.type, req.actor.id],
    });
    const counts = {};
    r.rows.forEach((row) => {
      counts[Number(row.subject_id)] = Number(row.n);
    });
    res.json({ counts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur lors de la récupération du registre." });
  }
});

// GET /api/grades/subject/:subjectId -> mes notes de cette matière (sans la photo)
router.get("/subject/:subjectId", async (req, res) => {
  try {
    const subjectId = parseId(req.params.subjectId);
    if (!subjectId) return res.status(400).json({ error: "Matière invalide." });

    const r = await client.execute({
      sql: `SELECT ${PUBLIC_COLUMNS} FROM grade_entries
            WHERE owner_type = ? AND owner_id = ? AND subject_id = ?
            ORDER BY id DESC`,
      args: [req.actor.type, req.actor.id, subjectId],
    });
    res.json({ grades: r.rows.map(toPublic) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur lors de la récupération des notes." });
  }
});

// POST /api/grades/subject/:subjectId  (multipart : score, scale, file optionnel)
router.post("/subject/:subjectId", parseUpload, async (req, res) => {
  try {
    const subjectId = parseId(req.params.subjectId);
    if (!subjectId || !(await subjectExists(subjectId))) {
      return res.status(404).json({ error: "Matière introuvable." });
    }

    const scale = parseScale(req.body.scale);
    if (!scale) return res.status(400).json({ error: "Le barème doit être 10 ou 20." });

    const score = parseScore(req.body.score, scale);
    if (score === null) {
      return res.status(400).json({ error: `La note doit être un nombre entre 0 et ${scale}.` });
    }

    let photoData = null;
    let photoMime = null;
    if (req.file) {
      photoMime = detectImageMime(req.file.buffer);
      if (!photoMime) {
        return res.status(400).json({ error: "La photo doit être une image JPG, PNG ou WEBP." });
      }
      photoData = req.file.buffer.toString("base64");
    }

    const ins = await client.execute({
      sql: `INSERT INTO grade_entries (owner_type, owner_id, subject_id, score, scale, photo_data, photo_mime)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [req.actor.type, req.actor.id, subjectId, score, scale, photoData, photoMime],
    });

    const created = await findOwnGrade(req, Number(ins.lastInsertRowid));
    res.status(201).json({ message: "Note enregistrée.", grade: toPublic(created) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur lors de l'enregistrement de la note." });
  }
});

// GET /api/grades/:id/photo -> l'image (uniquement pour son propriétaire)
router.get("/:id/photo", async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ error: "Note invalide." });

    const r = await client.execute({
      sql: `SELECT photo_data, photo_mime FROM grade_entries
            WHERE id = ? AND owner_type = ? AND owner_id = ?`,
      args: [id, req.actor.type, req.actor.id],
    });
    const row = r.rows[0];
    if (!row || !row.photo_data) return res.status(404).json({ error: "Photo introuvable." });

    res.set("Content-Type", row.photo_mime || "image/jpeg");
    res.set("Cache-Control", "private, no-store"); // confidentiel : rien n'est gardé dans le cache
    res.send(Buffer.from(row.photo_data, "base64"));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur lors de la récupération de la photo." });
  }
});

// PUT /api/grades/:id  (multipart : score, scale, file optionnel, removePhoto optionnel)
router.put("/:id", parseUpload, async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id || !(await findOwnGrade(req, id))) {
      return res.status(404).json({ error: "Note introuvable." });
    }

    const scale = parseScale(req.body.scale);
    if (!scale) return res.status(400).json({ error: "Le barème doit être 10 ou 20." });

    const score = parseScore(req.body.score, scale);
    if (score === null) {
      return res.status(400).json({ error: `La note doit être un nombre entre 0 et ${scale}.` });
    }

    let sql = "UPDATE grade_entries SET score = ?, scale = ?, updated_at = datetime('now')";
    const args = [score, scale];

    if (req.file) {
      const mime = detectImageMime(req.file.buffer);
      if (!mime) return res.status(400).json({ error: "La photo doit être une image JPG, PNG ou WEBP." });
      sql += ", photo_data = ?, photo_mime = ?";
      args.push(req.file.buffer.toString("base64"), mime);
    } else if (req.body.removePhoto === "1") {
      sql += ", photo_data = NULL, photo_mime = NULL";
    }

    sql += " WHERE id = ? AND owner_type = ? AND owner_id = ?";
    args.push(id, req.actor.type, req.actor.id);
    await client.execute({ sql, args });

    const updated = await findOwnGrade(req, id);
    res.json({ message: "Note modifiée.", grade: toPublic(updated) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur lors de la modification de la note." });
  }
});

// DELETE /api/grades/:id
router.delete("/:id", async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id || !(await findOwnGrade(req, id))) {
      return res.status(404).json({ error: "Note introuvable." });
    }
    await client.execute({
      sql: "DELETE FROM grade_entries WHERE id = ? AND owner_type = ? AND owner_id = ?",
      args: [id, req.actor.type, req.actor.id],
    });
    res.json({ message: "Note supprimée." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur lors de la suppression de la note." });
  }
});

module.exports = router;
