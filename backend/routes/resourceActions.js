const express = require("express");
const path = require("path");
const fs = require("fs");
const db = require("../db");
const { requireAuth } = require("../middleware/auth");
const { UPLOAD_DIR } = require("./resources");

const router = express.Router();

// DELETE /api/resources/:id
// Supprime une ressource (pdf ou lien). Réservé au compte développeur.
// Si c'est un pdf, le fichier est aussi supprimé du disque.
router.delete("/:id", requireAuth, (req, res) => {
  const { id } = req.params;
  const resource = db.prepare("SELECT * FROM subject_resources WHERE id = ?").get(id);

  if (!resource) {
    return res.status(404).json({ error: "Ressource introuvable." });
  }

  db.prepare("DELETE FROM subject_resources WHERE id = ?").run(id);

  if (resource.type === "pdf" && resource.file_path) {
    fs.unlink(path.join(UPLOAD_DIR, resource.file_path), () => {});
  }

  res.json({ message: "Ressource supprimée." });
});

module.exports = router;
