const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const multer = require("multer");
const { client } = require("../db");
const { requireAnyAuth } = require("../middleware/auth");

const router = express.Router();

const EYES_DIR = path.join(__dirname, "..", "uploads", "eyes");
if (!fs.existsSync(EYES_DIR)) {
  fs.mkdirSync(EYES_DIR, { recursive: true });
}

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 Mo
const MAX_VIDEO_SIZE = 80 * 1024 * 1024; // 80 Mo

const IMAGE_MIME = ["image/jpeg", "image/png", "image/webp"];
const IMAGE_EXT = [".jpg", ".jpeg", ".png", ".webp"];
const VIDEO_MIME = ["video/mp4", "video/webm", "video/quicktime"];
const VIDEO_EXT = [".mp4", ".webm", ".mov"];

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, EYES_DIR),
  filename: (req, file, cb) => {
    const unique = crypto.randomBytes(16).toString("hex");
    const ext = path.extname(file.originalname).toLowerCase() || "";
    cb(null, `${unique}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_VIDEO_SIZE }, // limite haute vérifiée finement plus bas selon le type
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const isImage = IMAGE_MIME.includes(file.mimetype) && IMAGE_EXT.includes(ext);
    const isVideo = VIDEO_MIME.includes(file.mimetype) && VIDEO_EXT.includes(ext);
    if (!isImage && !isVideo) {
      return cb(new Error("Seules les images (JPG, PNG, WEBP) et vidéos (MP4, WEBM, MOV) sont acceptées."));
    }
    file._eyesMediaType = isImage ? "image" : "video";
    cb(null, true);
  },
});

async function findPost(id) {
  const result = await client.execute({
    sql: "SELECT * FROM eyes_posts WHERE id = ?",
    args: [id],
  });
  return result.rows[0];
}

async function attachCounts(rows, actor) {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const placeholders = ids.map(() => "?").join(",");

  const [likeRows, viewRows, commentRows, myLikeRows] = await Promise.all([
    client.execute({
      sql: `SELECT post_id, COUNT(*) AS cnt FROM eyes_likes WHERE post_id IN (${placeholders}) GROUP BY post_id`,
      args: ids,
    }),
    client.execute({
      sql: `SELECT post_id, COUNT(*) AS cnt FROM eyes_views WHERE post_id IN (${placeholders}) GROUP BY post_id`,
      args: ids,
    }),
    client.execute({
      sql: `SELECT post_id, COUNT(*) AS cnt FROM eyes_comments WHERE post_id IN (${placeholders}) GROUP BY post_id`,
      args: ids,
    }),
    client.execute({
      sql: `SELECT post_id FROM eyes_likes WHERE post_id IN (${placeholders}) AND user_type = ? AND user_id = ?`,
      args: [...ids, actor.type, actor.id],
    }),
  ]);

  const likeMap = Object.fromEntries(likeRows.rows.map((r) => [r.post_id, r.cnt]));
  const viewMap = Object.fromEntries(viewRows.rows.map((r) => [r.post_id, r.cnt]));
  const commentMap = Object.fromEntries(commentRows.rows.map((r) => [r.post_id, r.cnt]));
  const likedSet = new Set(myLikeRows.rows.map((r) => r.post_id));

  return rows.map((r) => ({
    ...r,
    like_count: likeMap[r.id] || 0,
    view_count: viewMap[r.id] || 0,
    comment_count: commentMap[r.id] || 0,
    liked_by_me: likedSet.has(r.id),
  }));
}

// GET /api/eyes
// Fil de publications, du plus récent au plus ancien. Accessible élève + développeur.
router.get("/", requireAnyAuth, async (req, res) => {
  try {
    const result = await client.execute("SELECT * FROM eyes_posts ORDER BY created_at DESC");
    const posts = await attachCounts(result.rows, req.actor);
    res.json({ posts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur lors de la récupération du fil." });
  }
});

// POST /api/eyes
// Publication d'une photo ou vidéo. Élève et développeur peuvent publier.
router.post("/", requireAnyAuth, (req, res) => {
  upload.single("file")(req, res, async (uploadErr) => {
    if (uploadErr) {
      if (uploadErr.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ error: "Le fichier dépasse la taille maximale autorisée (80 Mo pour une vidéo, 10 Mo pour une image)." });
      }
      return res.status(400).json({ error: uploadErr.message || "Erreur lors de l'upload du fichier." });
    }

    const cleanup = () => {
      if (req.file) fs.unlink(req.file.path, () => {});
    };

    try {
      if (!req.file) {
        return res.status(400).json({ error: "Aucun fichier fourni (champ \"file\" attendu)." });
      }

      const mediaType = req.file._eyesMediaType;
      if (mediaType === "image" && req.file.size > MAX_IMAGE_SIZE) {
        cleanup();
        return res.status(400).json({ error: "L'image dépasse la taille maximale autorisée (10 Mo)." });
      }

      const caption = (req.body.caption || "").trim().slice(0, 500);
      const publicUrl = `/uploads/eyes/${req.file.filename}`;

      const insertResult = await client.execute({
        sql: `INSERT INTO eyes_posts (author_type, author_id, author_username, media_type, media_url, file_path, caption)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [req.actor.type, req.actor.id, req.actor.username, mediaType, publicUrl, req.file.filename, caption],
      });

      const newId = Number(insertResult.lastInsertRowid);
      const created = await findPost(newId);
      const [withCounts] = await attachCounts([created], req.actor);

      res.status(201).json({ message: "Publication ajoutée à EYES.", post: withCounts });
    } catch (err) {
      cleanup();
      console.error(err);
      res.status(500).json({ error: "Erreur serveur lors de la publication." });
    }
  });
});

// POST /api/eyes/:id/view
// Enregistre une vue unique par utilisateur (pas de spam de compteur).
router.post("/:id/view", requireAnyAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const post = await findPost(id);
    if (!post) return res.status(404).json({ error: "Publication introuvable." });

    await client.execute({
      sql: `INSERT OR IGNORE INTO eyes_views (post_id, user_type, user_id) VALUES (?, ?, ?)`,
      args: [id, req.actor.type, req.actor.id],
    });

    const countResult = await client.execute({
      sql: "SELECT COUNT(*) AS cnt FROM eyes_views WHERE post_id = ?",
      args: [id],
    });

    res.json({ view_count: countResult.rows[0].cnt });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur lors de l'enregistrement de la vue." });
  }
});

// POST /api/eyes/:id/like
// Bascule le like (ajoute si absent, retire si déjà présent).
router.post("/:id/like", requireAnyAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const post = await findPost(id);
    if (!post) return res.status(404).json({ error: "Publication introuvable." });

    const existing = await client.execute({
      sql: "SELECT id FROM eyes_likes WHERE post_id = ? AND user_type = ? AND user_id = ?",
      args: [id, req.actor.type, req.actor.id],
    });

    let liked;
    if (existing.rows.length > 0) {
      await client.execute({
        sql: "DELETE FROM eyes_likes WHERE post_id = ? AND user_type = ? AND user_id = ?",
        args: [id, req.actor.type, req.actor.id],
      });
      liked = false;
    } else {
      await client.execute({
        sql: "INSERT INTO eyes_likes (post_id, user_type, user_id) VALUES (?, ?, ?)",
        args: [id, req.actor.type, req.actor.id],
      });
      liked = true;
    }

    const countResult = await client.execute({
      sql: "SELECT COUNT(*) AS cnt FROM eyes_likes WHERE post_id = ?",
      args: [id],
    });

    res.json({ liked, like_count: countResult.rows[0].cnt });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur lors du like." });
  }
});

// GET /api/eyes/:id/comments
router.get("/:id/comments", requireAnyAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const post = await findPost(id);
    if (!post) return res.status(404).json({ error: "Publication introuvable." });

    const result = await client.execute({
      sql: "SELECT * FROM eyes_comments WHERE post_id = ? ORDER BY created_at ASC",
      args: [id],
    });

    res.json({ comments: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur lors de la récupération des commentaires." });
  }
});

// POST /api/eyes/:id/comments
router.post("/:id/comments", requireAnyAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const post = await findPost(id);
    if (!post) return res.status(404).json({ error: "Publication introuvable." });

    const content = (req.body.content || "").trim();
    if (!content) {
      return res.status(400).json({ error: "Le commentaire ne peut pas être vide." });
    }
    if (content.length > 500) {
      return res.status(400).json({ error: "Le commentaire est trop long (500 caractères maximum)." });
    }

    const insertResult = await client.execute({
      sql: `INSERT INTO eyes_comments (post_id, author_type, author_id, author_username, content)
            VALUES (?, ?, ?, ?, ?)`,
      args: [id, req.actor.type, req.actor.id, req.actor.username, content],
    });

    const newId = Number(insertResult.lastInsertRowid);
    const created = await client.execute({
      sql: "SELECT * FROM eyes_comments WHERE id = ?",
      args: [newId],
    });

    res.status(201).json({ comment: created.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur lors de l'ajout du commentaire." });
  }
});

// DELETE /api/eyes/:id
// L'auteur de la publication ou n'importe quel développeur peut la supprimer.
router.delete("/:id", requireAnyAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const post = await findPost(id);
    if (!post) return res.status(404).json({ error: "Publication introuvable." });

    const isOwner = post.author_type === req.actor.type && post.author_id === req.actor.id;
    const isDeveloper = req.actor.type === "developer";
    if (!isOwner && !isDeveloper) {
      return res.status(403).json({ error: "Vous ne pouvez supprimer que vos propres publications." });
    }

    await client.execute({ sql: "DELETE FROM eyes_likes WHERE post_id = ?", args: [id] });
    await client.execute({ sql: "DELETE FROM eyes_views WHERE post_id = ?", args: [id] });
    await client.execute({ sql: "DELETE FROM eyes_comments WHERE post_id = ?", args: [id] });
    await client.execute({ sql: "DELETE FROM eyes_posts WHERE id = ?", args: [id] });

    if (post.file_path) {
      fs.unlink(path.join(EYES_DIR, post.file_path), () => {});
    }

    res.json({ message: "Publication supprimée." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur lors de la suppression." });
  }
});

module.exports = { router, EYES_DIR };
