const { createClient } = require("@libsql/client");
const path = require("path");

// FALLBACK LOCAL : si TURSO_DATABASE_URL n'est pas défini, on utilise le fichier local myclassroom.db
const dbPath = path.join(__dirname, "myclassroom.db");
const url = process.env.TURSO_DATABASE_URL || `file:${dbPath}`;

const client = createClient({
  url,
  authToken: process.env.TURSO_AUTH_TOKEN || undefined,
});

console.log(`📦 DB URL: ${url.includes("file:") ? "LOCAL FILE ("+dbPath+")" : "TURSO"}`);

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
  `CREATE TABLE IF NOT EXISTS grades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_type TEXT NOT NULL CHECK (user_type IN ('developer', 'student')),
    user_id INTEGER NOT NULL,
    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    date_received TEXT NOT NULL,
    note_value TEXT NOT NULL,
    photo_url TEXT,
    file_path TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_type, user_id, subject_id)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_grades_user ON grades(user_type, user_id)`,
];

const GENERALES = ["Mathématiques","Français","CMC","Législation","EDHC","Physique Chimie","EPS","Anglais"];
const TECHNIQUES = ["Photogravure","Impression","P.A.O","Façonnage","Fabrication","Maquette"];

async function ensureColumns() {
  try { await client.execute("ALTER TABLE students ADD COLUMN suspended INTEGER NOT NULL DEFAULT 0"); } catch {}
  try { await client.execute("ALTER TABLE students ADD COLUMN last_seen TEXT"); } catch {}
  try { await client.execute("ALTER TABLE developers ADD COLUMN last_seen TEXT"); } catch {}
}

async function initDb() {
  for (const statement of SCHEMA_STATEMENTS) {
    try { await client.execute(statement); } catch(e){ console.error("Schema error:", e.message, statement.slice(0,80)); }
  }
  await ensureColumns();
  try {
    const { rows } = await client.execute("SELECT COUNT(*) AS count FROM subjects");
    const subjectCount = rows[0].count;
    if (subjectCount === 0) {
      const inserts = [];
      GENERALES.forEach((name, i) => inserts.push({ sql: "INSERT INTO subjects (name, category, position) VALUES (?, ?, ?)", args: [name, "generale", i] }));
      TECHNIQUES.forEach((name, i) => inserts.push({ sql: "INSERT INTO subjects (name, category, position) VALUES (?, ?, ?)", args: [name, "technique", i] }));
      await client.batch(inserts, "write");
      console.log("✅ Matières insérées");
    }
  } catch(e){ console.error("Init subjects error:", e.message); }
}

async function init(){ return initDb(); }

module.exports = { client, initDb, init };
