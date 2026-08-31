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

function PlusIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <line x1="12" y1="4" x2="12" y2="20" stroke="#1c1c1c" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="4" y1="12" x2="20" y2="12" stroke="#1c1c1c" strokeWidth="2.2" strokeLinecap="round" />
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
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 sticky top-0 z-20 bg-black/90 backdrop-blur">
        <button onClick={onBack} className="p-2 -ml-2">
          <BackArrow />
        </button>
        <div className="flex items-center gap-2">
          <EyeIcon size={22} filled />
          <span
            className="text-white text-lg tracking-widest"
            style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 700 }}
          >
            EYES
          </span>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="bg-white rounded-full p-2"
          aria-label="Publier"
        >
          <PlusIcon />
        </button>
      </div>

      {/* Feed */}
      {loading && <p className="text-white/60 text-center mt-10">Chargement du fil…</p>}
      {error && <p className="text-red-400 text-center mt-10">{error}</p>}
      {!loading && !error && posts.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-white/50 px-8 text-center">
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
              style={{ height: "calc(100vh - 60px)" }}
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
                <p className="font-semibold" style={{ fontFamily: "'Baloo 2', sans-serif" }}>
                  @{post.author_username}
                  <span className="ml-2 text-xs text-white/50 font-normal">{timeAgo(post.created_at)}</span>
                </p>
                {post.caption && <p className="text-sm text-white/90 mt-1">{post.caption}</p>}
              </div>

              {/* Rail d'actions bas droite */}
              <div className="absolute right-3 bottom-6 flex flex-col items-center gap-5">
                <button onClick={() => handleLike(post.id)} className="flex flex-col items-center gap-1">
                  <HeartIcon filled={post.liked_by_me} />
                  <span className="text-white text-xs">{post.like_count}</span>
                </button>
                <button onClick={() => openComments(post.id)} className="flex flex-col items-center gap-1">
                  <CommentIcon />
                  <span className="text-white text-xs">{post.comment_count}</span>
                </button>
                <div className="flex flex-col items-center gap-1">
                  <EyeIcon size={24} />
                  <span className="text-white text-xs">{post.view_count}</span>
                </div>
                {isMine && (
                  <button onClick={() => handleDelete(post.id)} className="flex flex-col items-center gap-1 mt-2">
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
          <div className="bg-[#1c1c1c] w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white text-lg" style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 700 }}>
                Publier dans EYES
              </h2>
              <button onClick={closeUpload} className="text-white/60 text-2xl leading-none">
                ×
              </button>
            </div>

            {!previewUrl ? (
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-white/20 rounded-2xl py-10 cursor-pointer text-white/60">
                <PlusIcon size={28} />
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
                  className="text-white/50 text-xs mt-2 underline"
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
              className="w-full bg-white/5 text-white rounded-xl p-3 text-sm outline-none placeholder:text-white/30 resize-none"
            />

            {uploadError && <p className="text-red-400 text-sm mt-2">{uploadError}</p>}

            <button
              onClick={handlePublish}
              disabled={uploading}
              className="w-full mt-4 bg-white text-[#1c1c1c] font-semibold py-3 rounded-2xl disabled:opacity-50"
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
            className="bg-[#1c1c1c] w-full max-h-[70vh] rounded-t-3xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <h3 className="text-white font-semibold">Commentaires</h3>
              <button onClick={closeComments} className="text-white/60 text-2xl leading-none">
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-3">
              {commentsLoading && <p className="text-white/40 text-sm">Chargement…</p>}
              {!commentsLoading && comments.length === 0 && (
                <p className="text-white/40 text-sm">Aucun commentaire pour l'instant.</p>
              )}
              {comments.map((c) => (
                <div key={c.id} className="mb-3">
                  <p className="text-white text-sm">
                    <span className="font-semibold">@{c.author_username}</span>{" "}
                    <span className="text-white/40 text-xs">{timeAgo(c.created_at)}</span>
                  </p>
                  <p className="text-white/80 text-sm">{c.content}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 px-5 py-4 border-t border-white/10">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                placeholder="Ajouter un commentaire…"
                maxLength={500}
                className="flex-1 bg-white/5 text-white rounded-full px-4 py-2 text-sm outline-none placeholder:text-white/30"
              />
              <button onClick={handleAddComment} className="text-white font-semibold text-sm px-2">
                Envoyer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
