const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { client } = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// Dossier uploads
const uploadDir = path.join(__dirname, "..", "uploads", "banners");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// GET toutes les bannières (public)
router.get("/", async (req, res) => {
  try {
    const result = await client.execute("SELECT * FROM banners ORDER BY created_at DESC");
    res.json({ banners: result.rows });
  } catch (e) {
    // Si table n'existe pas, on la crée et on renvoie vide
    if (/no such table|no table/i.test(e.message)) {
      await client.execute(`
        CREATE TABLE IF NOT EXISTS banners (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          image_url TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      return res.json({ banners: [] });
    }
    res.status(500).json({ error: e.message, banners: [] });
  }
});

// POST ajouter bannière (DEV only)
router.post("/", requireAuth, upload.single("image"), async (req, res) => {
  if (req.user.role !== "developer") return res.status(403).json({ error: "DEV only" });
  try {
    if (!req.file) return res.status(400).json({ error: "Pas de fichier" });
    const imageUrl = `/uploads/banners/${req.file.filename}`;
    await client.execute({
      sql: "INSERT INTO banners (image_url) VALUES (?)",
      args: [imageUrl],
    });
    res.json({ success: true, image_url: imageUrl });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE bannière (DEV only)
router.delete("/:id", requireAuth, async (req, res) => {
  if (req.user.role !== "developer") return res.status(403).json({ error: "DEV only" });
  try {
    const result = await client.execute({ sql: "SELECT image_url FROM banners WHERE id = ?", args: [req.params.id] });
    const banner = result.rows[0];
    if (banner) {
      const filePath = path.join(__dirname, "..", banner.image_url);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    await client.execute({ sql: "DELETE FROM banners WHERE id = ?", args: [req.params.id] });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
