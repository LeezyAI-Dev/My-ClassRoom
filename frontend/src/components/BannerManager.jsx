import React, { useEffect, useState } from "react";
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
    <div className="bg-white border border-slate-200 rounded-xl p-5 mb-8">
      <h3 className="text-sm font-semibold text-slate-800">Bannière d'accueil</h3>
      <p className="text-xs text-slate-500 mt-1 mb-4">
        Les images ci-dessous défilent automatiquement en haut de l'écran d'accueil, visibles par
        tous (élèves et développeurs).
      </p>

      {error && (
        <div className="mb-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-xs text-slate-400 mb-4">Chargement...</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-4">
          {images.map((img) => (
            <div key={img.id} className="relative group">
              <img
                src={img.url}
                alt=""
                className="w-full h-16 object-cover rounded-md border border-slate-200"
              />
              <button
                onClick={() => handleDelete(img.id)}
                className="absolute top-1 right-1 bg-black/60 text-white text-[10px] rounded px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition"
              >
                Suppr.
              </button>
            </div>
          ))}
          {images.length === 0 && (
            <p className="col-span-full text-xs text-slate-400">
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
          className="flex-1 text-xs"
        />
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-1.5 rounded-md bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 disabled:opacity-60 shrink-0"
        >
          {submitting ? "Envoi..." : "Ajouter une image"}
        </button>
      </form>
    </div>
  );
}
