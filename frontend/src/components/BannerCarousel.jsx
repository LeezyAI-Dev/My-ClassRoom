import React, { useEffect, useRef, useState } from "react";
import { fetchBannerImages } from "../api";
import fixedSlideImg from "../assets/banner-fixed-slide.png";

const SLIDE_INTERVAL = 4000; // temps d'affichage de chaque slide (ms)
const POLL_INTERVAL = 8000; // fréquence de vérification des nouvelles images du dev (ms)

// Premier slide, figé : image de la maquette, ne change jamais.
// Ce n'est pas une image réseau : elle est intégrée au code, donc toujours
// disponible même hors ligne dans l'application Android.
function FixedSlide() {
  return (
    <img
      src={fixedSlideImg}
      alt="Bienvenue sur votre espace élève"
      className="w-full h-full object-cover"
    />
  );
}

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

  // Slide figé toujours en premier, puis les images postées par le développeur.
  const slides = [{ type: "fixed", id: "fixed" }, ...devImages.map((img) => ({ type: "image", ...img }))];

  useEffect(() => {
    if (slides.length <= 1) return undefined;
    slideTimer.current = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, SLIDE_INTERVAL);
    return () => clearInterval(slideTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides.length]);

  useEffect(() => {
    if (index >= slides.length) setIndex(0);
  }, [slides.length, index]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0b1230]">
      {slides.map((slide, i) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        >
          {slide.type === "fixed" ? (
            <FixedSlide />
          ) : (
            <img
              src={
                slide.url.startsWith("http")
                  ? slide.url
                  : `${import.meta.env.VITE_API_URL?.replace("/api", "") || ""}${slide.url}`
              }
              alt=""
              className="w-full h-full object-cover"
            />
          )}
        </div>
      ))}

      {slides.length > 1 && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              onClick={() => setIndex(i)}
              aria-label={`Aller au slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? "w-5 bg-sky-400" : "w-1.5 bg-white/40"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
