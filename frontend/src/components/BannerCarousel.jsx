import React, { useEffect, useRef, useState } from "react";
import { fetchBannerImages } from "../api";

const SLIDE_INTERVAL = 4000; // temps d'affichage de chaque slide (ms)
const POLL_INTERVAL = 8000; // fréquence de vérification des nouvelles images du dev (ms)

export default function BannerCarousel() {
  const [devImages, setDevImages] = useState([]);
  const [index, setIndex] = useState(0);
  const slideTimer = useRef(null);

  useEffect(() => {
    const load = () => {
      fetchBannerImages()
        .then((data) => {
          setDevImages((prev) => {
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

  // Uniquement les images postées par le développeur (plus de slide figé).
  const slides = devImages;

  useEffect(() => {
    // Pas de défilement automatique si l'appareil demande moins d'animations.
    const reduceMotion =
      typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (slides.length <= 1 || reduceMotion) return undefined;
    slideTimer.current = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, SLIDE_INTERVAL);
    return () => clearInterval(slideTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides.length]);

  useEffect(() => {
    if (index >= slides.length) setIndex(0);
  }, [slides.length, index]);

  // Aucune image : la bannière disparaît complètement (pas de cadre vide).
  if (slides.length === 0) return null;

  return (
    <div className="relative w-full h-[190px] rounded-3xl border border-white/10 overflow-hidden bg-surface">
      {slides.map((slide, i) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        >
          <img
            src={
              slide.url.startsWith("http")
                ? slide.url
                : `${import.meta.env.VITE_API_URL?.replace("/api", "") || ""}${slide.url}`
            }
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      ))}

      {slides.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 flex justify-center">
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Aller à l'image ${i + 1}`}
              aria-current={i === index}
              className="flex h-11 w-7 items-center justify-center"
            >
              <span
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-5 bg-violet-300" : "w-1.5 bg-white/60"
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
