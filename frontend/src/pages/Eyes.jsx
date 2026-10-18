import React, { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import {
  fetchEyesFeed,
  uploadEyesPost,
  registerEyesView,
  toggleEyesLike,
  fetchEyesComments,
  addEyesComment,
  deleteEyesPost,
} from "../api";

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso.replace(" ", "T") + "Z").getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} h`;
  const days = Math.floor(hours / 24);
  return `${days} j`;
}

// Les URLs de fichiers renvoyées par l'API sont relatives (ex: /uploads/eyes/xxx.jpg).
// Sur le web en dev elles fonctionnent par coïncidence via le proxy, mais dans l'app
// Android compilée il n'y a pas de serveur local : il faut préfixer avec l'adresse du backend.
function resolveMediaUrl(url) {
  if (!url) return url;
  if (url.startsWith("http")) return url;
  return `${import.meta.env.VITE_API_URL?.replace("/api", "") || ""}${url}`;
}

function EyeIcon({ size = 26, filled = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M1 12C1 12 5 4.5 12 4.5C19 4.5 23 12 23 12C23 12 19 19.5 12 19.5C5 19.5 1 12 1 12Z"
        stroke="white"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3.4" fill={filled ? "white" : "none"} stroke="white" strokeWidth="1.8" />
    </svg>
  );
}

function HeartIcon({ size = 28, filled = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 20.5C12 20.5 2.5 14.6 2.5 8.4C2.5 5.4 4.9 3 7.9 3C9.7 3 11.2 3.9 12 5.2C12.8 3.9 14.3 3 16.1 3C19.1 3 21.5 5.4 21.5 8.4C21.5 14.6 12 20.5 12 20.5Z"
        fill={filled ? "#ff3b5c" : "none"}
        stroke={filled ? "#ff3b5c" : "white"}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CommentIcon({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M3 12C3 7.03 7.48 3 13 3C18.52 3 23 7.03 23 12C23 16.97 18.52 21 13 21C11.5 21 10.08 20.68 8.83 20.11L3 21.5L4.62 16.68C3.6 15.32 3 13.72 3 12Z"
        stroke="white"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlusIcon({ size = 22, color = "white" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <line x1="12" y1="4" x2="12" y2="20" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <line x1="4" y1="12" x2="20" y2="12" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function BackArrow({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M15 5L8 12L15 19" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrashIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Eyes({ onBack }) {
  const { token, user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showUpload, setShowUpload] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const [commentsPostId, setCommentsPostId] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [commentsLoading, setCommentsLoading] = useState(false);

  const viewedRef = useRef(new Set());
  const itemRefs = useRef({});

  const loadFeed = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchEyesFeed(token);
      setPosts(data.posts || []);
    } catch (err) {
      setError(err.message || "Impossible de charger EYES.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  // Enregistre une vue quand une publication devient visible à l'écran.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = Number(entry.target.dataset.postId);
            if (!viewedRef.current.has(id)) {
              viewedRef.current.add(id);
              registerEyesView(token, id)
                .then((res) => {
                  setPosts((prev) =>
                    prev.map((p) => (p.id === id ? { ...p, view_count: res.view_count } : p))
                  );
                })
                .catch(() => {});
            }
          }
        });
      },
      { threshold: 0.6 }
    );

    Object.values(itemRefs.current).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [posts, token]);

  const handlePickFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setUploadError("");
  };

  const closeUpload = () => {
    setShowUpload(false);
    setSelectedFile(null);
    setPreviewUrl(null);
    setCaption("");
    setUploadError("");
  };

  const handlePublish = async () => {
    if (!selectedFile) {
      setUploadError("Choisis une photo ou une vidéo à publier.");
      return;
    }
    setUploading(true);
    setUploadError("");
    try {
      const data = await uploadEyesPost(token, { file: selectedFile, caption });
      setPosts((prev) => [data.post, ...prev]);
      closeUpload();
    } catch (err) {
      setUploadError(err.message || "Erreur lors de la publication.");
    } finally {
      setUploading(false);
    }
  };

  const handleLike = async (postId) => {
    // Optimiste : on met à jour tout de suite, puis on corrige avec la réponse serveur.
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, liked_by_me: !p.liked_by_me, like_count: p.like_count + (p.liked_by_me ? -1 : 1) }
          : p
      )
    );
    try {
      const res = await toggleEyesLike(token, postId);
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, liked_by_me: res.liked, like_count: res.like_count } : p))
      );
    } catch {
      loadFeed();
    }
  };

  const openComments = async (postId) => {
    setCommentsPostId(postId);
    setCommentsLoading(true);
    try {
      const data = await fetchEyesComments(token, postId);
      setComments(data.comments || []);
    } catch {
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  };

  const closeComments = () => {
    setCommentsPostId(null);
    setComments([]);
    setCommentText("");
  };

  const handleAddComment = async () => {
    const content = commentText.trim();
    if (!content || !commentsPostId) return;
    try {
      const data = await addEyesComment(token, commentsPostId, content);
      setComments((prev) => [...prev, data.comment]);
      setCommentText("");
      setPosts((prev) =>
        prev.map((p) => (p.id === commentsPostId ? { ...p, comment_count: p.comment_count + 1 } : p))
      );
    } catch (err) {
      setUploadError(err.message || "Erreur lors de l'ajout du commentaire.");
    }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm("Supprimer cette publication ?")) return;
    try {
      await deleteEyesPost(token, postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) {
      alert(err.message || "Erreur lors de la suppression.");
    }
  };

  return (
    <div className="min-h-screen bg-ink flex flex-col">
      {/* En-tête : retour, titre, publier */}
      <div
        className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-white/10 bg-ink/90 px-4 backdrop-blur"
        style={{ boxSizing: "content-box", paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <button
          type="button"
          onClick={onBack}
          aria-label="Retour à l'accueil"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/[0.08] text-white transition active:bg-white/20 motion-reduce:transition-none"
        >
          <BackArrow />
        </button>
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ background: "linear-gradient(135deg, #ff9d5c 0%, #ff4f5e 100%)" }}
            aria-hidden="true"
          >
            <EyeIcon size={20} filled />
          </span>
          <span className="text-lg font-extrabold tracking-wide text-white">EYES</span>
        </div>
        <button
          type="button"
          onClick={() => setShowUpload(true)}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-gradient shadow-glow-sm transition active:brightness-110 motion-reduce:transition-none"
          aria-label="Publier"
        >
          <PlusIcon />
        </button>
      </div>

      {/* Feed */}
      {loading && <p className="text-white/60 text-center mt-10">Chargement du fil…</p>}
      {error && <p className="text-red-400 text-center mt-10">{error}</p>}
      {!loading && !error && posts.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-white/60 px-8 text-center">
          <EyeIcon size={40} />
          <p className="mt-4">Rien à voir pour l'instant. Sois le premier à publier dans EYES.</p>
        </div>
      )}

      <div
        className="flex-1 overflow-y-auto snap-y snap-mandatory"
        style={{ scrollSnapType: "y mandatory" }}
      >
        {posts.map((post) => {
          const isMine = post.author_type === user?.role && post.author_username === user?.username;
          return (
            <div
              key={post.id}
              ref={(el) => (itemRefs.current[post.id] = el)}
              data-post-id={post.id}
              className="relative w-full snap-start flex items-center justify-center bg-black"
              style={{ height: "calc(100vh - 68px - env(safe-area-inset-top, 0px))" }}
            >
              {post.media_type === "image" ? (
                <img
                  src={resolveMediaUrl(post.media_url)}
                  alt={post.caption || "Publication EYES"}
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <video
                  src={resolveMediaUrl(post.media_url)}
                  className="max-h-full max-w-full object-contain"
                  controls
                  loop
                  playsInline
                />
              )}

              {/* Overlay bas gauche : auteur + légende */}
              <div className="absolute left-4 right-20 bottom-6 text-white">
                <p className="font-semibold">
                  @{post.author_username}
                  <span className="ml-2 text-xs text-white/60 font-normal">{timeAgo(post.created_at)}</span>
                </p>
                {post.caption && <p className="text-sm text-white/90 mt-1">{post.caption}</p>}
              </div>

              {/* Rail d'actions bas droite */}
              <div className="absolute right-3 bottom-6 flex flex-col items-center gap-5">
                <button type="button" onClick={() => handleLike(post.id)} aria-label={post.liked_by_me ? "Retirer mon j'aime" : "J'aime"} aria-pressed={post.liked_by_me} className="flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-1">
                  <HeartIcon filled={post.liked_by_me} />
                  <span className="text-white text-xs font-semibold drop-shadow">{post.like_count}</span>
                </button>
                <button type="button" onClick={() => openComments(post.id)} aria-label="Voir les commentaires" className="flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-1">
                  <CommentIcon />
                  <span className="text-white text-xs">{post.comment_count}</span>
                </button>
                <div className="flex flex-col items-center gap-1">
                  <EyeIcon size={24} />
                  <span className="text-white text-xs">{post.view_count}</span>
                </div>
                {isMine && (
                  <button type="button" onClick={() => handleDelete(post.id)} aria-label="Supprimer ma publication" className="mt-2 flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-1">
                    <TrashIcon />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modale d'upload */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/80 z-30 flex items-end sm:items-center justify-center">
          <div role="dialog" aria-modal="true" aria-label="Publier dans EYES" className="bg-surface border border-white/10 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 pb-safe">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white text-lg" style={{ fontWeight: 700 }}>
                Publier dans EYES
              </h2>
              <button type="button" onClick={closeUpload} aria-label="Fermer" className="-mr-2 flex h-11 w-11 items-center justify-center text-2xl leading-none text-white/70">
                ×
              </button>
            </div>

            {!previewUrl ? (
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-white/20 rounded-2xl py-10 cursor-pointer text-white/60 hover:border-violet-400 transition">
                <PlusIcon size={28} color="currentColor" />
                <span className="mt-2 text-sm">Choisir une photo ou une vidéo</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
                  className="hidden"
                  onChange={handlePickFile}
                />
              </label>
            ) : (
              <div className="mb-4">
                {selectedFile.type.startsWith("video") ? (
                  <video src={previewUrl} className="w-full max-h-64 object-contain rounded-xl" controls />
                ) : (
                  <img src={previewUrl} className="w-full max-h-64 object-contain rounded-xl" alt="Aperçu" />
                )}
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                  className="text-white/60 text-xs mt-2 underline"
                >
                  Changer de fichier
                </button>
              </div>
            )}

            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Une légende (facultatif)"
              maxLength={500}
              rows={2}
              className="field resize-none"
            />

            {uploadError && <p className="text-red-400 text-sm mt-2">{uploadError}</p>}

            <button
              onClick={handlePublish}
              disabled={uploading}
              className="btn-primary mt-4 w-full"
            >
              {uploading ? "Publication…" : "Publier"}
            </button>
          </div>
        </div>
      )}

      {/* Panneau commentaires */}
      {commentsPostId && (
        <div className="fixed inset-0 bg-black/60 z-30 flex items-end" onClick={closeComments}>
          <div
            className="bg-surface border border-white/10 w-full max-h-[70vh] rounded-t-3xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <h3 className="text-white font-semibold">Commentaires</h3>
              <button type="button" onClick={closeComments} aria-label="Fermer" className="-mr-2 flex h-11 w-11 items-center justify-center text-2xl leading-none text-white/70">
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-3">
              {commentsLoading && <p className="text-white/55 text-sm">Chargement…</p>}
              {!commentsLoading && comments.length === 0 && (
                <p className="text-white/55 text-sm">Aucun commentaire pour l'instant.</p>
              )}
              {comments.map((c) => (
                <div key={c.id} className="mb-3">
                  <p className="text-white text-sm">
                    <span className="font-semibold">@{c.author_username}</span>{" "}
                    <span className="text-white/55 text-xs">{timeAgo(c.created_at)}</span>
                  </p>
                  <p className="text-white/80 text-sm">{c.content}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 px-5 py-4 border-t border-white/10 pb-safe">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                placeholder="Ajouter un commentaire…"
                maxLength={500}
                className="field flex-1 !rounded-full !py-2.5"
              />
              <button type="button" onClick={handleAddComment} className="min-h-[44px] px-3 text-sm font-bold text-violet-300">
                Envoyer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
