const express = require("express");
const { client } = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// Liste des élèves inscrits : réservé au développeur (un jeton élève est refusé en 403).
// On ne renvoie JAMAIS password_hash.
router.get("/", requireAuth, async (req, res) => {
  try {
    const { rows } = await client.execute(
      "SELECT id, username, suspended, created_at FROM students ORDER BY created_at DESC, id DESC"
    );
    const students = rows.map((r) => ({
      id: Number(r.id),
      username: r.username,
      suspended: Number(r.suspended) === 1,
      created_at: r.created_at, // UTC, converti à l'affichage côté frontend
    }));
    res.json({ total: students.length, students });
  } catch (err) {
    console.error("Erreur GET /api/students :", err);
    res.status(500).json({ error: "Une erreur est survenue." });
  }
});

// Suppression d'un élève (développeur uniquement). IRRÉVERSIBLE.
// Supprime aussi tout ce que cet élève a laissé dans EYES (publications, commentaires, likes, vues),
// ainsi que les commentaires/likes/vues des autres sur ses publications.
router.delete("/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "Identifiant invalide." });
  }

  try {
    const found = await client.execute({
      sql: "SELECT id, username FROM students WHERE id = ?",
      args: [id],
    });
    if (found.rows.length === 0) {
      return res.status(404).json({ error: "Élève introuvable." });
    }

    const ownPosts = "SELECT id FROM eyes_posts WHERE author_type = 'student' AND author_id = ?";
    await client.batch(
      [
        { sql: `DELETE FROM eyes_comments WHERE post_id IN (${ownPosts})`, args: [id] },
        { sql: `DELETE FROM eyes_likes WHERE post_id IN (${ownPosts})`, args: [id] },
        { sql: `DELETE FROM eyes_views WHERE post_id IN (${ownPosts})`, args: [id] },
        { sql: "DELETE FROM eyes_comments WHERE author_type = 'student' AND author_id = ?", args: [id] },
        { sql: "DELETE FROM eyes_likes WHERE user_type = 'student' AND user_id = ?", args: [id] },
        { sql: "DELETE FROM eyes_views WHERE user_type = 'student' AND user_id = ?", args: [id] },
        { sql: "DELETE FROM eyes_posts WHERE author_type = 'student' AND author_id = ?", args: [id] },
        { sql: "DELETE FROM students WHERE id = ?", args: [id] },
      ],
      "write"
    );

    res.json({ deleted: true, id, username: found.rows[0].username });
  } catch (err) {
    console.error("Erreur DELETE /api/students/:id :", err);
    res.status(500).json({ error: "Une erreur est survenue." });
  }
});

module.exports = router;
