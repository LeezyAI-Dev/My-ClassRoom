const { createClient } = require("@libsql/client");

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// V1 : compte développeur, matières (structure), emploi du temps (structure).
// V1.1 : ressources par matière (PDF uploadés, liens de redirection).
// Pas encore de cours structuré au-delà des ressources, notes, devoirs, notifications, SOS, paiement, IA, fil vidéo.
const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS developers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('generale', 'technique')),
    position INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS schedule_slots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 6),
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    subject_id INTEGER REFERENCES subjects(id) ON DELETE SET NULL,
    room TEXT,
    teacher TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS subject_resources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('pdf', 'link')),
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    file_path TEXT,
    original_filename TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE INDEX IF NOT EXISTS idx_subject_resources_subject_id ON subject_resources(subject_id)`,
  `CREATE TABLE IF NOT EXISTS banner_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL,
    file_path TEXT NOT NULL,
    original_filename TEXT,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
];

const GENERALES = [
  "Mathématiques",
  "Français",
  "CMC",
  "Législation",
  "EDHC",
  "Physique Chimie",
  "EPS",
  "Anglais",
];

const TECHNIQUES = [
  "Photogravure",
  "Impression",
  "P.A.O",
  "Façonnage",
  "Fabrication",
  "Maquette",
];

async function initDb() {
  // Crée les tables une par une (le client Turso exécute une seule instruction SQL à la fois).
  for (const statement of SCHEMA_STATEMENTS) {
    await client.execute(statement);
  }

  // Seed des matières une seule fois (si la table est vide).
  const { rows } = await client.execute("SELECT COUNT(*) AS count FROM subjects");
  const subjectCount = rows[0].count;

  if (subjectCount === 0) {
    const insertStatements = [];
    GENERALES.forEach((name, i) => {
      insertStatements.push({
        sql: "INSERT INTO subjects (name, category, position) VALUES (?, ?, ?)",
        args: [name, "generale", i],
      });
    });
    TECHNIQUES.forEach((name, i) => {
      insertStatements.push({
        sql: "INSERT INTO subjects (name, category, position) VALUES (?, ?, ?)",
        args: [name, "technique", i],
      });
    });
    await client.batch(insertStatements, "write");
  }
}

module.exports = { client, initDb };