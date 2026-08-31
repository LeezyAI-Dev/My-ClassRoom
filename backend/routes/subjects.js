const express = require("express");
const { client } = require("../db");

const router = express.Router();

// GET /api/subjects
// Retourne les matières groupées par catégorie (générale / technique).
router.get("/", async (req, res) => {
  try {
    const result = await client.execute(
      "SELECT id, name, category, position FROM subjects ORDER BY category, position"
    );
    const rows = result.rows;
    const generale = rows.filter((s) => s.category === "generale");
    const technique = rows.filter((s) => s.category === "technique");
    res.json({ generale, technique });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur lors de la récupération des matières." });
  }
});

module.exports = router;