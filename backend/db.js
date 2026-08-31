const { createClient } = require("@libsql/client");

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// V1 : compte développeur, matières (structure), emploi du temps (structure).
// V1.1 : ressources par matière (PDF uploadés, liens de redirection).
// V1.2 : suspension de compte élève (compte développeur).
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
    suspended INTEGER NOT NULL DEFAULT 0,
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
  `CREATE TABLE IF NOT EXISTS eyes_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author_type TEXT NOT NULL CHECK (author_type IN ('developer', 'student')),
    author_id INTEGER NOT NULL,
    author_username TEXT NOT NULL,
    media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
    media_url TEXT NOT NULL,
    file_path TEXT NOT NULL,
    caption TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE INDEX IF NOT EXISTS idx_eyes_posts_created_at ON eyes_posts(created_at)`,
  `CREATE TABLE IF NOT EXISTS eyes_likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL REFERENCES eyes_posts(id) ON DELETE CASCADE,
    user_type TEXT NOT NULL CHECK (user_type IN ('developer', 'student')),
    user_id INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(post_id, user_type, user_id)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_eyes_likes_post_id ON eyes_likes(post_id)`,
  `CREATE TABLE IF NOT EXISTS eyes_views (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL REFERENCES eyes_posts(id) ON DELETE CASCADE,
    user_type TEXT NOT NULL CHECK (user_type IN ('developer', 'student')),
    user_id INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(post_id, user_type, user_id)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_eyes_views_post_id ON eyes_views(post_id)`,
  `CREATE TABLE IF NOT EXISTS eyes_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL REFERENCES eyes_posts(id) ON DELETE CASCADE,
    author_type TEXT NOT NULL CHECK (author_type IN ('developer', 'student')),
    author_id INTEGER NOT NULL,
    author_username TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE INDEX IF NOT EXISTS idx_eyes_comments_post_id ON eyes_comments(post_id)`,
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

// Migration douce : ajoute la colonne "suspended" si la table students existait déjà
// sans elle (comptes créés avant cette version). Ne touche à rien si elle existe déjà.
async function ensureSuspendedColumn() {
  try {
    await client.execute("ALTER TABLE students ADD COLUMN suspended INTEGER NOT NULL DEFAULT 0");
  } catch (err) {
    if (!/duplicate column/i.test(err.message || "")) {
      throw err;
    }
  }
}

async function initDb() {
  for (const statement of SCHEMA_STATEMENTS) {
    await client.execute(statement);
  }

  await ensureSuspendedColumn();

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
