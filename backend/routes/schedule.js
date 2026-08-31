const express = require("express");
const { client } = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const DAY_START = "08:00";
const DAY_END = "17:00";

function isValidTime(value) {
  return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function isWithinDayBounds(start, end) {
  return start >= DAY_START && end <= DAY_END && start < end;
}

// GET /api/schedule
// Consultation libre (pas d'auth requise) : tout le monde peut voir l'emploi du temps.
router.get("/", async (req, res) => {
  try {
    const result = await client.execute(
      `SELECT s.id, s.day_of_week, s.start_time, s.end_time, s.room, s.teacher,
              subj.id AS subject_id, subj.name AS subject_name, subj.category AS subject_category
       FROM schedule_slots s
       LEFT JOIN subjects subj ON subj.id = s.subject_id
       ORDER BY s.day_of_week, s.start_time`
    );

    res.json({ dayStart: DAY_START, dayEnd: DAY_END, slots: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur lors de la récupération de l'emploi du temps." });
  }
});

// POST /api/schedule
// Création d'un créneau. Réservé au compte développeur.
router.post("/", requireAuth, async (req, res) => {
  try {
    const { day_of_week, start_time, end_time, subject_id, room, teacher } = req.body || {};

    if (!day_of_week || !start_time || !end_time) {
      return res.status(400).json({ error: "Jour, heure de début et heure de fin sont requis." });
    }
    if (day_of_week < 1 || day_of_week > 6) {
      return res.status(400).json({ error: "Le jour doit être compris entre lundi (1) et samedi (6)." });
    }
    if (!isValidTime(start_time) || !isValidTime(end_time)) {
      return res.status(400).json({ error: "Format d'heure invalide (attendu HH:MM)." });
    }
    if (!isWithinDayBounds(start_time, end_time)) {
      return res.status(400).json({ error: `Les horaires doivent être compris entre ${DAY_START} et ${DAY_END}.` });
    }

    const insertResult = await client.execute({
      sql: `INSERT INTO schedule_slots (day_of_week, start_time, end_time, subject_id, room, teacher)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [day_of_week, start_time, end_time, subject_id || null, room || null, teacher || null],
    });

    const newId = Number(insertResult.lastInsertRowid);
    const created = await client.execute({
      sql: "SELECT * FROM schedule_slots WHERE id = ?",
      args: [newId],
    });

    res.status(201).json({ message: "Créneau créé.", slot: created.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur lors de la création du créneau." });
  }
});

// PUT /api/schedule/:id
// Modification d'un créneau (matière, horaire, jour, salle, prof). Réservé au développeur.
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const existingResult = await client.execute({
      sql: "SELECT * FROM schedule_slots WHERE id = ?",
      args: [id],
    });
    const existing = existingResult.rows[0];
    if (!existing) {
      return res.status(404).json({ error: "Créneau introuvable." });
    }

    const day_of_week = req.body.day_of_week ?? existing.day_of_week;
    const start_time = req.body.start_time ?? existing.start_time;
    const end_time = req.body.end_time ?? existing.end_time;
    const subject_id = req.body.subject_id !== undefined ? req.body.subject_id : existing.subject_id;
    const room = req.body.room !== undefined ? req.body.room : existing.room;
    const teacher = req.body.teacher !== undefined ? req.body.teacher : existing.teacher;

    if (day_of_week < 1 || day_of_week > 6) {
      return res.status(400).json({ error: "Le jour doit être compris entre lundi (1) et samedi (6)." });
    }
    if (!isValidTime(start_time) || !isValidTime(end_time)) {
      return res.status(400).json({ error: "Format d'heure invalide (attendu HH:MM)." });
    }
    if (!isWithinDayBounds(start_time, end_time)) {
      return res.status(400).json({ error: `Les horaires doivent être compris entre ${DAY_START} et ${DAY_END}.` });
    }

    await client.execute({
      sql: `UPDATE schedule_slots
            SET day_of_week = ?, start_time = ?, end_time = ?, subject_id = ?, room = ?, teacher = ?, updated_at = datetime('now')
            WHERE id = ?`,
      args: [day_of_week, start_time, end_time, subject_id || null, room || null, teacher || null, id],
    });

    const updatedResult = await client.execute({
      sql: "SELECT * FROM schedule_slots WHERE id = ?",
      args: [id],
    });

    res.json({ message: "Créneau modifié.", slot: updatedResult.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur lors de la modification du créneau." });
  }
});

// DELETE /api/schedule/:id
// Suppression d'un créneau. Réservé au développeur.
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const existingResult = await client.execute({
      sql: "SELECT * FROM schedule_slots WHERE id = ?",
      args: [id],
    });
    if (!existingResult.rows[0]) {
      return res.status(404).json({ error: "Créneau introuvable." });
    }

    await client.execute({
      sql: "DELETE FROM schedule_slots WHERE id = ?",
      args: [id],
    });

    res.json({ message: "Créneau supprimé." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur lors de la suppression du créneau." });
  }
});

module.exports = router;
