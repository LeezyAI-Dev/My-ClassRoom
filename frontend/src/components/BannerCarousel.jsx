import React, { useEffect, useRef, useState } from "react";
import { fetchBannerImages } from "../api";

const SLIDE_INTERVAL = 4000; // temps d'affichage de chaque image (ms)
const POLL_INTERVAL = 8000; // fréquence de vérification des nouvelles images ajoutées par le dev (ms)

export default function BannerCarousel() {
  const [images, setImages] = useState([]);
  const [index, setIndex] = useState(0);
  const slideTimer = useRef(null);

  useEffect(() => {
    const load = () => {
      fetchBannerImages()
        .then((data) => {
          setImages((prev) => {
            // Ne remplace la liste que si elle a réellement changé, pour ne pas
            // interrompre le fondu en cours à chaque poll silencieux.
            const sameLength = prev.length === data.images.length;
            const sameIds =
              sameLength && prev.every((img, i) => img.id === data.images[i].id);
            return sameIds ? prev : data.images;
          });
        })
        .catch(() => {
          // Silencieux : la bannière est un élément décoratif, pas de blocage de l'UI.
        });
    };

    load();
    const poll = setInterval(load, POLL_INTERVAL);
    return () => clearInterval(poll);
  }, []);

  useEffect(() => {
    if (images.length <= 1) return undefined;
    slideTimer.current = setInterval(() => {
      setIndex((i) => (i + 1) % images.length);
    }, SLIDE_INTERVAL);
    return () => clearInterval(slideTimer.current);
  }, [images.length]);

  useEffect(() => {
    // Si la liste rétrécit (image supprimée par le dev), on recadre l'index affiché.
    if (index >= images.length) setIndex(0);
  }, [images.length, index]);

  if (images.length === 0) return null;

  return (
    <div className="relative w-full h-40 sm:h-56 md:h-72 overflow-hidden bg-slate-900">
      {images.map((img, i) => (
        <img
          key={img.id}
          src={img.url}
          alt=""
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}

      {images.length > 1 && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setIndex(i)}
              aria-label={`Aller à l'image ${i + 1}`}
              className={`w-1.5 h-1.5 rounded-full transition ${
                i === index ? "bg-white" : "bg-white/40"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
