import React, { useEffect, useState } from "react";
import { TrashIcon } from "./ui/Icons";
import { fetchBannerImages, uploadBannerImage, deleteBannerImage } from "../api";
import { useAuth } from "../context/AuthContext";

export default function BannerManager() {
  const { token } = useAuth();

  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadImages = () => {
    setLoading(true);
    fetchBannerImages()
      .then((data) => setImages(data.images))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadImages();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    setError("");

    if (!file) {
      setError("Choisissez une image (JPG, PNG ou WEBP, 8 Mo max).");
      return;
    }

    setSubmitting(true);
    try {
      await uploadBannerImage(token, file);
      setFile(null);
      const input = document.getElementById("banner-file-input");
      if (input) input.value = "";
      loadImages();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (imageId) => {
    if (!window.confirm("Supprimer cette image de la bannière ?")) return;
    try {
      await deleteBannerImage(token, imageId);
      loadImages();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="card p-5">
      <h3 className="text-[15px] font-bold text-white">Bannière d'accueil</h3>
      <p className="text-xs text-white/65 mt-1 mb-4">
        Les images ci-dessous défilent automatiquement en haut de l'écran d'accueil, visibles par
        tous (élèves et développeurs).
      </p>

      {error && (
        <div className="mb-3 text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-xs text-white/55 mb-4">Chargement...</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-4">
          {images.map((img) => (
            <div key={img.id} className="relative group">
              <img
                src={img.url}
                alt=""
                className="w-full h-16 object-cover rounded-xl border border-white/10"
              />
              <button
                type="button"
                onClick={() => handleDelete(img.id)}
                aria-label="Supprimer cette image"
                className="absolute -top-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/80 text-red-300 active:bg-red-500/30"
              >
                <TrashIcon size={16} />
              </button>
            </div>
          ))}
          {images.length === 0 && (
            <p className="col-span-full text-xs text-white/55">
              Aucune image pour l'instant. Ajoutez-en une pour activer la bannière.
            </p>
          )}
        </div>
      )}

      <form onSubmit={handleUpload} className="flex flex-col sm:flex-row gap-2">
        <input
          id="banner-file-input"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="flex-1 text-xs text-white/70 file:mr-3 file:min-h-[44px] file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white"
        />
        <button
          type="submit"
          disabled={submitting}
          className="btn-primary shrink-0"
        >
          {submitting ? "Envoi..." : "Ajouter une image"}
        </button>
      </form>
    </div>
  );
}
