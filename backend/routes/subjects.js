const express = require("express");
const db = require("../db");

const router = express.Router();

// GET /api/subjects
// Retourne les matières groupées par catégorie (générale / technique).
router.get("/", (req, res) => {
  const rows = db
    .prepare("SELECT id, name, category, position FROM subjects ORDER BY category, position")
    .all();

  const generale = rows.filter((s) => s.category === "generale");
  const technique = rows.filter((s) => s.category === "technique");

  res.json({ generale, technique });
});

module.exports = router;
