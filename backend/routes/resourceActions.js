const express = require("express");
const path = require("path");
const fs = require("fs");
const { client } = require("../db");
const { requireAuth } = require("../middleware/auth");
const { UPLOAD_DIR } = require("./resources");

const router = express.Router();

// DELETE /api/resources/:id
// Supprime une ressource (pdf ou lien). Réservé au compte développeur.
// Si c'est un pdf, le fichier est aussi supprimé du disque.
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await client.execute({
      sql: "SELECT * FROM subject_resources WHERE id = ?",
      args: [id],
    });
    const resource = result.rows[0];

    if (!resource) {
      return res.status(404).json({ error: "Ressource introuvable." });
    }

    await client.execute({
      sql: "DELETE FROM subject_resources WHERE id = ?",
      args: [id],
    });

    if (resource.type === "pdf" && resource.file_path) {
      fs.unlink(path.join(UPLOAD_DIR, resource.file_path), () => {});
    }

    res.json({ message: "Ressource supprimée." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur lors de la suppression de la ressource." });
  }
});

module.exports = router;