const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const multer = require("multer");
const db = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const BANNER_DIR = path.join(__dirname, "..", "uploads", "banners");
if (!fs.existsSync(BANNER_DIR)) {
  fs.mkdirSync(BANNER_DIR, { recursive: true });
}

const MAX_IMAGE_SIZE = 8 * 1024 * 1024; // 8 Mo
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_EXT = [".jpg", ".jpeg", ".png", ".webp"];

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, BANNER_DIR),
  filename: (req, file, cb) => {
    // Nom de fichier aléatoire : on ne fait jamais confiance au nom fourni par le client.
    const unique = crypto.randomBytes(16).toString("hex");
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    cb(null, `${unique}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_IMAGE_SIZE },
  fileFilter: (req, file, cb) => {
    const hasAllowedMime = ALLOWED_MIME.includes(file.mimetype);
    const hasAllowedExt = ALLOWED_EXT.includes(path.extname(file.originalname).toLowerCase());
    if (!hasAllowedMime || !hasAllowedExt) {
      return cb(new Error("Seules les images JPG, PNG ou WEBP sont acceptées."));
    }
    cb(null, true);
  },
});

// GET /api/banner
// Consultation libre : tout le monde (élève, développeur, visiteur) voit les images de la bannière.
router.get("/", (req, res) => {
  const images = db
    .prepare(
      `SELECT id, url, original_filename, position, created_at
       FROM banner_images
       ORDER BY position ASC, created_at ASC`
    )
    .all();

  res.json({ images });
});

// POST /api/banner
// Ajout d'une image à la bannière défilante. Réservé au compte développeur.
router.post("/", requireAuth, (req, res) => {
  upload.single("file")(req, res, (uploadErr) => {
    if (uploadErr) {
      if (uploadErr.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ error: "L'image dépasse la taille maximale autorisée (8 Mo)." });
      }
      return res.status(400).json({ error: uploadErr.message || "Erreur lors de l'upload de l'image." });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Aucune image fournie (champ \"file\" attendu)." });
    }

    const publicUrl = `/uploads/banners/${req.file.filename}`;
    const maxPositionRow = db.prepare("SELECT MAX(position) AS maxPos FROM banner_images").get();
    const nextPosition = (maxPositionRow.maxPos ?? -1) + 1;

    const info = db
      .prepare(
        `INSERT INTO banner_images (url, file_path, original_filename, position)
         VALUES (?, ?, ?, ?)`
      )
      .run(publicUrl, req.file.filename, req.file.originalname, nextPosition);

    const created = db.prepare("SELECT * FROM banner_images WHERE id = ?").get(info.lastInsertRowid);
    res.status(201).json({ message: "Image ajoutée à la bannière.", image: created });
  });
});

// DELETE /api/banner/:id
// Suppression d'une image de la bannière (entrée en base + fichier sur disque). Réservé au développeur.
router.delete("/:id", requireAuth, (req, res) => {
  const { id } = req.params;
  const image = db.prepare("SELECT * FROM banner_images WHERE id = ?").get(id);

  if (!image) {
    return res.status(404).json({ error: "Image introuvable." });
  }

  db.prepare("DELETE FROM banner_images WHERE id = ?").run(id);

  if (image.file_path) {
    fs.unlink(path.join(BANNER_DIR, image.file_path), () => {});
  }

  res.json({ message: "Image supprimée." });
});

module.exports = { router, BANNER_DIR };
