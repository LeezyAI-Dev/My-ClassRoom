const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(path.join(__dirname, "myclassroom.db"));

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// V1 : compte développeur, matières (structure), emploi du temps (structure).
// V1.1 : ressources par matière (PDF uploadés, liens de redirection).
// Pas encore de cours structuré au-delà des ressources, notes, devoirs, notifications, SOS, paiement, IA, fil vidéo.
db.exec(`
  CREATE TABLE IF NOT EXISTS developers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('generale', 'technique')),
    position INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS schedule_slots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 6), -- 1=lundi ... 6=samedi
    start_time TEXT NOT NULL,  -- format "HH:MM", entre 08:00 et 17:00
    end_time TEXT NOT NULL,
    subject_id INTEGER REFERENCES subjects(id) ON DELETE SET NULL,
    room TEXT,
    teacher TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS subject_resources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('pdf', 'link')),
    title TEXT NOT NULL,
    url TEXT NOT NULL,           -- chemin public /uploads/xxx.pdf pour un pdf, URL externe pour un lien
    file_path TEXT,              -- nom du fichier sur disque (pdf uniquement, sert à la suppression)
    original_filename TEXT,      -- nom du fichier tel qu'envoyé par le développeur (pdf uniquement)
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_subject_resources_subject_id ON subject_resources(subject_id);

  CREATE TABLE IF NOT EXISTS banner_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL,             -- chemin public /uploads/banners/xxx.jpg
    file_path TEXT NOT NULL,       -- nom du fichier sur disque, sert à la suppression
    original_filename TEXT,        -- nom du fichier tel qu'envoyé par le développeur
    position INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// Seed des matières une seule fois (si la table est vide).
const subjectCount = db.prepare("SELECT COUNT(*) AS count FROM subjects").get().count;
if (subjectCount === 0) {
  const insertSubject = db.prepare(
    "INSERT INTO subjects (name, category, position) VALUES (?, ?, ?)"
  );
  const generales = [
    "Mathématiques",
    "Français",
    "CMC",
    "Législation",
    "EDHC",
    "Physique Chimie",
    "EPS",
    "Anglais",
  ];
  const techniques = [
    "Photogravure",
    "Impression",
    "P.A.O",
    "Façonnage",
    "Fabrication",
    "Maquette",
  ];

  const seedMany = db.transaction(() => {
    generales.forEach((name, i) => insertSubject.run(name, "generale", i));
    techniques.forEach((name, i) => insertSubject.run(name, "technique", i));
  });
  seedMany();
}

module.exports = db;
